import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { NavLink, Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';

@inject('store')
@observer
class Navbar extends Component {
    logOut() {
        sessionStorage.removeItem('userInfo');
    }

    render() {
        return (
              <div className="mechat-mainpage-nav">
              <div className="mechat-nav-avatar-container">
                <Link to={'/app/editProfile'}>
                  <img
                    className="mechat-nav-avatar"
                    alt="avatar"
                    src={this.props.store.avatar}
                    title={this.props.store.nickname}
                  />
                </Link>
              </div>
              <NavLink to="/app/message" title="消息">
                <i className="fa fa-comments-o"></i>
              </NavLink>
              <NavLink to="/app/friends" title="通讯录">
                <i className="fa fa-address-book-o"></i>
              </NavLink>
              <div className="mechat-nav-system-action">
                <Link to="/app/about" title="关于">
                  <i className="fa fa-info-circle"></i>
                </Link>
                <Link to="/" title="注销" onClick={() => this.logOut()}>
                  <i className="fa fa-mail-reply"></i>
                </Link>
              </div>
            </div>
        );
    }
}

export default withRouter(Navbar);