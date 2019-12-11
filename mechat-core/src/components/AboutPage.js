import React, { Component } from 'react';

import '../styles/AboutPage.styl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router';

const mechatLogo = require('../images/mechat.png');

@inject('store')
@observer
class AboutPage extends Component {
    render() {
        return (
            <div className="mechat-about">
                <p className="mechat-about-title">关于 MeChat</p>
                <div className="mechat-about-logo">
                    <img src={mechatLogo} alt="MeChat Logo" />
                </div>
                <div className="mechat-about-description">
                    <p>一个简单的、跨平台的电脑版“山寨微信”</p>
                    <p>这是厦门大学信息学院 2018 级计算机系数据结构课程设计：题目七《实现电脑版的微信》</p>
                    <p>基于 Node.js + Electron 构建</p>
                    <p>源代码可参见该项目的 GitHub 仓库: https://github.com/kirainmoe/mechat</p>
                </div>
                <div className="mechat-about-copyright">
                    <p>&copy;2019 - present, written by Yuhang Qiu (Yume Maruyama)</p>
                    <p>XMU 2018 Data-Structure Curriculum Design</p>
                </div>
            </div>
        );
    }
}

export default withRouter(AboutPage);