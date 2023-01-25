const { gql } = require('apollo-server-express');

const typeDefs = gql`
type Category {
    _id: ID
    name: String!
}
 type FileUpload {
    _id: ID
    ETag: String!
    Location: String!
    key: String
    Key: String!
    Bucket: String!
 }
 type Product {
    _id: ID
    name: String !
    description: String !
    image: FileUpload
    price: Int !
    quantity: Int  
    category: Category !
 }

 type Order {
    _id: ID
    purchaseDate: String
    products:[Product]
 }

 type Blogpost {
    _id: ID
    title: String !
    blogText: String !
    blogPic: FileUpload
 }

type Review {
   _id: ID
   reviewText: String!
   rating: Int!
   author: User
}

type UserAuth {
   user: User!
   token: ID!
}

 type User {
   _id: ID
   firstName: String!
   lastName: String!
   email: String!
   password: String!
   isAdmin: Boolean
   hasLeftReview: Boolean
   review: Review
   orders:[Order]
   address: Address
 }

 type Checkout {
    session: ID
  }

  type Address {
   _id: ID
   user: User!
   streetAddress: String!
   city: String!
   state: String!
   zip: String!
   country: String!
  }

type Query {
    getCategories:[Category]
    getFiles:[FileUpload]
    getProducts:[Product]
    getOrders:[Order]
    getBlogposts:[Blogpost]
    getUsers:[User]
    getUserById(_id:ID!): User
    getReviews:[Review]
    getReviewById(_id:ID!):Review
    getCategoryById(_id:ID!):Category
    getFileById(_id:ID!):FileUpload
    getProductById(_id:ID!): Product
    getBlogpostById(_id:ID!): Blogpost
    checkout(products: [ID]!): Checkout
}

type Mutation {
   addUser(firstName:String!,lastName:String!,email:String!,password:String!): UserAuth
   loginUser(email:String!,password:String!): UserAuth
   updateUser(firstName:String,lastName:String,email:String): User
   AdminUpdateUser(_id: ID! firstName:String,lastName:String,email:String): User
   deleteUser(_id:ID): User
   addReview(reviewText:String! rating:Int!): Review
   deleteReview(_id:ID!): Review
   updateReview(_id:ID!,reviewText:String!,rating:Int!): Review
   addCategory(name:String!):Category
   updateCategory(_id:ID!,name:String!):Category
   deleteCategory(_id: ID!): Category
   addFile(ETag:String!,Location:String!,key:String,Key:String!,Bucket:String!): FileUpload
   deleteFile(_id:ID!): FileUpload
   addProduct(name:String!,description:String!,image:ID!,price:Int!,quantity:Int,category:ID!): Product
   updateProduct(_id:ID!,name:String,description:String,price:Int,quantity:Int): Product
   deleteProduct(_id:ID!): Product
   addOrder(products:[ID!]): Order
   addBlogpost(title:String!,blogText:String!,blogPic:ID!): Blogpost
   updateBlogpost(_id:ID!,title:String,blogText:String,blogPic:ID): Blogpost
   deleteBlogpost(_id:ID!): Blogpost
   addAddress(streetAddress:String!,city:String!,state:String!,zip:String!,country:String!): User
}
`;

module.exports = typeDefs;