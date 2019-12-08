import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import "../styles/ChatPage.styl";
import { withRouter } from "react-router";
import config from "../config";
import honoka from "honoka";

@inject("store")
@observer
class ChatPage extends Component {
  getAvatar(avatar) {
    return config.apiUrl + "avatar/" + avatar;
  }

  componentDidMount() {
    document.onkeydown = (e) => {
      const keycode = e.which ? e.which : e.keyCode;
      if (e.ctrlKey && keycode === 13) {
        this.sendMessage();
      }
    };

    this.chatContent.scrollTop = this.chatContent.scrollHeight;
  }

  componentWillUnmount() {
    document.onkeydown = null;
  }

  renderChatContent() {
    const chats = [],
      uid = this.props.match.params.id,
      rawChats = this.props.store.getRawChats(uid),
      myAvatar = this.props.store.avatar;

    let cnt = 0;
    if (!rawChats.forEach) {
      this.props.store.reloadMessageList();
      return;
    }

    rawChats.forEach(chat => {
      chats.push(
        <div
          className={"mechat-chat-item" + (chat.from === 1 ? " from-me" : "")}
          key={cnt++}
        >
          <div className="mechat-chat-item-avatar">
            <img
              src={
                chat.from === 0
                  ? this.getAvatar(this.props.store.chattingWith.avatar)
                  : myAvatar
              }
              alt="avatar"
            />
          </div>
          <div className="mechat-chat-item-blob">{chat.content}</div>
        </div>
      );
    });
    return chats;
  }

  sendMessage() {
    const text = this.textarea.value,
      uid = this.props.match.params.id;
    this.props.store.sendMessage(uid, text, 'string');
    this.textarea.value = '';

    this.chatContent.scrollTop = this.chatContent.scrollHeight;

    honoka.post(config.apiUrl + 'sendMessage', {
      data: {
        uid: this.props.store.uid,
        to: uid,
        type: 'string',
        content: text,
        token: this.props.store.token
      }
    }).then(res => {
      if (res.status !== 200) {
        alert('发送信息失败，原因可能是：' + res.message);
        console.log(res);
        return;
      }
    });
  }

  render() {
    return (
      <div className="mechat-chat-page">
        <div className="mechat-chat-title">{this.props.store.chattingWith.nickname}</div>

        <div className="mechat-chat-content" ref={ref => this.chatContent = ref}>
          {(() => this.renderChatContent())()}
        </div>

        <div className="mechat-chat-textarea">
          <textarea name="chat-text" ref={ref => this.textarea = ref}></textarea>
          <button className="mechat-chat-send" onClick={() => this.sendMessage()}>发送</button>
        </div>
      </div>
    );
  }
}

export default withRouter(ChatPage);
