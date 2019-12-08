import { observable, action, get } from 'mobx';

import config from '../config';
import honoka from 'honoka';

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
        nickanme: null,
        avatar: null
    };
    @observable uidKeyMap = {};
    @observable fetching = false;

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
        this.nickname = user.nickname;
        this.username = user.username;
        this.signature = user.signature;
        this.uid = user.id;
        this.avatar = user.avatar;
        this.token = user.token;
        this.mail = user.mail;
    } 

    @action
    addFriend(friend) {
        this.friends.push(friend);
        this.uidKeyMap[friend.uid] = friend;
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
    connectSocketLink(socket) {
        this.socketLink = socket;
    }

    @action
    addDialog(uid) {
        this.messageList[uid] = {
            with: uid,
            nickname: this.uidKeyMap[uid].nickname,
            avatar: this.uidKeyMap[uid].avatar,
            last: Date.parse(new Date()),
            read: false,
            records: []
        };
    }

    @action
    replaceDialog(dialog) {
        this.messageList = dialog;
    }

    @action
    setChattingWith(uid, nickname, avatar) {
        this.chattingWith = {
            uid,
            nickname,
            avatar
        };
    }

    @action
    sendMessage(uid, content, type) {
        if (!this.messageList[uid]) {
            this.addDialog(uid);
        }
        const timestamp = Date.parse(new Date());
        this.messageList[uid].records.push({
            from: 1,
            timestamp: timestamp,
            type,
            content
        });
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
          this.replaceDialog(res.payload);
          this.fetching = false;
        });
    }

    @action
    pushNewMessage(from, msg) {
        console.log(from, this.messageList, this.uidKeyMap);
        if (!this.messageList[from]) {
            this.addDialog(from);
        }
        this.messageList[from].read = false;
        this.messageList[from].records.push(msg);
    }
}