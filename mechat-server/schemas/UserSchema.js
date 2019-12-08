const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = new Schema({
    username: String,
    password: String,
    mail: String,
    nickname: String,
    signature: String,
    createTime: Date,
    online: Number,
    auth_token: String,
    avatar: String,
    friends: String,
    groups: String
});