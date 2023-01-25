const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 20,
    }
});

const Category = model('Category', categorySchema);

module.exports = Category;