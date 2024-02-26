<p align="center">
	<img alt="h-blog" src="https://github.com/huanghanzhilian/huanghanzhilian/raw/main/projects/h-blog.png" width="300">
</p>
<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">H-BLOG</h1>

<h4 align="center">基于node.js, express.js 开发同时适配Desktop、Tablet、Phone多种设备的 精简博客系统</h4>

## README.md
- en [English](README.md)
- zh_CN [简体中文](README.zh_CN.md)

## 前言

`h-blog`是一个精简的博客系统，支持响应式交互，界面优雅，功能丰富，小巧迅速，功能全面，美观大方。

希望来的人，有所收获。故事不结束，青春不散场。

## 项目在线演示

**项目在线演示地址：**

部署地址：[https://blog.huanghanlian.com/](https://blog.huanghanlian.com/)

项目传送门: [https://github.com/huanghanzhilian/h-blog](https://github.com/huanghanzhilian/h-blog)




## 目录结构

对应文件及文件夹的用处：

1. `models`: 存放操作数据库的文件
2. `public`: 存放静态文件，如样式、图片等
3. `routes`: 存放路由文件
4. `views`: 存放模板文件
5. `index.js`: 程序主文件
6. `package.json`: 存储项目名、描述、作者、依赖等等信息


## 安装依赖模块

对应模块的用处

1. `express`: web 框架
2. `ejs`: 模板
3. `mongoose`: MongoDB对象建模设计异步环境中工作
4. `markdown-it`: 编辑器转化
5. `body-parser`: 将表单里的数据进行格式化
6. `multer`: 图片上传组件 表单基于 multipart/form-data 类型
7. `underscore`: `_.extend`用新对象里的字段替换老的字段
8. `moment`: 时间格式化

1. `express-session`: session 中间件
1. `connect-mongo`: 将 session 存储于 mongodb，结合 express-session 使用

1. `config-lite`: 读取配置文件

## 配置文件

config/default.js

```
module.exports = {
  port: 3001,
  session: {
    secret: 'h-blog',
    key: 'h-blog',
    maxAge: 2592000000
  },
  mongodb: 'mongodb://localhost:27017/h-blog'
}
```

配置释义：

1. port: 程序启动要监听的端口号
2. session: express-session 的配置信息
3. mongodb: mongodb 的地址，以 mongodb:// 协议开头，h-blog 为 db 名


## 功能设计与路由设计

**博客前台**

- 登录
	1. 登录页：GET /signin
	2. 登录：POST /user/signin
- 注册页
	1. 注册页：GET /signup
	2. 注册：POST /user/signup
- 文章列表页
- 文章详情页


