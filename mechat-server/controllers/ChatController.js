const { throwError, checkField } = require("../utils");
const ObjectId = require("mongoose").Types.ObjectId;

const UserSchema = require('../schemas/UserSchema'),
  MessageSchema = require('../schemas/MessageSchema'),
  GroupSchema = require('../schemas/GroupSchema');

class ChatController {
  udb = null;
  mdb = null;
  gdb = null;

  constructor(mongoose) {
    this.udb = mongoose.model('mc_users', UserSchema);
    this.mdb = mongoose.model('mc_messages', MessageSchema)
    this.gdb = mongoose.model('mc_groups', GroupSchema);
  }

  // 验证用户身份
  async auth(uid, token) {
    const res = await this.udb
      .findOne({ _id: ObjectId(uid) });
    if (res === null || res.auth_token !== token)
      return false;
    return true;
  }

  // 接收信息发送请求
  async sendMessage(req, response, userMap) {
    response.header("Content-Type", "application/json");

    if (!checkField(req.body, ["uid", "to", "type", "content", "token", "target"])) {
      response.send(throwError(400, 1020, "Message field is invalid."));
      return;
    }
    const { uid, to, type, content, token, target } = req.body;

    if (!this.auth(uid, token)) {
      response.send(throwError(403, 1010, "Auth token is invalid."));
      return;
    }
    
    if (target === 'friends') {
      const res = await this.udb.findOne({ _id: ObjectId(to) });
      if (res == null) {
        response.send(throwError(403, 1011, "Target not exists."));
        return;
      }
    }

    if (type == 'image' && content.length / 1024 / 1024 >= 2) {
      response.send(throwError(403, 1032, "Image too large."));
      return;
    }

    const ts = new Date();


    if (target == 'friends' && userMap[to]) {
      userMap[to].send(JSON.stringify({
        type: 'message',
        from: uid,
        payload: {
          from: 0,
          to,
          timestamp: Date.parse(ts),
          type,
          content,
          target,
          read: false
        }
      }));
    } else if (target == 'group') {
      const group = await this.gdb.findOne({ _id: ObjectId(to) });
      if (!group)
        return;
      const users = JSON.parse(group.members);
      const sender = await this.udb.findOne({ _id: ObjectId(uid) });
      if (!sender)
        return;
      const senderId = sender._id.toString();
      users.forEach(user => {
        if (user === senderId)
          return;
        if (userMap[user]) {
          userMap[user].send(JSON.stringify({
            type: 'message',
            from: to,
            payload: {
              from: uid,
              avatar: sender.avatar,
              nickname: sender.nickname,
              to,
              timestamp: Date.parse(ts),
              type,
              content,
              target,
              read: false
            }
          }));
        }
      });
    }

    await this.mdb.create({
      from: uid,
      to,
      timestamp: ts,
      type,
      content,
      target,
      read: false
    });

    response.send(
      JSON.stringify({
        status: 200,
        message: "Send success."
      })
    );
  }

  async getMessageList(req, response) {
    response.header("Content-Type", "application/json");

    if (!checkField(req.body, ["uid", "token"])) {
      response.send(throwError(400, 1020, "field is invalid."));
      return;
    }
    const { uid, token } = req.body;

    if (!this.auth(uid, token)) {
      response.send(throwError(403, 1010, "Auth token is invalid."));
      return;
    }

    let all = {};

    const user = await this.udb.findOne({ _id: ObjectId(uid) });
    if (!user)
      return;

    const fromThisUser = await this.mdb.find({
      from: uid,
      target: 'friends'
    })
      .sort({ 'timestamp': -1 })
      .limit(200);
    
    for (const i in fromThisUser) {
      const item = fromThisUser[i];
      if (!all[item.to]) {
        const userInfo = await this.udb.findOne({
          _id: ObjectId(item.to)
        });

        all[item.to] = {
          with: item.to,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          last: Date.parse(item.timestamp),
          read: true,
          records: [],
          target: 'friends'
        };
      }
    }
    const toThisUser = await this.mdb.find({
      to: uid,
      target: 'friends'
    })
      .sort({ 'timestamp': -1 })
      .limit(200);
    for (const i in toThisUser) {
      const item = toThisUser[i];
      if (!all[item.from]) {
        const userInfo = await this.udb.findOne({
          _id: ObjectId(item.from)
        });

        all[item.from] = {
          with: item.from,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          last: Date.parse(item.timestamp),
          read: true,
          records: [],
          target: 'friends'
        };
      }
    }  

    const groupsList = JSON.parse(user.groups),
      groupsAll = {};
    for (const i in groupsList) {
      const groupId = groupsList[i],
        group = await this.gdb.findOne({ _id: ObjectId(groupId) });

      const curGroupMembers = {};

      if (!group)
        continue;

      const groupMessage = await this.mdb.find({ to: groupId, target: 'group' }).limit(200),
        parsedMessages = [];
      for (const j in groupMessage) {
        const item = groupMessage[j], parsedMessage = {
          from: item.from === uid ? 1 : 0,
          timestamp: Date.parse(item.timestamp),
          type: item.type,
          content: item.content,
          read: true,
          target: 'group'
        };

        if (!curGroupMembers[item.from]) {
          const thisUser = await this.udb.findOne({ _id: ObjectId(item.from) });
          if (!thisUser)
            continue;
          curGroupMembers[item.from] = thisUser;
        }
        parsedMessage.nickname = curGroupMembers[item.from].nickname;
        parsedMessage.avatar = curGroupMembers[item.from].avatar;        
        parsedMessages.push(parsedMessage);
      }
      if (parsedMessages.length)
        groupsAll[groupId] = {
          with: groupId,
          nickname: group.name,
          avatar: null,
          last: parsedMessages[parsedMessages.length - 1].timestamp,
          read: false,
          records: parsedMessages,
          target: 'group'
        };
    }

    
    for (const id in all) {
      const records = await this.mdb.find({
        $or: [
          { $and: [ {from: uid, to: id} ] },
          { $and: [ {from: id, to: uid} ]}
        ]
      })
        .sort({ 'timestamp': -1 })
        .limit(20);
      let tmp = [];
      for (const i in records) {
        const record = records[i],
          mode = record.from == uid ? 1 : 0;
        tmp.push({
          from: mode,
          timestamp: Date.parse(record.timestamp),
          type: record.type,
          content: record.content,
          read: record.read,
          target: 'friends'
        });
        if (!record.read && record.from == 0) {
          all[id].read = false;
          await this.mdb.findOneAndUpdate({ _id: ObjectId(record._id) }, { $set: { read: true } });
        }
      }
      tmp = tmp.reverse();
      all[id].records.push(...tmp);
    }

    response.send(JSON.stringify({
      status: 200,
      payload: {
        ...all,
        ...groupsAll
      }
    }));
  }
}

module.exports = ChatController;
