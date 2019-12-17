import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { inject, observer } from "mobx-react";
import crypto from "crypto";
import honoka from "honoka";

import "../styles/LoginPage.styl";


const defaultAvatar = require("../images/defaultAvatar.jpg");

@inject('store')
@observer
class LoginPage extends Component {
    constructor(props) {
        super(props);

        // default state
        this.state = {
            nickname: "MeChat",
            avatar: defaultAvatar,
            logining: false
        };
    }

    login() {
        const username = this.usernameInput.value,
            password = crypto
                .createHash("md5")
                .update(this.passwordInput.value)
                .digest("hex");
        this.setState({
            logining: true
        });

        const loginUri = this.props.store.API('login');
        honoka
            .post(loginUri, {
                data: {
                    username,
                    password
                }
            })
            .then(res => {
                if (typeof res === "string") res = JSON.parse(res);

                this.setState({
                    logining: false
                });

                if (res.status !== 200)
                    alert("登录失败，错误信息：" + res.message);
                else {
                    res.avatar = this.props.store.API('avatar', res.avatar);

                    localStorage.setItem(username, JSON.stringify({
                        avatar: res.avatar,
                        nickname: res.nickname
                    }));
                    sessionStorage.setItem("userInfo", JSON.stringify(res));

                    this.props.history.push('/app/message');
                }
            });
    }

    onUsernameInput() {
        const username = this.usernameInput.value,
            recordedInfo = localStorage.getItem(username);
        if (recordedInfo) {
            const res = JSON.parse(recordedInfo);
            this.setState({
                ...res
            });
        } else {
            if (this.state.nickname !== 'MeChat') {
                this.setState({
                    nickname: 'MeChat',
                    avatar: defaultAvatar
                });
            }
        }
    }

    componentDidMount() {
        window.browserWindow.getCurrentWindow().setSize(300, 500);
        this.props.store.setRouter(this.props.history);
        setTimeout(() => this.usernameInput.focus(), 100);
    }

    render() {
        return (
            <div className="mechat-loginpage">
                <div className="mechat-login-personinfo">
                    <div className="mechat-login-avatar-container">
                        <div
                            className="mechat-login-avatar"
                            style={{
                                background: `url('${this.state.avatar}') no-repeat center / cover`
                            }}
                        />
                    </div>
                    <p className="mechat-login-nickname">{this.state.nickname}</p>
                </div>
                <div className="mechat-login-hint" style={{
                    display: this.state.logining ? 'block' : 'none'
                }}>
                    正在登录...
        </div>
                <div className="mechat-login-input" style={{
                    display: this.state.logining ? 'none' : 'block'
                }}>
                    <input
                        type="text"
                        name="username"
                        className="mechat-login-input-username"
                        ref={ref => (this.usernameInput = ref)}
                        onChange={() => this.onUsernameInput()}
                        placeholder="用户名"
                    />
                    <input
                        type="password"
                        name="password"
                        className="mechat-login-input-password"
                        ref={ref => (this.passwordInput = ref)}
                        placeholder="密码"
                    />
                    <div className="mechat-login-actions">
                        <button
                            type="button"
                            onClick={() => this.login()}
                            className="mechat-login-button"
                        >
                            登录
            </button>
                        <Link to="/register" className="mechat-login-register">
                            没有账号？注册一个
            </Link>
                    </div>
                </div>
                <div className="mechat-login-copyright">
                    &copy;2019 XMU CS - Data-Structure Curriculum Design <br /> by Yume Maruyama
        </div>
            </div>
        );
    }
}

export default withRouter(LoginPage);