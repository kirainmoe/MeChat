import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';
import config from '../config';

const groupAvatar = require('../images/group.png');

@inject('store')
@observer
class MessageList extends Component {
  getAvatar(avatar) {
    return config.apiUrl + 'avatar/' + avatar;
  }
  
  chatWith(item) {
    this.props.store.setRead(item.with);
    this.props.store.setChattingWith(item.with, item.nickname, item.avatar);
  }

  renderMessageList() {
    const res = [];
    let rawList = [];
    let cnt = 0;

    for (const key in this.props.store.messageList)
      rawList.push(this.props.store.messageList[key]);
    rawList = rawList.sort((a, b) => {
      return a.last < b.last ? 1 : -1;
    });
    for (const key in rawList) {
      const item = rawList[key],
        date = new Date(item.last);
        // today = new Date();
      
      let dateStr = '';
      // if (date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
      dateStr += (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
      dateStr += ':';
      dateStr +=(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
      // } 

      res.push(
        <NavLink className="mechat-dialog" to={item.target !== 'group' ? `/app/message/${item.with}` : `/app/groupMessage/${item.with}`} key={cnt++} onClick={() => this.chatWith(item)}>
          <div className="mechat-dialog-avatar">
            <img src={item.target === 'group' ? groupAvatar : this.getAvatar(item.avatar)} alt="avatar" />
            {(item.read ? null : <span className={'mechat-dialog-new'}></span>)}
          </div>
          <div className="mechat-dialog-meta">
            <p className="mechat-dialog-title">{item.nickname}</p>
            <p className="mechat-dialog-mess">{(() => {
              if (item.records.length) {
                if (item.records[item.records.length-1].type === "image")
                  return "[图片]";
                else
                  return item.records[item.records.length-1].content;
              } else
                return '';
            })()}</p>
            <span className="mechat-dialog-time">{dateStr}</span>
          </div>
      </NavLink>
      )
    }

    return res;
  }
  render() {
    return (
      <div className="mechat-messages">
        <h1 className="mechat-messages-title">
          消息列表
        </h1>
        <div className="mechat-messages-fetching" style={{
          display: this.props.store.fetching ? 'block' : 'none'
        }}>
          正在更新消息列表...
        </div>
        <div className="mechat-messages-list">
          {(() => this.renderMessageList())()}
        </div>         
      </div>
    );
  }
}

export default MessageList;