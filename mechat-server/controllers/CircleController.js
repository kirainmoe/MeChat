const { throwError, checkField } = require("../utils");
const ObjectId = require("mongoose").Types.ObjectId;

const UserSchema = require("../schemas/UserSchema"),
    CircleSchema = require("../schemas/CircleSchema");

class CircleController {
    udb = null;
    cdb = null;
    userList = {};

    constructor(mongoose) {
        this.udb = mongoose.model("mc_users", UserSchema);
        this.cdb = mongoose.model("mc_circles", CircleSchema);
    }

    // 验证用户身份
    async auth(uid, token) {
        const res = await this.udb.findOne({ _id: ObjectId(uid) });
        if (res === null || res.auth_token !== token) return false;
        return true;
    }

    async getUserInfo(uid) {
        const user = await this.udb.findOne({ _id: ObjectId(uid) });
        if (!user) return null;
        this.userList[uid] = user;
        return user;
    }

    // 发送朋友圈
    async createPost(req, response) {
        response.header("Content-Type", "application/json");
        if (!checkField(req.body, ["uid", "token", "content"])) {
            response.send(throwError(403, 1020, "Field is invalid"));
            return;
        }

        const { uid, token, content } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid"));
            return;
        }

        // 处理图片上传
        const images = [];
        if (req.files && req.files.images) {
            console.log(req.files);
        }

        // 写入数据库
        const status = new this.cdb({
            createdBy: uid,
            createTime: new Date(),
            content,
            images: JSON.stringify(images),
            type: req.body.type ? req.body.type : 1,
            replyTo: req.body.replyTo ? req.body.replyTo : null,
            likes: 0
        });
        const res = await status.save();
        response.send(
            JSON.stringify({
                status: 200,
                message: "post success.",
                payload: {
                    id: res._id.toString()
                }
            })
        );
    }

    // 构建评论树
    async buildCommentsTree(postId) {
        const res = [];
        const posts = await this.cdb.find({
            type: 2,
            replyTo: String(postId)
        });
        if (!posts) return res;
        for (const i in posts) {
            const post = posts[i],
                user = this.userList[post.createdBy]
                    ? this.userList[post.createdBy]
                    : await this.getUserInfo(post.createdBy);
            let nextComments = await this.buildCommentsTree(post);
            res.push({
                ...post,
                nickname: user.nickname,
                avatar: user.avatar,
                comments: nextComments
            });
        }
        return res;
    }

    // 获取好友动态
    async getFriendsPost(req, response) {
        response.header("Content-Type", "application/json");
        if (!checkField(req.body, ["uid", "token"])) {
            response.send(throwError(403, 1020, "Field is invalid"));
            return;
        }
        const { uid, token } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid"));
            return;
        }

        // 获取用户信息和好友列表
        const user = await this.udb.findOne({ _id: ObjectId(uid) });
        if (!user) return;
        const posts = [],
            rawFriends = JSON.parse(user.friends),
            curDate = new Date();
            rawFriends[uid] = { uid };
        for (const i in rawFriends) {
            const curFriend = rawFriends[i];
            // 获取当前好友信息
            const friendInfo = this.userList[curFriend.uid]
                ? this.userList[curFriend.uid]
                : await this.getUserInfo(curFriend.uid);
            if (!friendInfo) continue;

            // 获取来自该好友的动态
            const postsFromThisFriend = await this.cdb.find({
                createdBy: curFriend.uid,
                createTime: { $gte: new Date(curDate.getTime() - 24 * 60 * 60 * 1000 * 3) }, // 3天内的动态
                type: 1
            });
            if (!postsFromThisFriend) continue;

            // 处理动态，构建评论树
            for (const j in postsFromThisFriend) {
                const curPost = postsFromThisFriend[j],
                    comments = await this.buildCommentsTree(curPost._id.toString());
                posts.push({
                    ...curPost._doc,
                    nickname: friendInfo.nickname,
                    avatar: friendInfo.avatar,
                    comments
                });
            }
        }

        posts.sort((a, b) => {
            return a.createTime > b.createTime ? -1 : 1;
        });
        response.send(
            JSON.stringify({
                status: 200,
                payload: posts
            })
        );
    }

    // 点赞 & 取消
    async likePost(req, response) {
        response.header("Content-Type", "application/json");
        if (!checkField(req.body, ["uid", "token", "target", "offset"])) {
            response.send(throwError(403, 1020, "Field is invalid"));
            return;
        }
        const { uid, token, target, offset } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid"));
            return;
        }
        await this.cdb.findOneAndUpdate({
            _id: ObjectId(target)
        }, { $inc: { likes: Number(offset) } });
        response.send(JSON.stringify({
            status: 200,
            message: 'processed'
        }));
    }

    // 删除动态
    async deletePost(req, response) {
        response.header("Content-Type", "application/json");
        if (!checkField(req.body, ["uid", "token", "target"])) {
            response.send(throwError(403, 1020, "Field is invalid"));
            return;
        }
        const { uid, token, target } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid"));
            return;
        }
        const post = await this.cdb.findOne({ _id: ObjectId(target) });
        if (!post || post.createdBy !== uid)
            return;
        await this.cdb.remove({
            _id: ObjectId(target)
        });
        response.send(JSON.stringify({
            status: 200,
            message: 'processed'
        }));        
    }
}

module.exports = CircleController;
