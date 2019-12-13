import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

import "../styles/ProfilePage.styl";
import config from "../config";
import honoka from "honoka";

@inject("store")
@observer
class ProfilePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modifyAlias: false
    };
  }

  chatWith(uid, nickname, avatar) {
    if (!this.props.store.messageList[uid]) this.props.store.addDialog(uid);
    this.props.store.setChattingWith(uid, nickname, avatar);
  }

  getAvatar(avatar) {
    return config.apiUrl + "avatar/" + avatar;
  }

  changeAlias() {
    this.setState({
      modifyAlias: true
    });
  }

  forceLogout() {
    alert("身份验证失败，请重新登录。");

    sessionStorage.removeItem("userInfo");
    this.props.history.push("/");
  }

  confirmChange() {
    const target = this.props.match.params.id,
      alias = this.aliasInput.value;
    honoka
      .post(this.props.store.API("changeAlias"), {
        data: {
          uid: this.props.store.uid,
          token: this.props.store.token,
          target,
          alias
        }
      })
      .then(res => {
        if (res.status === 403)
          this.forceLogout();
        else {
          if (res.status === 200) {
            this.props.store.updateAlias(target, alias);
            this.setState({
              modifyAlias: false
            });
          }
        }
      });
  }

  deleteFriend() {
    const uid = this.props.store.uid,
      token = this.props.store.token,
      target = this.props.match.params.id;
    honoka.post(this.props.store.API('deleteFriend'), {
      data: {
        uid,
        token,
        target
      }
    }).then(res => {
      if (res.status === 403)
        this.forceLogout();
      else {
        if (res.status === 200) {
          alert('删除好友成功。');
          this.props.store.deleteFriend(target);
        }
      }
    });
  }

  render() {
    const uid = this.props.match.params.id;
    let user = this.props.store.uidKeyMap[uid];
    if (!user)
      return null;

    return (
      <div className="mechat-profile-page">
        <p className="mechat-profile-title">个人资料</p>
        <div className="mechat-profile-container">
          <div className="mechat-profile-avatar">
            <img src={this.getAvatar(user.avatar)} alt="avatar" />
          </div>
          <div className="mechat-profile-meta">
            <h1 className="mechat-profile-nickname">{user.nickname}</h1>
            <p className="mechat-profile-alias">
              备注：{user.alias ? user.alias : "无"}
              <span
                className="mechat-profile-alias-change"
                onClick={() => this.changeAlias()}
              >
                修改备注
              </span>
            </p>
            <p
              className="mechat-profile-alias-input"
              style={{
                display: this.state.modifyAlias ? "block" : "none"
              }}
            >
              <input
                type="text"
                defaultValue={user.alias}
                ref={ref => (this.aliasInput = ref)}
              />
              <button
                className="mechat-profile-alias-confirm"
                onClick={() => this.confirmChange()}
              >
                确定
              </button>
            </p>
            <p className="mechat-profile-account">
              MeChat 账号：{user.username}
            </p>

            <p className="mechat-profile-signature">
              签名：{user.signature ? user.signature : "无"}
            </p>

            <Link
              className="mechat-profile-chat"
              to={"/app/message/" + user.uid}
              onClick={() =>
                this.chatWith(user.uid, user.nickname, user.avatar)
              }
            >
              聊天
            </Link>
            <button
              className="mechat-profile-exit"
              onClick={() => this.deleteFriend()}
            >
              删除好友
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(ProfilePage);
