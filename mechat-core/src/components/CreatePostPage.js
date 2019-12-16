import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { inject, observer } from 'mobx-react';
import honoka from 'honoka';

import '../styles/CreatePostPage.styl';

@inject('store')
@observer
class CreatePostPage extends Component {
    createPost() {
        const content = this.textarea.value;
        honoka.post(this.props.store.API('createPost'), {
            data: {
                uid: this.props.store.uid,
                token: this.props.store.token,
                content
            }
        }).then(res => {
            if (res.status === 403) {
                this.props.store.forceLogout();
            } else if (res.status !== 200) {
                alert('发送失败，原因是：' + res.message);
            } else {
                const id = res.payload.id;      // todo
                this.props.store.pushNewPost(id, content, []);
            }
        });
    }

    render() {
        return (
            <div className="mechat-create-post">
                <h1 className="mechat-cp-title">
                    新的动态
                </h1>

                <div className="mechat-cp-container">
                    <textarea
                        ref={ref => this.textarea = ref}
                        className="mechat-cp-textarea"
                        placeholder="分享新鲜事...">
                    </textarea>

                    <div className="mechat-cp-images"></div>

                    <button className="mechat-cp-send" onClick={() => this.createPost()}>
                        发送
                    </button>
                </div>
            </div>
        );
    }
}

export default withRouter(CreatePostPage);