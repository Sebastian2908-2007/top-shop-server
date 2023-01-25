const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const dayjs = require('dayjs');

const orderSchema = new Schema({
    purchaseDate: {
        type: Date,
        default: Date.now,
        get: timeStamp =>  dayjs(timeStamp).format('M/DD/YYYY h:m a') 
    },
    products:[
        {
            type: Schema.Types.ObjectId,
            ref:'Product',
            required: true
        }
    ]
});

const Order = model('Order', orderSchema);

module.exports = Order;