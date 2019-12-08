import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

import "../styles/ProfilePage.styl";
import config from "../config";

@inject("store")
@observer
class ProfilePage extends Component {  
  chatWith(uid, nickname, avatar) {
      if (!this.props.store.messageList[uid])
        this.props.store.addDialog(uid);
      this.props.store.setChattingWith(uid, nickname, avatar);
  }
  
  getAvatar(avatar) {
    return config.apiUrl + "avatar/" + avatar;
  }

  render() {
    const uid = this.props.match.params.id;
    let user;
    if (!this.props.store.uidKeyMap[uid]) {

    } else {
        user = this.props.store.uidKeyMap[uid];
    }
    console.log(user);
    return (
      <div className="mechat-profile-page">
        <p className="mechat-profile-title">个人资料</p>
        <div className="mechat-profile-container">
          <div className="mechat-profile-avatar">
            <img src={this.getAvatar(user.avatar)} alt="avatar" />
          </div>
          <div className="mechat-profile-meta">
            <h1 className="mechat-profile-nickname">{user.nickname}</h1>
            <p className="mechat-profile-account">MeChat 账号：{user.username}</p>

            <p className="mechat-profile-signature">签名：{user.signature ? user.signature : '无'}</p>

            <Link
              className="mechat-profile-chat"
              to={"/app/message/" + user.uid}
              onClick={() => this.chatWith(user.uid, user.nickname, user.avatar)}
            >
              聊天
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(ProfilePage);
