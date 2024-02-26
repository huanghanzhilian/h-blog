'use strict'

var path = require('path');
const wechat = require('./index.js')

// var help = '亲爱的，欢迎关注科幻电影世界\n' +
//    '回复 1 ~ 3，测试文字回复\n' +
//    '回复 4，测试图文回复\n' +
//    '回复 首页，进入电影首页\n' +
//    '回复 电影名字，查询电影信息\n' +
//    '某些功能订阅号无权限，如网页授权\n' +
//    '回复 语音，查询电影信息\n' +
//    '也可以点击 <a href="' + options.baseUrl + '/wechat/movie">语音查电影</a>'

module.exports = async function (message) {
  let response = ''
  //关于事件类型
  if (message.MsgType === 'event') {
    //关注
    if (message.Event === 'subscribe') {
      // let data = await wechat.getUserInfo(message.FromUserName)
      response = '嘿，来了啊\n欢迎回家！';
    }
    //取消关注
    else if (message.Event === 'unsubscribe') {
      response = ''
    }
    //地理位置
    else if (message.Event === 'LOCATION') {
      response = '您上报的位置是:' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
    }
    //点击了菜单
    else if (message.Event === 'CLICK') {
      response = '您点击了菜单:' + message.EventKey
    }
    //扫描
    else if (message.Event === 'SCAN') {
      console.log('关注后二维码' + message.EventKey + ' ' + message.Ticket)
      response = '看到你扫了一下哦';
    }
    //点击菜单中的链接
    else if (message.Event === 'VIEW') {
      response = '您点击了菜单中的链接' + message.EventKey;
    }
  } else if (message.MsgType === 'voice') {
    var voiceText = message.Recognition
    var reply = '没有查询到与 ' + voiceText + ' 匹配的电影，要不要换一个名字试试'
    this.body = reply
  } else if (message.MsgType === 'text') {
    var content = message.Content;
    var reply = '额,您说的' + content + ' 太复杂了'
    if (content == '1') {
      reply = '天下第一吃大米111';
    } else if (content == '2') {
      reply = '天下第二吃豆腐';
    } else if (content == '3') {
      reply = '天下第三吃仙丹';
    }
    //回复图文
    else if (content == '4') {
      reply = [{
        title: '欢迎来到我的博客',
        description: '愿我们一起共同成长，祝你有所收获',
        picUrl: 'http://blog.cheerspublishing.cn/images/logo.png',
        url: 'http://blog.cheerspublishing.cn'
      }];
    }else if (content == '5') {
      reply = [{
        title: 'JavaScript 精粹 基础 进阶(1)数据类型',
        description: '类型不同，尝试类型转换和比较:null==undefined相等number==string转number1==“boolean==?转number1==true//trueobject==number|string尝试对象转为基本类型newString("hi")==‘hi’//true其它：false顾名',
        picUrl: 'http://blog.cheerspublishing.com/uploads/article/5a034ed7-fba9-40f7-a10e-0baabdfc8179.png',
        url: 'http://blog.cheerspublishing.cn/article/5b698e54b8ea642ea9213f49'
      }];
    } else {
      reply = '没有查询到与 ' + content + ' 匹配的电影，要不要换一个名字试试'
    }
    response = reply;
  }

  return response
};