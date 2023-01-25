const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const reviewSchema = new Schema({
    reviewText: {
        type: String,
        required: true 
    },
    rating:{
         type: Number,
         required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true,
    }
});

const Review = model('Review', reviewSchema);

module.exports = Review;