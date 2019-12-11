import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

import honoka from "honoka";

const groupAvatar = require('../images/group.png');

@inject("store")
@observer
class GroupPage extends Component {
  chatWith(uid, nickname) {
      if (!this.props.store.messageList[uid])
        this.props.store.addDialog(uid, true);
      this.props.store.setChattingWith(uid, nickname, groupAvatar);
  }
  
  render() {
    const id = this.props.match.params.id;
    let group = this.props.store.groupKeyMap[id];
    return (
      <div className="mechat-profile-page">
        <p className="mechat-profile-title">群资料</p>
        <div className="mechat-profile-container">
          <div className="mechat-profile-avatar">
            <img src={groupAvatar} alt="avatar" />
          </div>
          <div className="mechat-profile-meta">
            <h1 className="mechat-profile-nickname">{group.name}</h1>
            <p className="mechat-profile-account">群 ID：{group.id}</p>

            <p className="mechat-profile-signature">简介：{group.description}</p>

            <Link
              className="mechat-profile-chat"
              to={"/app/groupMessage/" + group.id}
              onClick={() => this.chatWith(group.id, group.name)}
            >
              聊天
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(GroupPage);
