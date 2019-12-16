import { observable, action, get } from 'mobx';

import config from '../config';
import honoka from 'honoka';

const defaultAvatar = require('../images/defaultAvatar.jpg');
const groupAvatar = require('../images/group.png');

export default class Model {
    // 当前登录用户信息
    @observable nickname = null;
    @observable username = null;
    @observable uid = null;
    @observable mail = null;
    @observable signature = null;
    @observable avatar = defaultAvatar;
    @observable token = null;

    // 当前登录用户好友和群聊
    @observable friends = [];
    @observable groups = [];
    @observable posts = [];
    @observable uidKeyMap = {};
    @observable groupKeyMap = {};

    @observable socketLink = null;          // 全局 WebSocket 对象
    @observable messageList = {};           // 消息列表
    @observable currentDialog = null;       // 当前会话信息
    @observable chattingWith = {
        uid: null,
        nickname: null,
        avatar: null
    };
    @observable fetching = false;           // 消息列表更新状态
    @observable router = null;              // react-router 全局路由对象
    @observable likes = {};

    // 后端 Restful API 链接
    @observable configUrl = {
        httpUrl: config.apiUrl,
        wsUrl: config.wsUrl
    };

    // 构建 API 地址
    @get
    API(uri, resource) {
        if (resource)
            return this.configUrl.httpUrl + uri + '/' + resource;
        return this.configUrl.httpUrl + uri;
    }
    @get
    wsAPI(uri) {
        return this.configUrl.wsUrl + uri;
    }

    // 获取和某一用户/群聊的聊天记录
    @get
    getRawChats(uid) {
        return this.messageList[uid] ? this.messageList[uid].records : {};
    }

    // 清空所有状态
    @action
    initModelState() {
        this.nickname = null;
        this.username = null;
        this.uid = null;
        this.mail = null;
        this.signature = null;
        this.avatar = defaultAvatar;
        this.token = null;
        this.friends = [];
        this.groups = [];
        this.posts = [];
        this.uidKeyMap = {};
        this.groupKeyMap = {};
        if (this.socketLink)
            this.socketLink.close();
        this.socketLink = null;
        this.messageList = {};
        this.currentDialog = null;
        this.chattingWith = {
            uid: null,
            nickname: null,
            avatar: null
        };
        this.fetching = false;
    }

    // 获取 react-router 路由对象
    @action
    setRouter(r) {
        this.router = r;
    }

    // 强制登出用户
    @action
    forceLogout(noAlert) {
        if (!noAlert)
            alert('身份验证发生问题，请重新登录');

        sessionStorage.removeItem('userInfo');
        this.initModelState();
        this.router.push('/');
    }

    // 设置当前登录用户信息
    @action
    setUserInfo(user) {
        this.nickname = user.nickname;
        this.username = user.username;
        this.signature = user.signature;
        this.uid = user.id;
        this.avatar = user.avatar;
        this.token = user.token;
        this.mail = user.mail;
    }

    // 设置新头像
    @action
    setNewAvatar(url, flag) {
        this.avatar = flag ? url : this.API('avatar', url);
    }

    // 添加好友操作
    @action
    addFriend(friend) {
        this.friends.push(friend);
        this.uidKeyMap[friend.uid] = friend;
    }

    // 添加群操作
    @action
    addGroup(group) {
        this.groups.push(group);
        this.groupKeyMap[group.id] = group;
    }

    // 更新、替换好友列表
    @action
    updateFriends(friends) {
        this.friends = friends;
        friends.forEach(friend => {
            this.uidKeyMap[friend.uid] = friend;
            if (this.messageList[friend.uid]) {
                this.messageList[friend.uid].nickname = friend.nickname;
                this.messageList[friend.uid].avatar = friend.avatar;
            }
        });
    }

    // 更新、替换群列表
    @action
    updateGroups(groups) {
        this.groups = groups;
        groups.forEach(group => {
            this.groupKeyMap[group.id] = group;
            if (this.messageList[group.id])
                this.messageList[group.id].nickname = group.name;
        });
    }

    // 创建并保存 websocket 链接
    @action
    connectSocketLink(socket) {
        this.socketLink = socket;
    }

    // 发起新的会话
    @action
    addDialog(uid, isGroup) {
        this.messageList[uid] = {
            with: uid,
            nickname: isGroup
                ? this.groupKeyMap[uid].name
                : this.uidKeyMap[uid].alias
                    ? this.uidKeyMap[uid].alias
                    : this.uidKeyMap[uid].nickname,
            avatar: isGroup ? groupAvatar : this.uidKeyMap[uid].avatar,
            last: Date.parse(new Date()),
            read: true,
            records: [],
            target: isGroup ? 'group' : 'friends'
        };
    }

