const { throwError, checkField, md5 } = require('../utils');

const UserSchema = require('../schemas/UserSchema');

class UserController {
    db = null;
    userDb = null;
    
    constructor(mongoose) {
        this.db = mongoose;
        this.userDb = mongoose.model('mc_users', UserSchema);
    }

    generateAuthToken(username, password) {
        return md5(username + password + Date.parse(new Date()));
    }

    async register(request, response) {
        const body = request.body;

        if (!checkField(body, ['username', 'password', 'mail', 'nickname'])) {
            response.send(throwError(400, 1001, 'Field can not be empty.'));
            return;
        }

        if (body.username.match( /[`~!@#$%^&*()\+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im)) {
            response.send(throwError(400, 1004, 'Special chars are not allowed.'));
            return;
        }

        const currentUsers = await this.userDb.findOne({
            $or: [
                {'username': body.username},
                {'mail': body.mail}
            ]
        });
        if (currentUsers != null) {
            response.send(throwError(403, 1002, 'User exists'));
            return;
        }

        const { username, password, mail, nickname } = body;
        const r = await this.userDb.create({
                username,
                password: md5(password),
                mail,
                nickname,
                signature: '',
                createTime: new Date(),
                online: 0,
                auth_token: '',
                friends: '{}',
                groups: '[]',
                avatar: 'defaultAvatar.jpg'
        });

        console.log(`New user ${username} has registered!`);
        response.send(JSON.stringify({
            status: 200,
            message: 'Registered successfully.'
        }));
    }

    async login(request, response) {
        const body = request.body;

        if (!checkField(body, ['username', 'password'])) {
            response.send(throwError(400, 1001, 'Field can not be empty.'));
            return;
        }

        const { username } = body;
        const password = md5(body.password);

        const user = await this.userDb.findOne({
            $or: [
                {'username': username},
                {'mail': username}
            ]
        });
        
        if (!user) {
            response.send(throwError(403, 1005, 'User does not exist.'));
            return;
        }

        if (user.password != password) {
            response.send(throwError(403, 1006, 'Password is incorrect.'));
            return;
        }

        const token = this.generateAuthToken(username, password),
            { _id, nickname, mail, friends, groups, avatar, signature } = user;
        await this.userDb.updateOne({ username }, {
            $set: {
                auth_token: token
            }
        });

        response.send(JSON.stringify({
            status: 200,
            id: _id,
            username,
            nickname,
            mail,
            friends,
            groups,
            token,
            avatar,
            signature
        }));
    }

    async getUserAvatar(username) {
        const res = await this.userDb.findOne({
            $or: [
                {username},
                {mail: usename}
            ]
        });
        if (!res) {
            response.send(throwError(403, 1005, 'User does not exist.'));
            return;
        }
        if (res.avatar) {
            response.send(JSON.stringify({
                status: 200,
                avatar: res.avatar
            }));
        } else {
            response.send(JSON.stringify({
                status: 200,
                avatar: 'defaultAvatar.jpg'
            }))
        }
    }
}

module.exports = UserController;
