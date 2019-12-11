const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = new Schema({
    from: String,
    to: String,
    timestamp: Date,
    type: String,
    content: String,
    read: Boolean,
    target: String
});