    // 更新、替换会话列表
    @action
    replaceDialog(dialog) {
        for (const i in dialog)
            if (this.uidKeyMap[dialog[i].with] && this.uidKeyMap[dialog[i].with].alias)
                dialog[i].nickname = this.uidKeyMap[dialog[i].with].alias;
        this.messageList = dialog;
    }

    // 设置当前会话对象
    @action
    setChattingWith(uid, nickname, avatar) {
        this.chattingWith = {
            uid,
            nickname,
            avatar: this.API('avatar', avatar)
        };
    }

    // 发送消息，更新 UI
    @action
    sendMessage(uid, content, type, isGroup) {
        if (!this.messageList[uid]) {
            this.addDialog(uid);
        }
        const timestamp = Date.parse(new Date());
        let msg = {
            from: 1,
            timestamp: timestamp,
            type,
            content,
            target: isGroup ? 'group' : 'friends'
        };
        if (isGroup) {
            msg.avatar = this.avatar;
            msg.nickname = this.nickname;
        }
        this.messageList[uid].records.push(msg);
        this.messageList[uid].last = timestamp;
    }

    // 设置已读状态
    @action
    setRead(uid) {
        this.messageList[uid].read = true;
    }

    // 新消息推送
    @action
    pushNewMessage(from, msg) {
        if (!this.messageList[from]) {
            this.addDialog(from, msg.target === 'group');
            console.log(from, msg, 233);
        }
        this.messageList[from].read = false;
        this.messageList[from].records.push(msg);
        this.messageList[from].last = msg.timestamp;
    }

    // 新动态
    @action
    pushNewPost(id, content, images) {
        this.posts.unshift({
            _id: id,
            createdBy: this.uid,
            createTime: new Date(),
            content,
            nickname: this.nickname,
            avatar: this.avatar.replace(this.API('avatar'), ''),
            type: 1,
            images,
            comments: [],
        });
    }

    // 更新好友备注
    @action
    updateAlias(target, alias) {
        this.uidKeyMap[target].alias = alias;
        for (const i in this.friends) {
            if (this.friends[i].uid === target) {
                this.friends[i].alias = alias;
            }
        }
    }

    // 退出群聊
    @action
    exitGroup(groupId) {
        delete this.groupKeyMap[groupId];
        for (const i in this.groups)
            if (this.groups[i].id === groupId) {
                this.groups[i] = undefined;
                delete this.groups[i];
            }
        delete this.messageList[groupId];
    }

    // 删除好友
    @action
    deleteFriend(target) {
        delete this.uidKeyMap[target];
        for (const i in this.friends) {
            if (this.friends[i].uid === target) {
                this.friends[i] = undefined;
                delete this.friends[i];
            }
        }
        delete this.messageList[target];
    }

    // 更新消息列表
    @action
    reloadMessageList() {
        this.fetching = true;
        const MessageListUri = config.apiUrl + 'getMessageList';
        honoka.post(MessageListUri, {
            data: {
                uid: this.uid,
                token: this.token
            }
        }).then(res => {
            if (res.status === 403)
                this.forceLogout();
            if (res.status !== 200) {
                alert("拉取消息列表失败 :(");
                return;
            }
            this.replaceDialog(res.payload);
            this.fetching = false;
        });
    }

    // 更新好友列表
    @action
    reloadFriendsList() {
        // get friends list
        honoka.post(this.API('friends'), {
            data: {
                uid: this.uid,
                token: this.token
            }
        }).then(res => {
            if (res.status === 403)
                this.forceLogout();
            else if (res.status === 200)
                this.updateFriends(res.payload);
            else
                console.log('model.reloadFriendsList', res);
        });
    }

    // 更新群聊列表
    @action
    reloadGroupList() {
        // get groups list
        const groupUri = this.API('getUserGroups');
        honoka.post(groupUri, {
            data: {
                uid: this.uid,
                token: this.token
            }
        }).then(res => {
            if (res.status === 403)
                this.forceLogout();
            else if (res.status === 200)
                this.updateGroups(res.payload);
            else
                console.log('model.reloadGroupList', res);
        });
    }

    // 更新好友动态
    @action
    reloadPostList() {
        const postUri = this.API('getFriendsPost');
        honoka.post(postUri, {
            data: {
                uid: this.uid,
                token: this.token
            }
        }).then(res => {
            if (res.status === 403)
                this.forceLogout();
            else if (res.status === 200)
                this.posts = res.payload;
            else
                console.log('model.reloadPostList', res);
        })
    }

    // 点赞
    @action
    likePost(id) {
        this.likes[id] = this.likes[id] ? false : true;
        for (const i in this.posts) {
            if (this.posts[i]._id === id) {
                this.posts[i].likes += (this.likes[id] ? 1 : -1);
                break;
            }
        }
    }

    // 删除
    @action
    deletePost(id) {
        for (const i in this.posts) {
            if (this.posts[i]._id === id) {
                this.posts.splice(i, 1);
                break;
            }
        }
    }
}