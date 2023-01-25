const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const fileUploadSchema = new Schema({
    ETag: {
        type: String,
        required: true 
    },
    Location: {
        type: String,
        required: true 
    },
    key: {
        type: String,
        required: false 
    },
    Key: {
        type: String,
        required: true 
    },
    Bucket: {
        type: String,
        required: true 
    }
});

const FileUpload = model('FileUpload', fileUploadSchema);

module.exports = FileUpload;