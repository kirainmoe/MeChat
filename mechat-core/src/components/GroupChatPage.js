import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Bubble from "./subcomponents/Bubble";

import "../styles/GroupChatPage.styl";
import { withRouter } from "react-router";
import honoka from "honoka";

@inject("store")
@observer
class GroupChatPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inviting: false
        };
    }

    componentDidMount() {
        document.onkeydown = e => {
            const keycode = e.which ? e.which : e.keyCode;
            if (e.ctrlKey && keycode === 13) {
                this.sendMessage();
            }
        };
        window.browserWindow.getCurrentWindow().setSize(1000, 600);

        this.chatContent.scrollTop = this.chatContent.scrollHeight;
    }

    componentWillUnmount() {
        document.onkeydown = null;
        window.browserWindow.getCurrentWindow().setSize(800, 600);
    }

    onClipboardPaste(e) {
        const item = e.clipboardData.items;
        if (!item.length) return;
        const blob = item[0].getAsFile();
        if (!blob || !blob.type || !blob.type.indexOf("image") === -1) return;
        this.sendImage(blob);
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
                dateStr += date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                dateStr += ":";
                dateStr += date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                chats.push(
                    <div key={cnt++} className={"mechat-chat-item-time"}>
                        {dateStr}
                    </div>
                );
                lastTime = chat.timestamp;
            }
            chats.push(
                <Bubble
                    chat={chat}
                    chatWith={this.props.store.chattingWith}
                    myAvatar={myAvatar}
                    avatar={this.props.store.API("avatar/") + chat.avatar}
                    key={cnt++}
                />
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
        this.props.store.sendMessage(uid, text, "string", true);
        this.props.store.setRead(uid);
        this.textarea.value = "";
        this.changeScrollTop();

        honoka
            .post(this.props.store.API("sendMessage"), {
                data: {
                    uid: this.props.store.uid,
                    to: uid,
                    type: "string",
                    content: text,
                    token: this.props.store.token,
                    target: "group"
                }
            })
            .then(res => {
                if (res.status !== 200) {
                    alert("发送信息失败，原因可能是：" + res.message);
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
        reader.onload = e => {
            const base64Content = reader.result;
            this.props.store.sendMessage(uid, base64Content, "image", true);
            honoka
                .post(this.props.store.API("sendMessage"), {
                    data: {
                        uid: this.props.store.uid,
                        to: uid,
                        type: "image",
                        content: base64Content,
                        token: this.props.store.token,
                        target: "group"
                    }
                })
                .then(res => {
                    if (res.status !== 200) {
                        alert("发送信息失败，原因可能是：" + res.message);
                        return;
                    }
                });
        };
    }

    doInvite() {
        const uid = this.props.store.uid,
            token = this.props.store.token,
            target = this.inviteInput.value;
        honoka
            .post(this.props.store.API("inviteToGroup"), {
                data: {
                    uid,
                    token,
                    groupId: this.props.match.params.id,
                    target
                }
            })
            .then(res => {
                if (res.status === 200) {
                    alert("邀请成功！");
                    this.props.store.reloadGroupList();
                    this.setState({ inviting: false });
                }
            });
    }

    renderMembers() {
        if (!this.props.store.groupKeyMap[this.props.match.params.id]) return null;
        const rawMembers = this.props.store.groupKeyMap[this.props.match.params.id].members,
            members = [];

        let cnt = 0;
        rawMembers.forEach(member => {
            members.push(
                <div className="mechat-group-members-item" key={cnt++}>
                    <img src={this.props.store.API("avatar/") + member.avatar} alt="avatar" />
                    <span>{member.nickname}</span>
                </div>
            );
        });
        return members;
    }

    render() {
        const interval = setInterval(() => {
            if (!this.chatContent) return;
            this.changeScrollTop();
            clearInterval(interval);
        }, 50);

        return (
            <div
                className="mechat-chat-page mechat-group-chat"
                onPaste={e => this.onClipboardPaste(e)}
            >
                <div className="mechat-group-container">
                    <div className="mechat-chat-title">
                        {this.props.store.chattingWith.nickname}
                    </div>

                    <div className="mechat-chat-content" ref={ref => (this.chatContent = ref)}>
                        {(() => this.renderChatContent())()}
                    </div>

                    <div className="mechat-chat-textarea">
                        <textarea name="chat-text" ref={ref => (this.textarea = ref)}></textarea>
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
                        <button className="mechat-chat-send" onClick={() => this.sendMessage()}>
                            发送
                        </button>
                    </div>
                </div>
                <div className="mechat-group-members">
                    <div className="mechat-chat-title">
                        群成员
                        <span
                            className="fa fa-plus invite-button"
                            title="邀请新成员"
                            onClick={() => this.setState({ inviting: true })}
                        ></span>
                    </div>

                    <div className="mechat-group-members-list">
                        {this.renderMembers()}
                        <div
                            className="mechat-group-members-invite"
                            style={{
                                display: this.state.inviting ? "block" : "none"
                            }}
                        >
                            <input
                                type="text"
                                placeholder="输入用户名来邀请用户入群！"
                                ref={ref => (this.inviteInput = ref)}
                            />
                            <button type="button" onClick={() => this.doInvite()}>
                                邀请
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(GroupChatPage);
