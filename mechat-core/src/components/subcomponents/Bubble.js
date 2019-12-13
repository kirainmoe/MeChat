import React, { Component } from "react";

export default class Bubble extends Component {
  render() {
    const { chat, chatWith, myAvatar } = this.props;

    return (
      <div className={"mechat-chat-item " + (chat.from === 1 ? "from-me" : "")}>
        <div className="mechat-chat-item-avatar">
          <img
            src={
              chat.from === 1
                ? myAvatar
                : chat.target === "group"
                ? this.props.avatar
                : chatWith.avatar
            }
            alt="avatar"
          />
        </div>
        {(() => {
          if (chat.target === "group") {
            return <p className="mechat-chat-group-id">{chat.nickname}</p>;
          }
          return null;
        })()}
        <div className="mechat-chat-item-bubble">
          {chat.type === "string" ? (
            <p
              dangerouslySetInnerHTML={{
                __html: chat.content.trim().replace(/\n/g, "<br>")
              }}
            ></p>
          ) : (
            <img src={chat.content} alt="chatimg" />
          )}
        </div>
      </div>
    );
  }
}
