/*
* @Author: macintoshhd
* @Date:   2019-12-16 14:58:26
* @Last Modified by:   macintoshhd
* @Last Modified time: 2019-12-16 17:38:31
*/
var Wechat = require('./wechatApi')
var config = require('./config')
module.exports = new Wechat(config)