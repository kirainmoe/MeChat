import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router";

import honoka from "honoka";

import "../styles/CreateNewGroupPage.styl";

@inject("store")
@observer
class CreateNewGroupPage extends Component {
    renderMemberLists() {
        const memberComponents = [],
            friends = this.props.store.friends;
        let cnt = 0;
        friends.forEach(friend => {
            memberComponents.push(
                <div className="mechat-cng-member-item" key={cnt}>
                    <input
                        className="mechat-cng-member-checkbox"
                        type="checkbox"
                        uid={friend.uid}
                    />
                    <span>
                        {friend.alias ? `${friend.alias} (${friend.nickname})` : friend.nickname}
                    </span>
                </div>
            );
            cnt++;
        });
        return memberComponents;
    }

    createGroup() {
        const { uid, token } = this.props.store;
        const name = this.groupName.value,
            description = this.groupDesc.value;
        const members = [];
        const checkBoxes = this.wrapper.querySelectorAll('input[type="checkbox"]');
        checkBoxes.forEach(item => {
            if (item.checked) {
                members.push(item.getAttribute("uid"));
            }
        });
        honoka
            .post(this.props.store.API("createGroup"), {
                data: {
                    uid,
                    token,
                    name,
                    description,
                    members: JSON.stringify(members)
                }
            })
            .then(res => {
                if (res.status === 403) {
                  this.props.store.forceLogout();
                } else if (res.status !== 200) {
                    alert(`创建群失败，原因可能是：${res.message}`);
                    console.log(res);
                } else {
                    alert("创建群聊成功！");
                    this.props.history.push("/app/groups");
                }
            });
    }

    render() {
        return (
            <div className="mechat-create-new-group">
                <p className="mechat-cng-title">创建新群组</p>
                <div className="mechat-cng-container">
                    <p className="mechat-cng-input">
                        群组名称：
                        <input type="text" ref={ref => (this.groupName = ref)} />
                    </p>
                    <p className="mechat-cng-input">
                        群组简介：
                        <input type="text" ref={ref => (this.groupDesc = ref)} />
                    </p>
                    <div className="mechat-cng-members">
                        <p>邀请好友：</p>
                        <div
                            className="mechat-cng-members-wrapper"
                            ref={ref => (this.wrapper = ref)}
                        >
                            {this.renderMemberLists()}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="mechat-cng-button"
                        onClick={() => this.createGroup()}
                    >
                        创建群聊
                    </button>
                </div>
            </div>
        );
    }
}

export default withRouter(CreateNewGroupPage);
