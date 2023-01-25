const { AuthenticationError } = require('apollo-server-express');
const { Category, FileUpload, Order, Product, Blogpost, User, Review, Address } = require('../models');
const { signToken } = require('../utils/authorize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);




const resolvers = {
    Query:{
        getCategories: async (parent, args) => {
            return await Category.find().sort({createdAt: -1});
        },
        getFiles: async (parent, args) => {
            return await FileUpload.find().sort({createdAt: -1});
        },
        getProducts: async (parent,args) => {
            return await Product.find().populate('image').populate('category').sort({createdAt: -1});
        },
        getOrders: async (parent, args) => {
            return await Order.find().sort({createdAt: -1});
        },
        getBlogposts: async (parent, args) => {
            return await Blogpost.find().populate('blogPic').sort({createdAt: -1});
        },
        getUsers: async (parent, args) => {
            return await User.find().populate('review').populate('address').populate({
                path:'orders.products',
                populate:'category'
            }).sort({createdAt: -1});
        },
        getUserById: async (parent,{_id}) => {
            return await User.findOne({_id:_id}).populate('review').populate({
                
                path:'orders.products',
                populate:'category image',
                
                
           
            }).populate('address').sort({createdAt: -1});
        },
        getReviews: async  (parent,args) => {
            return await Review.find().populate('author').sort({createdAt: -1});
        },
        getReviewById: async (parent,{_id}) => {
            return await Review.findOne({_id:_id}).populate('author');
        },
        getCategoryById: async (parent,{_id}) => {
            return await Category.findOne({_id:_id});
        },
        getFileById: async (parent,{_id}) => {
            return await FileUpload.findOne({_id:_id});
        },
        getProductById: async (parent,{_id},) => {
            return await Product.findOne({_id:_id}).populate('image').populate('category');
        },
        getBlogpostById: async (parent ,{_id}) => {
            return await Blogpost.findById({_id:_id}).populate('blogPic');
        },
        checkout: async (parent,args, context) => {
            // initialize empty line items array
            const line_items = [];
            // this will get the referer url so we can use it f;or redirect upon a successfull transaction
            const url = new URL(context.headers.referer);
            const order = new Order({ products: args.products });
            const { products } = await order.populate('products');
             /**populate product image data*/
             for (let i = 0; i < products.length; i++) {
             await products[i].populate('image')
            }
            // add for loop to generate stripe products and id's as well as adding them to the line_items array
            for (let i = 0; i < products.length; i++) {
              // generate product id
              const product = await stripe.products.create({
                name: products[i].name,
                description: products[i].description,
                // the below images do not work in development!
                images: [`${products[i].image.Location}`]
              });
      //console.log(product);
              // generate price id using the product id
              const price = await stripe.prices.create({
                product: product.id,
                unit_amount: products[i].price * 100,
                currency: 'usd',
              });
      
              // add price id to the line items array
              line_items.push({
                price: price.id,
                quantity: 1
              });
      
            }
            // create a checkout session for stripe
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items,
              mode: 'payment',
              success_url: `${url}success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${url}`
            });
            return { session: session.id };
          }
    },
    Mutation: {
        addUser: async (parent,args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return {user, token};
        },
        loginUser: async (parent,{email,password}) => {
            const user = await User.findOne({ email });
            if(!user) {
                throw new AuthenticationError('incorrect credentials');
            }
            const correctPassword = await user.isPasswordCorrect(password);
            if(!correctPassword) {
                throw new AuthenticationError('incorrect credentials')
            }
            const token = signToken(user);
            return { user,token };
        },
        /**this update user will be used with current users or account holders*/
        updateUser: async (parent,{firstName,lastName,email},context) => {
            if(context.user) {
                const id = context.user._id;
                const updatedUser = await User.findByIdAndUpdate(
                    {_id: id},
                    {
                        firstName: firstName,
                        lastName: lastName,
                        email: email
                    },
                    { new: true, runValidators: true }
                );
              return updatedUser;
            }
            throw new AuthenticationError('no permissions');
        },
        AdminUpdateUser: async (parent,{_id,firstName,lastName,email},context) => {
            if(context.user.isAdmin) {
                
                const updatedUser = await User.findByIdAndUpdate(
                    {_id: _id},
                    {
                        firstName: firstName,
                        lastName: lastName,
                        email: email
                    },
                    { new: true, runValidators: true }
                );
              return updatedUser;
            }
            throw new AuthenticationError('you must be an admin to perform this operation');
        },
        deleteUser: async (parent,{_id},context) => {
          if(context.user._id === _id || context.user.isAdmin) {
            const user = await User.findById(_id);
            if(user.hasLeftReview === true){
            try{
                await Review.findByIdAndDelete(user.review._id);
                const deletedUser = await User.findOneAndDelete({_id:_id});
                console.log('deleting user and review block ran');
                return deletedUser;
            }catch(e) {
                console.log('delete review and user block',e);
             }
            }
               try{
                const deletedUser = await User.findOneAndDelete({_id:_id});
                console.log('only deleting user block ran');
                return deletedUser;
               }catch(e) {
                console.log('only delete user block',e);
               }
        
            }
           throw new AuthenticationError('it must actually be you account to delete!');
        },
        addReview: async (parent,{reviewText,rating},context) => {
            const currentUser = await User.findOne({_id:context.user._id});
           if(currentUser.hasLeftReview === false) {
                const usersReview = await Review.create(
                    {        
                    reviewText: reviewText,
                    rating: rating,
                    author: context.user._id
                } 
                );
                await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {
                    hasLeftReview: true,
                    review: usersReview
                   },
                   {new:true}  
                );
                return usersReview;
            }
            throw new AuthenticationError('looks like you have already left a review!');
        },
        deleteReview: async (parent,{_id},context) => {
            /*find review thats fed in to mutation*/
            const review = await Review.findById(_id);
            /*get author's id from the found review*/
            const author = review.author.toHexString();
            /*here we compare author id to the current users id if they match delete review if not throw error */
            if(author === context.user._id || context.user.isAdmin ) {
            const deletedReview = await Review.findOneAndDelete({_id:_id});
            try{await User.findByIdAndUpdate({_id:context.user._id},{hasLeftReview:false},{new:true});}
            catch(e){
                console.log('update user fail review delete',e);
            }
            return deletedReview;
            }
            throw new AuthenticationError('you must have made the review to delete it!')
        },
        updateReview: async (parent,{_id,reviewText,rating},context) => {
              /*find review thats fed in to mutation*/
              const review = await Review.findById(_id);
              /*get author's id from the found review*/
            const author = review.author.toHexString();
            const currentUser = context.user._id;
            console.log(author);
            console.log(currentUser);
            if(author === currentUser || context.user.isAdmin) {
                try {
                const updatedReview = await Review.findByIdAndUpdate(
                    {_id: _id},
                    {
                        reviewText: reviewText,
                        rating: rating
                    },
                    {new:true} 
                );
                return updatedReview;
                }catch(e) {
                    console.log(e);
                }
            }
          throw new AuthenticationError('to edit a review you must have created it and be logged in!');
        },
        addCategory: async (parent,args,context) => {
            if(context.user.isAdmin) {
                return await Category.create(args);
            }
            throw new AuthenticationError('you must be an admin to create a new category');
        },
        updateCategory: async (parent,args,context) => {
            if(context.user.isAdmin) {
                return await Category.findByIdAndUpdate(
                    {_id: args._id},
                    {name: args.name},
                    {new:true}
                );
            }
            throw new AuthenticationError('you must be an admin to update a category!');
        },
        deleteCategory: async (parent,args,context) => {
            if(context.user.isAdmin) {
                /**search for products belonging to category and store it in a variable*/
                const categoryHasProducts = await Product.find({category:args._id});
                console.log(categoryHasProducts);
                if(categoryHasProducts.length) {
                    //const error = 'category has active associated products'
                   // throw error;
                   throw new Error('category has active associated products! Please first delete those products')
                }else { 
                return await Category.findByIdAndDelete(args._id);
                }
            }
            throw new AuthenticationError('you must be an admin to delete a category');
        },
        addFile: async (parent,args) => {
         try{ 
            return await FileUpload.create(args);
         }catch(e) {
            console.log(e);
         }
        },
        deleteFile: async (parent,{_id}) => {
            try{
            return await FileUpload.findByIdAndDelete({_id:_id});
            }catch(e) {
                console.log(e);
            }
        },
        addProduct: async (parent,args,context) => {
             /*below checks to see if the context is empty*/
             const isEmpty = Object.keys(context).length === 0;
             /*if context is empty throw error meaning user is not logged in */
             if(isEmpty) {
                 throw new AuthenticationError('it appears you are not logged in');
             }
             if(context.user.isAdmin) {
                return await Product.create(args);
             }
             throw new AuthenticationError('you must be an admin to create a product!');
        },
        updateProduct: async (parent,{_id,name,description,price,quantity},context) => {
            /*below checks to see if the context is empty*/
            const isEmpty = Object.keys(context).length === 0;
            /*if context is empty throw error meaning user is not logged in */
            if(isEmpty) {
                throw new AuthenticationError('it appears you are not logged in');
            }
            /**if user is logged in and is an admin do update stuff */
            if(context.user.isAdmin) {
                return await Product.findByIdAndUpdate(
                    {_id:_id},
                    {
                 name: name,
                description: description,
                price: price,
                quantity: quantity
                    },
                    {new:true}

                ).populate('image').populate('category');
            }
/**if user is logged in but not an admin throw error */
            throw new AuthenticationError('you must be an admin to update a product!');
        
        },
        deleteProduct: async (parent,{_id},context) => {
            /*below checks to see if the context is empty*/
            const isEmpty = Object.keys(context).length === 0;
            /*if context is empty throw error meaning user is not logged in */
            if(isEmpty) {
                throw new AuthenticationError('it appears you are not logged in');
            }
            if(context.user.isAdmin){ 
             try {
                /**find the product */
                const productToDelete = await Product.findById({_id: _id});
                /**get image _id from product */
                const productImg_id = productToDelete.image.toHexString();
                /**delete associated product image from our db */
                await FileUpload.findByIdAndDelete({_id: productImg_id});
                /**delete the product */
            return await Product.findByIdAndDelete({_id:_id}).populate('category');
            }catch(e) {
                console.log(e);
            }
            };
            throw new AuthenticationError('you must be an admin to delete products');
        },
        addOrder: async (parent,{products},context) => {
             if(context.user) {
          const order = new Order({ products });
          await User.findOneAndUpdate({_id: context.user._id},{$push: {orders: order}});
          return order;
             }
             
                throw new AuthenticationError('you must be logged in to place an order!');
                
        },
        addBlogpost: async (parent,args,context) => {
             /*below checks to see if the context is empty*/
             const isEmpty = Object.keys(context).length === 0;
             /*if context is empty throw error meaning user is not logged in */
             if(isEmpty) {
                 throw new AuthenticationError('it appears you are not logged in');
             }
             if(context.user.isAdmin) {
                return await Blogpost.create(args)
             }
             throw new AuthenticationError('you must be an admin to create a blogpost');
        },
     updateBlogpost: async (parent,{_id,title,blogText,blogPic},context) => {
        // here we find the blogpost so we can get the old values
        const oldBlogpost = await Blogpost.findById(_id);
        console.log(oldBlogpost.blogPic.toHexString(),'OLD');
        console.log(blogPic,'NEW');
        
        /*Below we check to see if all our data has been fed with values if not we set variables to the old data
        so that we can run our update with the old data this allows a user to not need to fill out or change all data
        these variables will be used in the update action*/
        const titleToUse = title ? title : oldBlogpost.title;
        const blogTextToUse = blogText ? blogText : oldBlogpost.blogText;
        /**toHexString is used so it's not returning EXAMPLE:new ObjectId("834053408") */
        const blogPicToUse = blogPic ? blogPic : oldBlogpost.blogPic.toHexString();

         /*below checks to see if the context is empty*/
         const isEmpty = Object.keys(context).length === 0;
         /*if context is empty throw error meaning user is not logged in */
         if(isEmpty) {
             throw new AuthenticationError('it appears you are not logged in');
         }

         console.log(titleToUse);
         console.log(blogPicToUse,"PIC WE ARE USING");
         console.log(blogTextToUse);

         if(context.user.isAdmin) {

            /*if there is new blogPic data run delete on the old blogPost*/
            if(blogPic) {
                try{
                await FileUpload.findByIdAndDelete({_id: oldBlogpost.blogPic.toHexString()});
                console.log('backend old blogPost successfully killed!');
                }catch(e) {
                    console.log('backend edit blogPic file delete err',e);
                }
            }else{
                console.log('no new blogPic we are going with the old one!');
            }

           // return oldBlogpost.populate('blogPic');
            return await Blogpost.findOneAndUpdate(
                {_id:_id},
                {
                    title: titleToUse,
                    blogText: blogTextToUse,
                    blogPic: blogPicToUse
                },
                {new:true}
            ).populate('blogPic');
         }
         throw new AuthenticationError('you must be an admin to do this!');
     },
     deleteBlogpost: async (parent,{_id},context) => {
         /*below checks to see if the context is empty*/
         const isEmpty = Object.keys(context).length === 0;
         /*if context is empty throw error meaning user is not logged in */
         if(isEmpty) {
             throw new AuthenticationError('it appears you are not logged in');
         }
         if(context.user.isAdmin) {
            /**find the blogpost we want to delete so we can get blogpic _id */
            const blogPost = await Blogpost.findById({_id:_id});
            /**get the blogPic _id i.e. FileUpload _id */
            const blogPic_id = blogPost.blogPic.toHexString()
            console.log(blogPic_id);
            /**here we delete the blogpic */
       await FileUpload.findByIdAndDelete({_id: blogPic_id});
       /**delete the blogpost*/
            return await Blogpost.findByIdAndDelete({_id:_id});
         }
         throw new AuthenticationError('you must be an admin to do that!')

     },
     addAddress: async (parent,{streetAddress,city,state,zip,country},context) => {
        if(context.user) {
            const usersAddress = await Address.create(
                {
                    user: context.user._id,
                    streetAddress:streetAddress,
                    city:city,
                    state:state,
                    zip:zip,
                    country:country,
                });

             const userWithAddress = await User.findByIdAndUpdate(
                {_id: context.user._id},
                {address: usersAddress},
                {new: true}
            ).populate('address');
            return userWithAddress;
            
        }
        throw new AuthenticationError('your not logged in!');
     }
    }
};

module.exports = resolvers;
