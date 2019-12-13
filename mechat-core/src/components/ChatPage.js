import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Bubble from './subcomponents/Bubble';

import "../styles/ChatPage.styl";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import config from "../config";
import honoka from "honoka";

@inject("store")
@observer
class ChatPage extends Component {
  componentDidMount() {
    document.onkeydown = e => {
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

    let cnt = 0,
      lastTime = 0;
    if (!rawChats.forEach) {
      this.props.store.reloadMessageList();
      return;
    }

    rawChats.forEach(chat => {
      // 处理信息接收时间间隔
      if (chat.timestamp - lastTime >= 1000000) {
        const date = new Date(chat.timestamp);
        let dateStr = "";
        dateStr +=
          date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
        dateStr += ":";
        dateStr +=
          date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        chats.push(
          <div key={cnt++} className={"mechat-chat-item-time"}>
            {dateStr}
          </div>
        );
        lastTime = chat.timestamp;
      }
      chats.push(
        <Bubble chat={chat} chatWith={this.props.store.chattingWith} myAvatar={myAvatar} key={cnt++}/>
      );
    });
    return chats;
  }

  changeScrollTop() {
    this.chatContent.scrollTop = this.chatContent.scrollHeight;
  }

  sendMessage() {
    const text = this.textarea.value,
      uid = this.props.match.params.id;
    this.props.store.sendMessage(uid, text, "string");
    this.props.store.setRead(uid);
    this.textarea.value = "";
    this.changeScrollTop();

    honoka
      .post(config.apiUrl + "sendMessage", {
        data: {
          uid: this.props.store.uid,
          to: uid,
          type: "string",
          content: text,
          token: this.props.store.token,
          target: 'friends'
        }
      })
      .then(res => {
        console.log(res);
        if (res.status !== 200) {
          alert("发送信息失败，原因可能是：" + res.message);
          console.log(res);
          return;
        }
      });
  }

  selectImage() {
    this.imageInput.click();
  }

  sendImage(raw) {
    const file = raw ? raw : this.imageInput.files[0];
    if (file.size / 1024 / 1024 > 2) {
      alert("发送的图片尺寸不能超过 2MB");
      return;
    }
    
    const reader = new FileReader(),
      uid = this.props.match.params.id;
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const base64Content = reader.result;
      this.props.store.sendMessage(uid, base64Content, "image");
      honoka.post(config.apiUrl + "sendMessage", {
        data: {
          uid: this.props.store.uid,
          to: uid,
          type: "image",
          content: base64Content,
          token: this.props.store.token,
          target: 'friends'
        }
      }).then(res => {
        if (res.status !== 200) {
          alert("发送信息失败，原因可能是：" + res.message);
          console.log(res);
          return;
        }
      });
    }
  }

  onClipboardPaste(e) {
    const item = e.clipboardData.items;
    if (!item.length)
      return;
    const blob = item[0].getAsFile();
    if (!blob || !blob.type || !blob.type.indexOf("image") === -1)
      return;
    this.sendImage(blob);
  }

  render() {
    const interval = setInterval(() => {
      if (!this.chatContent)
        return;
      this.changeScrollTop();
      clearInterval(interval);
    }, 50);

    return (
      <div className="mechat-chat-page" onPaste={e => this.onClipboardPaste(e)}>
        <div className="mechat-chat-title">
          <Link to={"/app/friends/" + this.props.match.params.id}>
            {this.props.store.chattingWith.nickname}
          </Link>
        </div>

        <div
          className="mechat-chat-content"
          ref={ref => (this.chatContent = ref)}
        >
          {(() => this.renderChatContent())()}
        </div>

        <div className="mechat-chat-textarea">
          <textarea
            name="chat-text"
            ref={ref => (this.textarea = ref)}
          ></textarea>
          <input
            accept="image/*"
            ref={ref => (this.imageInput = ref)}
            type="file"
            onChange={() => this.sendImage()}
          />
          <button
            className="mechat-chat-image"
            title="发送图片"
            onClick={() => this.selectImage()}
          >
            <i className="fa fa-image"></i>
          </button>
          <button
            className="mechat-chat-send"
            onClick={() => this.sendMessage()}
          >
            发送
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(ChatPage);
