const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = new Schema({
    createdBy: String,
    createTime: Date,
    content: String,
    images: String,
    type: Number,       // 1: post, 2: comment
    replyTo: String,
    likes: Number
});
    