const mongoose = require('mongoose');
const { Schema,model } = mongoose;
const FileUpload = require('./FileUpload');

const blogpostSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    blogText: {
        type: String,
        required: true,
        trim: true 
    },
    blogPic: {
      type: Schema.Types.ObjectId,
      ref:'FileUpload',
      required: true
    }
});

const Blogpost = model('Blogpost', blogpostSchema);

module.exports = Blogpost;
