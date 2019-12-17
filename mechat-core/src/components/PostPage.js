import React, { Component } from "react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { inject, observer } from "mobx-react";
import honoka from "honoka";

@inject("store")
@observer
class PostPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            returnId: null,
            nickname: null
        };
    }

    componentDidMount() {
        const post = this.getPost(this.props.match.params.id);
        this.setState({
            returnId: this.props.match.params.id,
            nickname: post ? post.nickname : null
        });
    }

    getPost(id) {
        for (const i in this.props.store.posts) {
            if (this.props.store.posts[i]._id === id)
                return this.props.store.posts[i];
        }
        return null;
    }

    reply() {
        honoka
            .post(this.props.store.API("createPost"), {
                data: {
                    uid: this.props.store.uid,
                    token: this.props.store.token,
                    content: this.commentContent.value,
                    type: 2,
                    replyTo: this.state.returnId
                }
            })
            .then(res => {
                console.log(res);
                if (res.status === 403) {
                    this.props.store.forceLogout();
                } else if (res.status !== 200) {
                    console.log("FriendCircle.likePost", res.message);
                } else {
                    this.props.store.reloadPostList();
                    this.sendButton.innerHTML = "已发送~";
                    setTimeout(() => this.sendButton.innerHTML = "回复", 4000);
                }
            });
    }

    likePost(id) {
        honoka
            .post(this.props.store.API("likePost"), {
                data: {
                    uid: this.props.store.uid,
                    token: this.props.store.token,
                    target: id,
                    offset: this.props.store.likes[id] ? -1 : 1
                }
            })
            .then(res => {
                if (res.status === 403) {
                    this.props.store.forceLogout();
                } else if (res.status !== 200) {
                    console.log("FriendCircle.likePost", res.message);
                } else {
                    this.props.store.likePost(id);
                }
            });
    }

    deletePost(id) {
        honoka
            .post(this.props.store.API("deletePost"), {
                data: {
                    uid: this.props.store.uid,
                    token: this.props.store.token,
                    target: id
                }
            })
            .then(res => {
                if (res.status === 403) {
                    this.props.store.forceLogout();
                } else if (res.status !== 200) {
                    console.log("FriendCircle.deletePost", res.message);
                } else {
                    this.props.store.deletePost(id);
                }
            });
    }

    renderComments(post) {
        const res = [];
        if (!post) return;

        post.comments.forEach(comment => {
            res.push(
                <div
                    key={comment._id}
                    className="mechat-fc-comment-item"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        this.setState({
                            returnId: comment._id,
                            nickname: comment.nickname
                        });
                        this.commentContent.focus();
                    }}
                >
                    <span className="mechat-fc-comment-author">
                        {comment.nickname}
                    </span>
                    <span>回复</span>
                    <span className="mechat-fc-comment-reply-target">
                        {post.nickname}：
                    </span>
                    <span>{comment.content}</span>

                    <div className="mechat-fc-subcomment-list">
                        {this.renderComments(comment)}
                    </div>
                </div>
            );
        });

        return res;
    }

    render() {
        const postId = this.props.match.params.id;
        const post = this.getPost(postId),
            div = document.createElement("div");
        if (!post) return null;
        div.innerText = post.content;
        const content = div.innerHTML.replace(/\n/g, "<br/>");
        const liked = this.props.store.likes[post._id];

        return (
            <div className="mechat-post">
                <h1 className="mechat-messages-title">动态详情</h1>
                <div className="mechat-post-container">
                    <div className="mechat-fc-item">
                        <div className="mechat-fc-item-meta">
                            <img
                                className="mechat-fc-item-meta-avatar"
                                src={this.props.store.API(
                                    "avatar",
                                    post.avatar
                                )}
                                alt="avatar"
                            />
                            <span className="mechat-fc-item-meta-nickname">
                                {post.nickname}
                            </span>
                        </div>
                        <div
                            className="mechat-fc-item-content"
                            dangerouslySetInnerHTML={{
                                __html: content
                            }}
                        ></div>
                        <div className="mechat-fc-item-actions">
                            <button
                                className={
                                    "mechat-fc-like" + (liked ? " liked" : "")
                                }
                                onClick={() => this.likePost(post._id)}
                            >
                                <i className="fa fa-heart" />
                                <span className="mechat-fc-like-cnt">
                                    {post.likes}
                                </span>
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
                        <div className="mechat-fc-item-comments" style={{
                            display: post.comments.length ? 'block' : 'none'
                        }}>
                            {this.renderComments(post)}
                        </div>
                        <div className="mechat-fc-item-input">
                            <textarea
                                ref={ref => (this.commentContent = ref)}
                                className="mechat-fc-textarea"
                                placeholder={`回复 ${this.state.nickname}：`}
                            />
                            <button
                                ref={ref => (this.sendButton = ref)}
                                className="mechat-chat-send"
                                onClick={() => this.reply()}
                            >
                                回复
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(PostPage);
