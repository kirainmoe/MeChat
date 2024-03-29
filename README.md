<h1 align=center><img width="80px" src="https://i.loli.net/2019/12/13/apDtvOrXb4YBhkC.png"><br>MeChat</h1>

MeChat：一个简单的、跨平台的电脑版聊天程序。

这是厦门大学信息学院 2018 级计算机系数据结构课程设计：**题目七《实现电脑版的微信》**。

![chatting.png](https://i.loli.net/2019/12/17/NdeBzYkitLEyqRj.png)

## Demo

可以在 [Release](https://github.com/kirainmoe/mechat/releases) 页面下载。

目前支持 Windows 7+，macOS 10.13+, Linux.

## Usage

### 安装环境

MeChat 服务端和客户端开发环境需要 `Node.js` 和 `MongoDB` 环境：

- MongoDB：https://www.mongodb.com/download-center/community ，开发时使用的是 4.2.2 社区版。

- Node.js：https://nodejs.org/en/ 开发时使用版本是 v12.9.1，理论上比此版本更新的版本都可以。


### 克隆代码

克隆此仓库的代码可能需要下载 `git`。

```bash
git clone https://github.com/kirainmoe/mechat
cd mechat
```

### 启动 MeChat 服务端

服务端代码位于 `mechat-server` 目录中。

```bash
cd mechat-server
npm install        # 安装依赖
```

如果你需要修改服务器的端口、MongoDB 的密码等，可以修改配置文件 `config.js`，否则保持默认即可。

然后启动 MeChat 服务端：

```bash
npm start
```

在服务器端上部署的方法与上述一致。

### 启动 MeChat 客户端开发服务器

MeChat 客户端开发服务器，以及主要的前端程序代码位于 `mechat-core` 目录中。

```bash
cd mechat-core
npm install    # 安装依赖
```

启动 `webpack-dev-server` 开发服务器，默认的端口是 3000：

```
npm start
```

### 启动 MeChat 客户端 GUI

MeChat 客户端采用 Electron 构建，位于 `mechat-client` 目录中。启动方式如下：

```bash
cd mechat-client
npm install         # 安装依赖
npm start
```

### 打包 MeChat Electron 程序

首先将 `mechat-core` 目录下的前端核心代码打包：

```bash
cd mechat-core
npm run build
```

打包完成会得到 `build` 目录，将其整个目录复制到 `mechat-client` 目录中，然后进入该目录执行打包命令：

```bash
npm run pack             # 打包 Windows 程序
npm run pack:macos       # 打包 macOS 程序
npm run pack:linux       # 打包 Linux 程序
```

打包的可执行程序会存放在上一级目录的 `release` 文件夹中。

## Functions

- [x] 用户登录、注册功能
- [x] 用户资料系统
- [x] 好友和备注系统
- [x] 群聊系统
- [x] 实时信息推送
- [x] 文字和图片发送
- [x] 好友动态

## Tech Stack

### 服务端

- Node.js (开发语言)
- Express （Web 框架）
- MongoDB （数据库）
- WebSocket （实时信息流协议）

### 客户端

- Electron （GUI 框架）
- webpack (模块打包程序)
- React（Javascript 框架)
- react-router（路由框架）
- mobx（状态管理框架）

### 其它

- font-awesome（UI 图标库）
- honoka


## Screenshot

![login.png](https://i.loli.net/2019/12/17/EsZVKO6rAIH5axp.png)

![register.png](https://i.loli.net/2019/12/17/K9gAi6rf1U4tCTj.png)

![chatting.png](https://i.loli.net/2019/12/17/NdeBzYkitLEyqRj.png)

![profile-edit.png](https://i.loli.net/2019/12/17/2qxNlmRneDgHO3f.png)

![group.png](https://i.loli.net/2019/12/17/kyvHTzjaoeSrUpc.png)

![circle-1.png](https://i.loli.net/2019/12/17/xDrpdIAz4UXsJbG.png)

![circle-3.png](https://i.loli.net/2019/12/17/5L4dNjwrvcgyGAO.png)

![circle-2.png](https://i.loli.net/2019/12/17/IHz1cJufgesGdNT.png)

## Copyright & License

&copy;2019 [Yume Maruyama (Yuhang Qiu)](https://github.com/kirainmoe).

This project is my curriculum design of XMU 2018 Data Structure course.

MeChat is MIT Licensed.
