const { throwError, checkField } = require('../utils');

const ObjectId = require('mongoose').Types.ObjectId,
    UserSchema = require('../schemas/UserSchema');

class ProfileController {
    db = null;
    
    constructor(mongoose) {
        this.db = mongoose.model('mc_users', UserSchema);
    }

    // 身份验证
    async auth(uid, token) {
        const res = await this.db
            .findOne({ _id: ObjectId(uid) });
        
        if (res == null || res.auth_token != token)
            return false;
        return true;
    }

    // 获取好友列表
    async getFriends(req, response) {
        const { uid, token } = req.body;
        response.header("Content-Type", "application/json");

        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, 'Auth token is invalid.'));
            return;
        }
        
        const res = await this.db.findOne({ _id: ObjectId(uid) });
        const rawFriendList = JSON.parse(res.friends),
            friends = [];
        for (const i in rawFriendList) {
            const friendId = rawFriendList[i];
            const cur = await this.db
                .findOne({ _id: ObjectId(friendId) });
            if (cur == null)
                return;
            friends.push({
                uid: cur._id.toString(),
                username: cur.username,
                nickname: cur.nickname,
                avatar: cur.avatar,
                signature: cur.signature
            });
        }
        response.send(JSON.stringify({
            status: 200,
            payload: friends
        }));
    }

    // 添加好友
    async addFriends(req, response) {
        const { uid, token, friend } = req.body;
        response.header("Content-Type", "application/json");

        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, 'Auth token is invalid.'));
            return;
        }

        const res = await this.db.findOne({ username: friend }),
            currentUser = await this.db.findOne({ _id: ObjectId(uid) });
        if (!res) {
            response.send(throwError(404, 1015, 'Friends does not exist.'));
            return;
        }
        const currentFriends = JSON.parse(currentUser.friends);
        if (currentFriends.indexOf(res._id.toString()) >= 0) {
            response.send(throwError(404, 1016, 'already friends.'));
            return;
        }
        const resFriends = JSON.parse(res.friends);

        currentFriends.push(res._id.toString());
        resFriends.push(currentUser._id.toString());


        this.db.findOneAndUpdate({ _id: ObjectId(uid) }, {
            $set: {
                friends: JSON.stringify(currentFriends)
            }
        }, () => {});
        this.db.findOneAndUpdate({ _id: ObjectId(res._id) }, {
            $set: {
                friends: JSON.stringify(resFriends)
            }
        }, () => {});
        
        response.send(JSON.stringify({
            status: 200,
            payload: {
                username: res.username,
                uid: res._id,
                nickname: res.nickname,
                avatar: res.avatar,
                signature: res.signature
            }
        }));
    }

    // 修改个人资料
    async updateProfile(req, response) {
        const { uid, token, nickname, signature, mail } = req.body;
        response.header("Content-Type", "application/json");

        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, 'Auth token is invalid.'));
            return;
        }
        
        const res = await this.db.findOneAndUpdate({ _id: ObjectId(uid) }, {
            $set: {
                nickname,
                signature,
                mail
            }
        });

        if (res == null) {
            response.send(throwError(404, 1030, 'User does not exist.'));
            return;
        }
        response.send(JSON.stringify({
            status: 200,
            message: 'success'
        }));
    }

    // 上传头像
    async uploadAvatar(req, response) {
        response.header("Content-Type", "application/json");
        console.log(req.files);
    }
}

module.exports = ProfileController;