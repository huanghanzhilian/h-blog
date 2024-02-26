/*
 * @Author: huangjipeng
 * @Date:   2019-10-03 23:08:27
 * @Last Modified by:   macintoshhd
 * @Last Modified time: 2020-02-11 17:51:27
 */
'use strict'

var fs = require('fs');
var Promise = require('bluebird');
var crypto = require('crypto'); //sha1排序算法
var tpl = require('./tpl');

//生产随机字符串
var createNonce = function() {
  return Math.random().toString(36).substr(2, 15);
}
//生成时间戳
var createTimestamp = function() {
  return parseInt(new Date().getTime() / 1000, 10) + '';
}
var _sign = function(noncestr, ticket, timesstr, url) {
  var params = [
    'noncestr=' + noncestr,
    'jsapi_ticket=' + ticket,
    'timestamp=' + timesstr,
    'url=' + decodeURIComponent(url)
  ]
  var str = params.sort().join('&');
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}
//生产签名  暴露出去
exports.sign = function(ticket, url) {
  var noncestr = createNonce();
  var timesstr = createTimestamp();
  var signature = _sign(noncestr, ticket, timesstr, url);
  return {
    nonceStr: noncestr,
    timestamp: timesstr,
    signature: signature,
  }
}

//读取
exports.readFileAsync = function(fpath, encoding) {

  return new Promise(function(resolve, reject) {
    fs.readFile(fpath, encoding, function(err, content) {
      if (err) reject(err)
      else { resolve(content) }
    });
  })
}

//写
exports.writeFileAsync = function(fpath, content) {

  return new Promise(function(resolve, reject) {
    fs.writeFile(fpath, content, function(err) {

      if (err) reject(err)
      else { resolve() }
    });
  })
}
exports.URLA = function(url) {
  return (/(http|https):\/\/([\w.]+\/?)\S*/.test(url));
}

exports.getRanNum = function(num) {
  var result = [];
  for (var i = 0; i < num; i++) {
    var ranNum = Math.ceil(Math.random() * 25); //生成一个0到25的数字
    //大写字母'A'的ASCII是65,A~Z的ASCII码就是65 + 0~25;然后调用String.fromCharCode()传入ASCII值返回相应的字符并push进数组里
    result.push(String.fromCharCode(65 + ranNum));
  }
  return result.join('').toLocaleLowerCase();
}
// 对请求结果统一封装处理
exports.handleResponse = (err, response, body) => {
  if (!err && response.statusCode == '200') {
    let data = JSON.parse(body);

    if (data && !data.errcode) {
      return this.handleSuc(data);
    } else {
      return this.handleFail(data.errmsg, data.errcode);
    }
  } else {
    return this.handleFail(err, 10009);
  }
}
exports.handleSuc = (data = '') => {
  return {
    code: 0,
    data,
    message: ''
  }
}
exports.handleFail = (message = '', code = 10001) => {
  return {
    code,
    data: '',
    message
  }
}

exports.tpl = function(content, message) {
  var info = {};
  var type = 'text';
  var fromUserName = message.FromUserName;
  var toUserName = message.ToUserName;

  if (Array.isArray(content)) {
    type = 'news';
  }
  if (content) {
    type = content.type || type;
  }

  info.content = content;
  info.createTime = new Date().getTime();
  info.msgType = type;
  info.toUserName = fromUserName;
  info.fromUserName = toUserName;
  return tpl.compiled(info);
};