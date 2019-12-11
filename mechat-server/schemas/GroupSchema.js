const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = new Schema({
    name: String,
    description: String,
    members: String,
    createTime: Date,
    admin: String
});
