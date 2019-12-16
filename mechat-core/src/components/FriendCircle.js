import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

import "../styles/FriendCircle.styl";
import honoka from "honoka";

@inject("store")
@observer
class FriendCircle extends Component {
    componentDidMount() {
        this.props.store.reloadPostList();
    }

    likePost(id) {
        console.log(id);
        honoka.post(this.props.store.API('likePost'), {
            data: {
                uid: this.props.store.uid,
                token: this.props.store.token,
                target: id,
                offset: this.props.store.likes[id] ? -1 : 1
            }
        }).then(res => {
            if (res.status === 403) {
                this.props.store.forceLogout();
            } else if (res.status !== 200) {
                console.log('FriendCircle.likePost', res.message);
            } else {
                this.props.store.likePost(id);
            }
        });
    }

    deletePost(id) {
        honoka.post(this.props.store.API('deletePost'), {
            data: {
                uid: this.props.store.uid,
                token: this.props.store.token,
                target: id
            }
        }).then(res => {
            if (res.status === 403) {
                this.props.store.forceLogout();
            } else if (res.status !== 200) {
                console.log('FriendCircle.deletePost', res.message);
            } else {
                this.props.store.deletePost(id);
            }
        });
    }

    renderPosts() {
        const posts = [],
            div = document.createElement("div");
        let cnt = 0;
        this.props.store.posts.forEach(post => {
            div.innerText = post.content;
            const content = div.innerHTML.replace(/\n/g, "<br/>");
            const liked = this.props.store.likes[post._id];

            posts.push(
                <div className="mechat-fc-item" key={cnt++}>
                    <div className="mechat-fc-item-meta">
                        <img
                            className="mechat-fc-item-meta-avatar"
                            src={this.props.store.API("avatar", post.avatar)}
                            alt="avatar"
                        />
                        <span className="mechat-fc-item-meta-nickname">{post.nickname}</span>
                    </div>
                    <div
                        className="mechat-fc-item-content"
                        dangerouslySetInnerHTML={{
                            __html: content
                        }}
                    ></div>
                    <div className="mechat-fc-item-actions">
                        <button className={"mechat-fc-like" + (liked ? " liked" : "")} onClick={() => this.likePost(post._id)}>
                            <i className="fa fa-heart" />
                            <span className="mechat-fc-like-cnt">{post.likes}</span>
                        </button>
                        <Link to={`/app/posts/${post._id}`}>
                            <i className="fa fa-commenting-o" />
                        </Link>
                        {post.createdBy === this.props.store.uid ? (
                            <button
                                className="mechat-fc-delete"
                                onClick={() => this.deletePost(post._id)}
                            >
                                <i className="fa fa-trash"></i>
                            </button>
                        ) : null}
                    </div>
                    <div className="mechat-fc-item-comments"></div>
                </div>
            );
        });
        return posts;
    }

    render() {
        const curPath = this.props.match.path.indexOf("circle") >= 0 ? 1 : 0;
        return (
            <div className={"mechat-friend-circle " + (curPath ? "mechat-fc-full-width" : "")}>
                <h1 className="mechat-messages-title">好友动态</h1>
                <div className="mechat-fc-lists">
                    {this.renderPosts()}
                    <div className="mechat-fc-boundary">I have boundaries.</div>
                </div>
                <Link to="/app/createPost" className="mechat-fc-create">
                    <i className="fa fa-plus"></i>
                </Link>
            </div>
        );
    }
}

export default withRouter(FriendCircle);
