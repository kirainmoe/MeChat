import { observable, action, get } from 'mobx';

import config from '../config';
import honoka from 'honoka';

const groupAvatar = require('../images/group.png');

export default class Model {
    @observable nickname = null;
    @observable username = null;
    @observable uid = null;
    @observable mail = null;
    @observable signature = null;
    @observable avatar = require('../images/defaultAvatar.jpg');
    @observable token = null;
    @observable friends = [];
    @observable groups = [];

    @observable socketLink = null;
    @observable messageList = {};
    @observable currentDialog = null;
    @observable chattingWith = {
        uid: null,
        nickname: null,
        avatar: null
    };
    @observable uidKeyMap = {};
    @observable groupKeyMap = {};
    @observable fetching = false;

    // Global config url
    @observable configUrl = {
        httpUrl: config.apiUrl,
        wsUrl: config.wsUrl
    };
 
    @get
    getRawChats(uid) {
        if (!this.messageList[uid]) {
            return {};
        }
        return this.messageList[uid].records;
    }

    @get
    API(uri) {
        return this.configUrl.httpUrl + uri;
    }

    @get
    wsAPI(uri) {
        return this.configUrl.wsUrl + uri;
    }

    @action
    setUserInfo(user) {
        console.log(user);
        this.nickname = user.nickname;
        this.username = user.username;
        this.signature = user.signature;
        this.uid = user.id;
        this.avatar = user.avatar;
        this.token = user.token;
        this.mail = user.mail;
    } 

    @action
    setNewAvatar(url, flag) {
        if (!flag)
            this.avatar = this.API('avatar/') + url;
        else
            this.avatar = url;
    }

    @action
    addFriend(friend) {
        this.friends.push(friend);
        this.uidKeyMap[friend.uid] = friend;
    }

    @action
    addGroup(group) {
        this.groups.push(group);
        this.groupKeyMap[group.id] = group;
    }

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

    @action
    updateGroups(groups) {
        this.groups = groups;
        groups.forEach(group => {
            this.groupKeyMap[group.id] = group;
            if (this.messageList[group.id])
                this.messageList[group.id].nickname = group.name;
        });
    }

    @action
    connectSocketLink(socket) {
        this.socketLink = socket;
    }

    @action
    addDialog(uid, isGroup) {
        if (!isGroup)
            this.messageList[uid] = {
                with: uid,
                nickname: this.uidKeyMap[uid].alias ? this.uidKeyMap[uid].alias : this.uidKeyMap[uid].nickname,
                avatar: this.uidKeyMap[uid].avatar,
                last: Date.parse(new Date()),
                read: true,
                records: [],
                target: 'friend'
            };
        else {
            this.messageList[uid] = {
                with: uid,
                nickname: this.groupKeyMap[uid].name,
                avatar: groupAvatar,
                last: Date.parse(new Date()),
                read: true,
                records: [],
                target: 'group'
            };
        }
    }

    @action
    replaceDialog(dialog) {
        for (const i in dialog) 
            if (this.uidKeyMap[dialog[i].with] && this.uidKeyMap[dialog[i].with].alias)
                dialog[i].nickname = this.uidKeyMap[dialog[i].with].alias;
        this.messageList = dialog;
    }

    @action
    setChattingWith(uid, nickname, avatar) {
        this.chattingWith = {
            uid,
            nickname,
            avatar: this.API('avatar/') + avatar
        };
    }

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
        // todo: sort message list
    }

    @action
    setRead(uid) {
        this.messageList[uid].read = true;
    }

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
          if (res.status !== 200) {
            alert("拉取消息列表失败 :(");
            return;
          }
          console.log(res.payload, 233);
          this.replaceDialog(res.payload);
          this.fetching = false;
        });
    }

    @action
    pushNewMessage(from, msg) {
        if (!this.messageList[from]) {
            this.addDialog(from, msg.target == 'group');
            console.log(from, msg, 233);
        }
        this.messageList[from].read = false;
        this.messageList[from].records.push(msg);
        this.messageList[from].last = msg.timestamp;
    }

    @action
    updateAlias(target, alias) {
        this.uidKeyMap[target].alias = alias;
        for (const i in this.friends) {
            if (this.friends[i].uid === target) {
                this.friends[i].alias = alias;
            }
        }
    }
}