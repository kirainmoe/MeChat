const { throwError, checkField } = require("../utils");
const ObjectId = require("mongoose").Types.ObjectId;

const UserSchema = require('../schemas/UserSchema'),
  // MessageSchema = require('../schemas/MessageSchema'),
  GroupSchema = require('../schemas/GroupSchema');

class GroupController {
    udb = null;
    gdb = null;

    constructor(mongoose) {
        this.udb = mongoose.model('mc_users', UserSchema);
        this.gdb = mongoose.model('mc_groups', GroupSchema);
    }

    async auth(uid, token) {
        const res = await this.udb
          .findOne({ _id: ObjectId(uid) });
        if (res === null || res.token != token)
          return false;
        return true;
    }    

    async addGroupToUserProfile(uid, groupId, flag) {
        const user = await this.udb.findOne({
            _id: ObjectId(uid)
        });
        if (!user)
            return;
        const userGroup = JSON.parse(user.groups);
        if (userGroup.indexOf(groupId) != -1)
            return;
        userGroup.push(groupId);
        await this.udb.findOneAndUpdate({ _id: ObjectId(uid)},
            { $set: { groups: JSON.stringify(userGroup) } });
        if (flag) {
            const group = await this.gdb.findOne({ _id: ObjectId(groupId) });
            if (!group)
                return;
            const currentMember = JSON.parse(group.members);
            currentMember.push(uid);
            await this.gdb.findOneAndUpdate({ _id: ObjectId(groupId) }, {
                $set: { members: JSON.stringify(currentMember) }
            });
        }
    }

    async removeUserFromGroup(uid, groupId) {
        const user = await this.udb.findOne({
            _id: ObjectId(uid)
        });
        const group = await this.gdb.findOne({
            _id: ObjectId(groupId)
        });
        if (!user || !group)
            return;
        let userGroups = JSON.parse(user.groups),
            groupMembers = JSON.parse(group.members),
            groupIndex = userGroups.indexOf(groupId),
            userIndex = groupMembers.indexOf(uid);
        if (groupIndex >= 0)
            userGroups.splice(groupIndex, 1);
        if (userIndex >= 0)
            groupMembers.splice(userIndex, 1);
        this.udb.findOneAndUpdate({ _id: ObjectId(uid) }, {
            $set: {
                groups: JSON.stringify(userGroups)
            }
        }, () => {});
        this.gdb.findOneAndUpdate({ _id: ObjectId(groupId) }, {
            $set: {
                members: JSON.stringify(groupMembers)
            }
        }, () => {});
    }

    async getGroupMembers(rawMembers) {
        const members = [];
        rawMembers = JSON.parse(rawMembers);
        for (const j in rawMembers) {
            const user = await this.udb.findOne({ _id: ObjectId(rawMembers[j]) });
            if (user)
                members.push({
                    uid: user._id.toString(),
                    username: user.username, 
                    nickname: user.nickname,
                    avatar: user.avatar
                });
        }
        return members;
    }    

    async getUserGroups(req, response) {
        response.header("Content-Type", "application/json");

        if (!checkField(req.body, ['uid', 'token'])) {
            response.send(throwError(400, 1020, "Field is invalid."));
            return;
        }
        const { uid, token } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const user = await this.udb.findOne({ _id: ObjectId(uid) });
        if (!user) {
            response.send(throwError(400, 1024, "user not exists."));
            return;
        }

        const rawGroups = JSON.parse(user.groups);
        const groupsData = [];
        for (const i in rawGroups) {
            const groupInfo = await this.gdb.findOne({ _id: ObjectId(rawGroups[i]) });
            if (!groupInfo)
                continue;
            const id = groupInfo._id.toString();
            const members = await this.getGroupMembers(groupInfo.members);

            groupsData.push({
                id,
                name: groupInfo.name,
                description: groupInfo.description,
                createTime: Date.parse(groupInfo.createTime),
                admin: groupInfo.admin,
                members
            });
        }

        response.send(JSON.stringify({
            status: 200,
            payload: groupsData
        }));
    }

    async createGroup(req, response, userMap) {
        response.header("Content-Type", "application/json");

        if (!checkField(req.body, ['uid', 'token', 'name', 'description', 'members'])) {
            response.send(throwError(400, 1020, 'Field is invalid.'));
            return;
        }

        const { uid, token, name, description, members } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const finalMembers = JSON.parse(members);
        finalMembers.push(uid);

        const group = new this.gdb({
            name,
            description,
            members: JSON.stringify(finalMembers),
            createTime: new Date(),
            admin: JSON.stringify([ uid ])
        });

        const groupRecord = await group.save();

        const memberArray = JSON.parse(members);
        this.addGroupToUserProfile(uid, groupRecord._id.toString());
        memberArray.forEach(member => {
            this.addGroupToUserProfile(member, groupRecord._id.toString(), false);
            if (userMap[member]) {
                userMap[member].send(JSON.stringify({
                    type: 'groups',
                    payload: {
                        name,
                        description
                    }
                }));
            }
        });

        response.send(JSON.stringify({
            status: 200,
            message: 'Group created.'
        }));
    }

    async addGroup(req, response) {
        response.header("Content-Type", "application/json");

        if (!checkField(req.body, ['uid', 'token', 'groupId'])) {
            response.send(throwError(400, 1020, 'Field is invalid.'));
            return;
        }

        const { uid, token, groupId } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }
        this.addGroupToUserProfile(uid, groupId, true);
        const group = await this.gdb.findOne({ _id: ObjectId(groupId) });
        if (!group)
            return;
        response.send(JSON.stringify({
            status: 200,
            payload: {
                id: groupId,
                name: group.name,
                description: group.description,
                createTime: Date.parse(group.createTime),
                admin: group.admin,
                members: await this.getGroupMembers(group.members)
            }
        }));
    }

    async inviteToGroup(req, response, userMap) {
        response.header("Content-Type", "application/json");

        if (!checkField(req.body, ['uid', 'token', 'groupId', 'target'])) {
            response.send(throwError(400, 1020, 'Field is invalid.'));
            return;
        }

        const { uid, token, groupId, target } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }

        const user = await this.udb.findOne({ username: target });
        if (!user)
            return;
        const targetUid = user._id.toString();
        this.addGroupToUserProfile(targetUid, groupId, true);
        if (userMap[targetUid]) {
            userMap[targetUid].send(JSON.stringify({
                type: 'groups'
            }));
        }
        response.send(JSON.stringify({
            status: 200,
            message: 'processed'
        }));         
    }

    async exitGroup(req, response) {
        response.header("Content-Type", "application/json");

        if (!checkField(req.body, ['uid', 'token', 'groupId'])) {
            response.send(throwError(400, 1020, 'Field is invalid.'));
            return;
        }

        const { uid, token, groupId } = req.body;
        if (!this.auth(uid, token)) {
            response.send(throwError(403, 1010, "Auth token is invalid."));
            return;
        }
        this.removeUserFromGroup(uid, groupId);
        response.send(JSON.stringify({
            status: 200,
            message: 'processed'
        }));  
    }
}

module.exports = GroupController;