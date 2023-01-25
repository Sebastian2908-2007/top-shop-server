const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const addressSchema = new Schema({
 user:{
    type: Schema.Types.ObjectId,
    ref:'Address',
    required: true 
 },   
streetAddress: {
    type: String,
    requred: true 
},
city:{
    type: String,
    requred: true   
},
state:{
    type: String,
    requred: true 
},
zip:{
    type: String,
    requred: true 
},
country:{
    type: String,
    requred: true 
}
});

const Address = model('Address',addressSchema);

module.exports = Address;