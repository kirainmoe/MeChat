import React, { Component } from "react";
import { Route } from "react-router";
import { HashRouter, withRouter } from "react-router-dom";
import { inject, observer } from "mobx-react";

/* Stylesheet */
import "../styles/MainPage.styl";

/* Components */
import Navbar from "./Navbar";
import MessageList from "./MessageList";
import ChatPage from "./ChatPage";
import FriendsList from "./FriendsList";
import ProfilePage from "./ProfilePage";
import ProfileEdit from "./ProfileEdit";
import AboutPage from "./AboutPage";
import GroupList from "./GroupList";
import CreateNewGroupPage from "./CreateNewGroupPage";
import GroupPage from "./GroupPage";
import GroupChatPage from "./GroupChatPage";
import FriendCircle from "./FriendCircle";
import CreatePostPage from "./CreatePostPage";
import PostPage from "./PostPage";

@inject("store")
@observer
class MainPage extends Component {
    retry = 0;

    componentWillMount() {
        if (sessionStorage.getItem("userInfo") == null) this.props.history.push("/");
        else this.props.store.setUserInfo(JSON.parse(sessionStorage.getItem("userInfo")));

        // establish socket connection
        this.createSocketConnection();

        // get friends list
        this.props.store.reloadFriendsList();

        // get groups list
        this.props.store.reloadGroupList();

        // get messages list
        this.props.store.reloadMessageList();
    }

    componentWillUnmount() {
        this.ws.close();
    }

    componentDidMount() {
        window.browserWindow.getCurrentWindow().setSize(800, 600);
        this.props.store.setRouter(this.props.history);
    }

    // 创建与服务器的 websocket 链接
    createSocketConnection() {
        this.ws = new WebSocket(this.props.store.configUrl.wsUrl);
        const ws = this.ws;

        ws.addEventListener("open", () => {
            ws.send(
                JSON.stringify({
                    uid: this.props.store.uid,
                    token: this.props.store.token
                })
            );
            this.retry = 0;
            this.props.store.connectSocketLink(this.ws);
        });

        ws.addEventListener("message", msg => {
            msg = JSON.parse(msg.data);
            switch (msg.type) {
                // receive new message
                case "message":
                    this.props.store.pushNewMessage(msg.from, msg.payload);
                    break;
                case "friends":
                    this.props.store.reloadFriendsList();
                    break;
                case "groups":
                    this.props.store.reloadGroupList();
                    break;
                default:
                    break;
            }
        });

        ws.addEventListener("close", () => {
            if (this.retry && this.retry >= 3) {
                alert("连接错误。返回登录页面...");
                this.props.history.push("/");
                return;
            } else if (this.props.store.token) {
                this.retry = this.retry ? this.retry + 1 : 1; // retry times
                setTimeout(() => this.createSocketConnection(), 5000); // recreate socket connection
            }
        });

        ws.addEventListener("error", () => {
            alert("连接错误。返回登录页面...");
            this.props.history.push("/");
        });
    }

    render() {
        return (
            <div className="mechat-mainpage">
                <HashRouter history={this.props.history}>
                    <Route path="/app">
                        <Navbar />
                    </Route>

                    <Route path="/app/message">
                        <MessageList />
                    </Route>

                    <Route path="/app/message/:id">
                        <ChatPage />
                    </Route>

                    <Route path="/app/groupMessage/:id">
                        <MessageList />
                        <GroupChatPage />
                    </Route>

                    <Route path="/app/friends">
                        <FriendsList />
                    </Route>

                    <Route path="/app/friends/:id">
                        <ProfilePage />
                    </Route>

                    <Route path="/app/groups">
                        <GroupList />
                    </Route>

                    <Route path="/app/groups/:id">
                        <GroupPage />
                    </Route>

                    <Route path="/app/createNewGroup">
                        <GroupList />
                        <CreateNewGroupPage />
                    </Route>

                    <Route path="/app/editProfile">
                        <FriendsList />
                        <ProfileEdit />
                    </Route>

                    <Route path="/app/circle">
                        <FriendCircle />
                    </Route>

                    <Route path="/app/posts/:id">
                        <FriendCircle/>
                        <PostPage/>
                    </Route>

                    <Route path="/app/createPost">
                        <FriendCircle />
                        <CreatePostPage />
                    </Route>

                    <Route path="/app/about">
                        <AboutPage />
                    </Route>
                </HashRouter>
            </div>
        );
    }
}

export default withRouter(MainPage);
