const mongoose = require('mongoose');
const {Schema, model} = mongoose;
const Order = require('./Order');
const bcrypt = require('bcrypt');
require('dotenv').config();
const admin = process.env.ADMIN_EMAIL;

const userSchema = new Schema({
    firstName: {
    type: String,
    required: true,
    trim: true 
    },
    lastName: {
        type: String,
        required: true,
        trim: true 
    },
    email: {
        type: String,
        required: true,
        unique: true ,
        match: [/.+@.+\..+/, 'Must match an email address!']
    },
    password: {
        type: String,
        required: true,
        match: [/^(?=.{8,}$)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?\W).*$/,'password must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character and have a length of at least of 8']
    },
    isAdmin:{
        type: Boolean,
        default: false
    },
    hasLeftReview:{
        type: Boolean,
        default: false
     },
     review:{
         type: Schema.Types.ObjectId,
         ref: 'Review'
     },
    orders:[Order.schema],
    address:{
        type: Schema.Types.ObjectId,
        ref: 'Address'
    }
});

// this pre save function will check for a admin email and set admin boolean either true or false
userSchema.pre('save', async function(next) {
    if(this.isNew || this.isModified('email')) {
        if(this.email === admin) {
            this.isAdmin = true;
        }
    }
    next();
});

/*this pre save function will hash our password*/
userSchema.pre('save', async function(next) {
    if(this.isNew || this.isModified('password')) {
        const saltRounds = 11;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});


userSchema.methods.isPasswordCorrect = async function(password) {
    return bcrypt.compare(password,this.password);
};

/**this should remove review if the user is deleted */
userSchema.post("remove", function(doc) {
   
    console.log(doc,'removed');
   
  });

const User = model('User', userSchema);

module.exports = User;
// [/^(?=.{8,}$)(?=.?[a-z])(?=.?[A-Z])(?=.?[0-9])(?=.?\W).*$/,'password must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character and have a length of at least of 8']

