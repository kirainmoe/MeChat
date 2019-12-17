import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router";

import "../styles/ProfileEdit.styl";
import honoka from "honoka";

@inject("store")
@observer
class ProfileEdit extends Component {
    // 更新个人资料
    editProfile() {
        const nickname = this.nickname.value,
            mail = this.mail.value,
            signature = this.signature.value;

        const { avatar, token, uid } = this.props.store;

        if (nickname === "" || mail === "") {
            alert("昵称和邮箱不许留空！");
            return;
        }

        if (this.avatarUpload.files.length) {
            if (this.avatarUpload.files[0].size / 1024 / 1024 > 1) {
                alert("上传的头像大小不能超过 1MB，请重新选择图片。");
                return;
            }

            const form = new FormData();
            form.append("avatar", this.avatarUpload.files[0]);
            form.append("uid", this.props.store.uid);
            form.append("token", this.props.store.token);
            fetch(this.props.store.API("uploadAvatar"), {
                method: "POST",
                headers: {},
                body: form
            })
                .then(res => res.json())
                .then(res => {
                    if (res.status === 403)
                        this.props.store.forceLogout();
                    else {
                        if (res.status === 200) {
                            const fileObj = this.avatarUpload.files[0];
                            const uri = window.URL.createObjectURL(fileObj);
                            this.props.store.setNewAvatar(uri, true);
                        }
                    }
                });
        }

        this.props.store.setUserInfo({
            nickname,
            mail,
            signature,
            avatar,
            token,
            id: uid
        });

        honoka
            .post(this.props.store.API("updateProfile"), {
                data: {
                    username: this.props.store.username,
                    nickname,
                    mail,
                    signature,
                    uid,
                    token
                }
            })
            .then(res => {
                if (res.status === 403) {
                    alert("身份验证失败，请重新登录。");

                    sessionStorage.removeItem("userInfo");
                    this.props.history.push("/");
                } else {
                    if (res.status === 200) alert("修改成功。");
                }
            });
    }

    // 新头像预览
    onFileLoadChange() {
        const fileObj = this.avatarUpload.files[0];
        const uri = window.URL.createObjectURL(fileObj);
        this.avatar.setAttribute("src", uri);
    }

    // 选择即将上传的头像
    selectAvatar() {
        this.avatarUpload.click();
    }

    render() {
        return (
            <div className="mechat-profile-edit">
                <p className="mechat-profile-edit-title">修改个人资料</p>
                <div className="mechat-profile-edit-container">
                    <div className="mechat-profile-edit-avatar">
                        <img
                            src={this.props.store.avatar}
                            alt="my-avatar"
                            onClick={() => {
                                this.selectAvatar();
                            }}
                            ref={ref => (this.avatar = ref)}
                            title="点击修改头像"
                        ></img>
                    </div>
                    <div className="mechat-profile-account">
                        <p name="username">MeChat 账号：{this.props.store.username}</p>
                        <p name="uid">UID: {this.props.store.uid}</p>
                    </div>
                    <form
                        ref={ref => (this.uploadForm = ref)}
                        action={this.props.store.API("uploadAvatar")}
                        method="post"
                        encType="multipart/form-data"
                    >
                        <input
                            type="file"
                            name="avatar-upload"
                            ref={ref => (this.avatarUpload = ref)}
                            style={{
                                display: "none"
                            }}
                            accept="image/*"
                            onChange={e => this.onFileLoadChange(e)}
                        />
                    </form>

                    <div className="mechat-profile-edit-form">
                        <span>昵称</span>
                        <input
                            type="text"
                            defaultValue={this.props.store.nickname}
                            ref={ref => (this.nickname = ref)}
                        />
                    </div>

                    <div className="mechat-profile-edit-form">
                        <span>邮箱</span>
                        <input
                            type="text"
                            defaultValue={this.props.store.mail}
                            ref={ref => (this.mail = ref)}
                        />
                    </div>

                    <div className="mechat-profile-edit-form">
                        <span>签名</span>
                        <input
                            type="text"
                            defaultValue={this.props.store.signature}
                            ref={ref => (this.signature = ref)}
                        />
                    </div>

                    <div className="mechat-profile-edit-action">
                        <button
                            className="mechat-profile-edit-submit"
                            onClick={() => this.editProfile()}
                        >
                            修改
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(ProfileEdit);
