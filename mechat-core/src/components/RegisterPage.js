import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { inject, observer } from "mobx-react";

import crypto from "crypto";
import honoka from "honoka";

import "../styles/RegisterPage.styl";

@inject('store')
@observer
class RegisterPage extends Component {
    register() {
        const username = this.usernameInput.value,
            password = crypto
                .createHash("md5")
                .update(this.passwordInput.value)
                .digest("hex"),
            mail = this.mailInput.value,
            nickname = this.nicknameInput.value;

        const regUri = this.props.store.API("register");
        honoka
            .post(regUri, {
                data: {
                    username,
                    password,
                    mail,
                    nickname
                }
            })
            .then(res => {
                if (typeof res == "string") res = JSON.parse(res);
                if (res.status !== 200) {
                    alert("注册失败，错误信息：" + res.message);
                } else {
                    window.browserWindow.dialog.showMessageBoxSync({
                        type: 'info',
                        title: '注册成功',
                        message: "注册成功~将回到登录页面。",
                        button: ['ok']
                    });
                    this.props.history.push("/");
                }
            });
    }

    render() {
        return (
            <div className="mechat-register-page">
                <h1 className="mechat-register-title">注册 MeChat</h1>
                <input
                    type="text"
                    name="username"
                    className="mechat-register-input-username"
                    ref={ref => (this.usernameInput = ref)}
                    placeholder="登录用户名"
                />
                <input
                    type="password"
                    name="password"
                    className="mechat-register-input-password"
                    ref={ref => (this.passwordInput = ref)}
                    placeholder="密码"
                />
                <input
                    type="mail"
                    name="mail"
                    className="mechat-register-input-mail"
                    ref={ref => (this.mailInput = ref)}
                    placeholder="邮箱"
                />
                <input
                    type="text"
                    name="nickname"
                    className="mechat-register-input-nickname"
                    ref={ref => (this.nicknameInput = ref)}
                    placeholder="昵称"
                />

                <div className="mechat-register-actions">
                    <button
                        type="button"
                        onClick={() => this.register()}
                        className="mechat-register-button"
                    >
                        注册
                    </button>
                    <Link to="/" className="mechat-register-login">
                        已有账号？登录
                    </Link>
                </div>
            </div>
        );
    }
}

export default withRouter(RegisterPage);
