const { throwError, checkField } = require("../utils");
const ObjectId = require("mongoose").Types.ObjectId;

const UserSchema = require('../schemas/UserSchema'),
  MessageSchema = require('../schemas/MessageSchema');

class ChatController {
  udb = null;
  mdb = null;

  constructor(mongoose) {
    this.udb = mongoose.model('mc_users', UserSchema);
    this.mdb = mongoose.model('mc_messages', MessageSchema)
  }

  async auth(uid, token) {
    const res = await this.udb
      .findOne({ _id: ObjectId(uid) });
    if (res === null || res.token != token)
      return false;
    return true;
  }

  async sendMessage(req, response, userMap) {
    response.header("Content-Type", "application/json");

    if (!checkField(req.body, ["uid", "to", "type", "content", "token"])) {
      response.send(throwError(400, 1020, "Message field is invalid."));
      return;
    }
    const { uid, to, type, content, token } = req.body;

    if (!this.auth(uid)) {
      response.send(throwError(403, 1010, "Auth token is invalid."));
      return;
    }
    
    const res = await this.udb.findOne({ _id: ObjectId(to) });
    if (res == null) {
      response.send(throwError(403, 1011, "Target not exists."));
      return;
    }

    if (type == 'image' && content.length / 1024 / 1024 >= 2) {
      response.send(throwError(403, 1032, "Image too large."));
      return;
    }

    const ts = new Date();

    if (userMap[to]) {
      userMap[to].send(JSON.stringify({
        type: 'message',
        from: uid,
        payload: {
          from: 0,
          to,
          timestamp: Date.parse(ts),
          type,
          content,
          read: false
        }
      }));
    }

    await this.mdb.create({
      from: uid,
      to,
      timestamp: ts,
      type,
      content,
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
    const hasMap = new Map();

    const fromThisUser = await this.mdb.find({
      from: uid
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
          records: []
        };
      }
    }

    const toThisUser = await this.mdb.find({
      to: uid
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
          records: []
        };
      }
    }  
    
    for (const id in all) {
      const records = await this.mdb.find({
        $or: [
          {
            $and: [
              {from: uid, to: id}
            ]
          },
          {
            $and: [
              {from: id, to: uid}
            ]
          }
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
          read: record.read
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
      payload: all
    }));
  }
}

module.exports = ChatController;
