import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";

import crypto from "crypto";
import honoka from "honoka";

import "../styles/LoginPage.styl";
import config from "../config";
import { inject, observer } from "mobx-react";

@inject('store')
@observer
class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nickname: "MeChat",
      avatar: require("../images/defaultAvatar.jpg")
    };
  }

  login() {
    const username = this.usernameInput.value,
      password = crypto
        .createHash("md5")
        .update(this.passwordInput.value)
        .digest("hex");
    const loginUri = config.apiUrl + "login";
    honoka
      .post(loginUri, {
        data: {
          username,
          password
        }
      })
      .then(res => {
        if (typeof res == "string") res = JSON.parse(res);
        console.log(res);

        if (res.status !== 200) {
          console.log(res, typeof res);
          alert("登录失败，错误信息：" + res.message);
        } else {
          res.avatar = config.apiUrl + 'avatar/' + res.avatar;
          sessionStorage.setItem("userInfo", JSON.stringify(res));
          this.props.history.push('/app/message');
        }
      });
  }

  componentDidMount() {
      window.browserWindow.getCurrentWindow().setSize(300, 500);
      this.usernameInput.focus();
  }

  render() {
    return (
      <div className="mechat-loginpage">
        <div className="mechat-login-personinfo">
          <p className="mechat-login-avatar-container">
            <img
              className="mechat-login-avatar"
              src={this.state.avatar}
              alt="avatar"
            />
          </p>
          <p className="mechat-login-nickname">{this.state.nickname}</p>
        </div>
        <input
          type="text"
          name="username"
          className="mechat-login-input-username"
          ref={ref => (this.usernameInput = ref)}
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
        <div className="mechat-login-copyright">
          &copy;2019 XMU CS - Data Structure Experiment / by Yume Maruyama
        </div>
      </div>
    );
  }
}

export default withRouter(LoginPage);