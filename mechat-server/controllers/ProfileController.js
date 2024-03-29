const fs = require("fs");

const { throwError, checkField } = require("../utils");
const config = require("../config");

const ObjectId = require("mongoose").Types.ObjectId,
    UserSchema = require("../schemas/UserSchema");

class ProfileController {
    db = null;

    constructor(mongoose) {
        this.db = mongoose.model("mc_users", UserSchema);
    }

    uuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // 身份验证
    async auth(uid, token) {
        const res = await this.db.findOne({ _id: ObjectId(uid) });

        if (res == null || res.auth_token != token) return false;
        return true;
    }

    // 获取好友列表
    async getFriends(req, response) {
        const { uid, token } = req.body;
        response.header("Content-Type", "application/json");

        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const res = await this.db.findOne({ _id: ObjectId(uid) });
        const rawFriendList = JSON.parse(res.friends),
            friends = [];
        for (const i in rawFriendList) {
            const friendId = rawFriendList[i].uid;
            const cur = await this.db.findOne({ _id: ObjectId(friendId) });
            if (cur == null) return;
            friends.push({
                uid: cur._id.toString(),
                username: cur.username,
                nickname: cur.nickname,
                avatar: cur.avatar,
                signature: cur.signature,
                alias: rawFriendList[i].alias
            });
        }
        response.send(
            JSON.stringify({
                status: 200,
                payload: friends
            })
        );
    }

    // 添加好友
    async addFriends(req, response, userMap) {
        const { uid, token, friend } = req.body;
        response.header("Content-Type", "application/json");

        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const res = await this.db.findOne({ username: friend }),
            currentUser = await this.db.findOne({ _id: ObjectId(uid) });
        if (!res) {
            response.send(throwError(404, 1015, "Friends does not exist."));
            return;
        }
        const currentFriends = JSON.parse(currentUser.friends),
            resId = res._id.toString(),
            curId = currentUser._id.toString();

        if (currentFriends[resId]) {
            response.send(throwError(404, 1016, "already friends."));
            return;
        }
        const resFriends = JSON.parse(res.friends);

        currentFriends[resId] = {
            uid: resId,
            alias: ""
        };
        resFriends[curId] = {
            uid: currentUser._id.toString(),
            alias: ""
        };

        this.db.findOneAndUpdate(
            { _id: ObjectId(uid) },
            {
                $set: {
                    friends: JSON.stringify(currentFriends)
                }
            },
            () => {}
        );
        this.db.findOneAndUpdate(
            { _id: ObjectId(res._id) },
            {
                $set: {
                    friends: JSON.stringify(resFriends)
                }
            },
            () => {}
        );

        response.send(
            JSON.stringify({
                status: 200,
                payload: {
                    username: res.username,
                    uid: res._id,
                    nickname: res.nickname,
                    avatar: res.avatar,
                    signature: res.signature
                }
            })
        );

        if (userMap[resId]) {
            userMap[resId].send(
                JSON.stringify({
                    type: "friends",
                    payload: {
                        uid
                    }
                })
            );
        }
    }

    // 删除好友
    async deleteFriend(req, response) {
        response.header("Content-Type", "application/json");
        if (!checkField(req.body, ["uid", "token", "target"])) {
            response.send(throwError(403, 1020, "Field is invalid"));
            return;
        }
        const { uid, token, target } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const user1 = await this.db.findOne({ _id: ObjectId(uid) }),
            user2 = await this.db.findOne({ _id: ObjectId(target) });

        if (!user1 || !user2) return;

        const user1Friends = JSON.parse(user1.friends),
            user2Friends = JSON.parse(user2.friends);
        delete user1Friends[target];
        delete user2Friends[uid];

        await this.db.findOneAndUpdate(
            { _id: ObjectId(uid) },
            {
                $set: {
                    friends: JSON.stringify(user1Friends)
                }
            }
        );
        await this.db.findOneAndUpdate(
            { _id: ObjectId(target) },
            {
                $set: {
                    friends: JSON.stringify(user2Friends)
                }
            }
        );
        response.send(
            JSON.stringify({
                status: 200,
                message: "friends deleted"
            })
        );

        if (userMap[target]) {
          userMap[target].send(
              JSON.stringify({
                  type: "friends",
                  payload: {
                      uid
                  }
              })
          );
      }        
    }

    // 修改个人资料
    async updateProfile(req, response) {
        const { uid, token, nickname, signature, mail } = req.body;
        response.header("Content-Type", "application/json");

        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const res = await this.db.findOneAndUpdate(
            { _id: ObjectId(uid) },
            {
                $set: {
                    nickname,
                    signature,
                    mail
                }
            }
        );

        if (res == null) {
            response.send(throwError(404, 1030, "User does not exist."));
            return;
        }
        response.send(
            JSON.stringify({
                status: 200,
                message: "success"
            })
        );
    }

    // 修改备注
    async changeAlias(req, response) {
        response.header("Content-Type", "application/json");
        if (!checkField(req.body, ["uid", "token", "target", "alias"])) {
            response.send(throwError(400, 1020, "Field can not be empty."));
            return;
        }

        const { uid, token, target, alias } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const user = await this.db.findOne({ _id: ObjectId(uid) });
        if (!user) {
            response.send(throwError(400, 1024, "user not exists."));
            return;
        }
        const currentFriends = JSON.parse(user.friends);
        if (!currentFriends[target]) {
            response.send(throwError(400, 1025, "target not exists."));
            return;
        }
        currentFriends[target].alias = alias;
        await this.db.updateOne(
            { _id: ObjectId(uid) },
            {
                $set: {
                    friends: JSON.stringify(currentFriends)
                }
            }
        );
        response.send(
            JSON.stringify({
                status: 200,
                message: "successfully changed alias."
            })
        );
    }

    // 上传头像
    async uploadAvatar(req, response) {
        response.header("Content-Type", "application/json");
        if (
            !req.files ||
            !req.files.avatar ||
            req.files.avatar.type.match(/image/) === null ||
            !req.body.uid ||
            !req.body.token
        ) {
            response.send(throwError(400, 1020, "Field can not be empty."));
            return;
        }
        if (req.files.avatar.size / 1024 / 1024 >= 2) {
            response.send(throwError(400, 1032, "Avatar size can not larger than 2MB."));
            return;
        }
        const { uid, token } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }
        // copy to public avatar dir
        const fileType = req.files.avatar.originalFilename.match(
                /.*(\.[jpg|jpeg|png|gif|webp|bmp]*)/
            )[1],
            fileName = uid + "-" + this.uuid();
        fs.copyFile(req.files.avatar.path, config.avatarPath + fileName + fileType, () => {
            fs.unlinkSync(req.files.avatar.path);
        });
        const res = await this.db.findOneAndUpdate(
            { _id: ObjectId(uid) },
            {
                $set: {
                    avatar: String(fileName + fileType)
                }
            }
        );
        if (res.avatar != "defaultAvatar.jpg") fs.unlinkSync(config.avatarPath + res.avatar);
        response.send(
            JSON.stringify({
                status: 200,
                avatar: uid + fileType,
                message: "upload success."
            })
        );
    }
}

module.exports = ProfileController;
