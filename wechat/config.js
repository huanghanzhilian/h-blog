/*
* @Author: huangjipeng
* @Date:   2019-10-03 22:33:54
* @Last Modified by:   macintoshhd
* @Last Modified time: 2020-11-30 10:57:05
*/
'use strict'


var path = require('path');
var util = require('./util');
var wechat_file = path.join(__dirname, './wechatFs/wechat.txt') //文本文件
var wechat_ticket_file=path.join(__dirname, './wechatFs/wechat_ticket.txt') //文本文件
var env = process.env.NODE_ENV|| 'development'

// 正式公众号
var appID=''
var appSecret=''

if(env === 'development'){
    appID=''
    appSecret=''
}

//存储一些配置信息  
var config = {
    appID: appID,
    appSecret: appSecret,
    token: 'weixin',
    getAccessToken: function() {
        return util.readFileAsync(wechat_file);
    },
    saveAccessToken: function(data) {
        data=JSON.stringify(data);
        return util.writeFileAsync(wechat_file,data);
    },
    getTicket: function() {
        return util.readFileAsync(wechat_ticket_file);
    },
    saveTicket: function(data) {
        data=JSON.stringify(data);
        return util.writeFileAsync(wechat_ticket_file,data);
    }
}
module.exports = config;