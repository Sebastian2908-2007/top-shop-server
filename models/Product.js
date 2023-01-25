const mongoose = require('mongoose');
const { Schema, model } = mongoose;


const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: Schema.Types.ObjectId,
        ref:'FileUpload',
        required: true,
    },
    price:{
        type: Number,
        required: true,
        min:0.99
    },
    quantity: {
        type: Number,
        min: 0,
        default: 1
    },
    category: {
        type: Schema.Types.ObjectId,
        ref:'Category',
        required: true
    }
});

const Product = model('Product', productSchema);

module.exports = Product;