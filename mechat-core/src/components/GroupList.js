import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';
import honoka from 'honoka';

import '../styles/GroupList.styl';

const groupAvatar = require('../images/group.png');

@inject('store')
@observer
class GroupList extends Component {
  renderGroupsList() {
    const res = [];
    let cnt = 0;
    this.props.store.groups.forEach(group => {
      if (!group)
        return;
      res.push(
        <NavLink className="mechat-dialog" to={"/app/groups/" + group.id} key={cnt++}>
          <div className="mechat-dialog-avatar">
            <img src={groupAvatar} alt="avatar" />
          </div>
          <div className="mechat-dialog-meta">
            <p className="mechat-dialog-title">
              {group.name}
            </p>
            <p className="mechat-dialog-mess">{group.description}</p>
          </div>
        </NavLink>
      );
    });
    return res;
  }

  forceLogout() {
    alert("身份认证出现问题，请重新登录。");
    sessionStorage.removeItem('userInfo');
    this.props.history.push('/');
  }  

  componentWillMount() {
    this.props.store.reloadGroupList();
  }
  
  addGroup() {
    const groupId = this.input.value,
      addGroupUrl = this.props.store.API('addGroup');
      honoka.post(addGroupUrl, {
        data: {
          uid: this.props.store.uid,
          token: this.props.store.token,
          groupId
        }
      }).then(res => {
        if (res.status === 403) {
          alert("身份认证出现问题，请重新登录。");
  
          sessionStorage.removeItem('userInfo');
          this.props.history.push('/');
        } else {
          console.log(res.payload, this.props.store.groups);
          if (res.status === 200) {
            alert("添加群成功。");
            this.props.store.addGroup(res.payload);
          } else {
            alert("添加群失败，原因是：" + res.message);
          }
        }
      }); 
  }

  render() {
    return (
      <div className="mechat-messages mechat-grouplist">
        <h1 className="mechat-messages-title">
          群组
        </h1>
        <div className="mechat-friends-add">
          <input type="text" name="friends" placeholder="搜索群 ID 加入群" ref={ref => this.input = ref}/>
          <button onClick={() => this.addGroup()}>+</button>
        </div>
        <div className="mechat-messages-list">
          {(() => this.renderGroupsList())()}  
          <NavLink to={'/app/createNewGroup'} className="mechat-group-create" title="发起新的群聊">
              <i className="fa fa-plus"></i>
          </NavLink>
        </div>
      </div>
    );
  }
}

export default GroupList;