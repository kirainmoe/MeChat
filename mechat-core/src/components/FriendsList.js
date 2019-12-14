import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { NavLink } from "react-router-dom";
import honoka from "honoka";

import "../styles/FriendsList.styl";

@inject("store")
@observer
class FriendsList extends Component {
    renderFriendsList() {
        const res = [];
        let cnt = 0;
        this.props.store.friends.forEach(friend => {
            res.push(
                <NavLink className="mechat-dialog" to={"/app/friends/" + friend.uid} key={cnt++}>
                    <div className="mechat-dialog-avatar">
                        <img src={this.props.store.API('avatar', friend.avatar)} alt="avatar" />
                    </div>
                    <div className="mechat-dialog-meta">
                        <p className="mechat-dialog-title">
                            {friend.alias
                                ? `${friend.alias} (${friend.nickname})`
                                : friend.nickname}
                        </p>
                        <p className="mechat-dialog-mess">{friend.signature}</p>
                    </div>
                </NavLink>
            );
        });
        return res;
    }

    componentWillMount() {
        this.props.store.reloadFriendsList();
    }

    addFriend() {
        const friend = this.input.value,
            addFriendUrl = this.props.store.API("addFriend");
        honoka
            .post(addFriendUrl, {
                data: {
                    uid: this.props.store.uid,
                    token: this.props.store.token,
                    friend
                }
            })
            .then(res => {
                if (res.status === 403) {
                  this.props.store.forceLogout();
                } else {
                    if (res.status === 200) {
                        alert("添加好友成功.");
                        this.props.store.addFriend(res.payload);
                    } else {
                        alert("添加好友失败，原因是：" + res.message);
                    }
                }
            });
    }

    render() {
        return (
            <div className="mechat-messages">
                <h1 className="mechat-messages-title">朋友</h1>
                <div className="mechat-friends-add">
                    <input
                        type="text"
                        name="friends"
                        placeholder="搜索 MeChat 账号添加好友"
                        ref={ref => (this.input = ref)}
                    />
                    <button onClick={() => this.addFriend()}>+</button>
                </div>
                <div className="mechat-messages-list">{(() => this.renderFriendsList())()}</div>
            </div>
        );
    }
}

export default FriendsList;
