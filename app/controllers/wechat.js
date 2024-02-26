const sha1 = require('sha1');
const wechat = require('../../wechat')
const replyTransform = require('../../wechat/reply')
const util = require('./util');

/**
 * [serviceEnter 微信服务入口检验]
 */

exports.serviceEnter = async function(req, res, next) {
  var token = wechat.token; //拿到token
  var signature = req.query.signature; //拿到一个签名
  var nonce = req.query.nonce; //拿到nonce
  var timestamp = req.query.timestamp; //拿到时间戳
  var echostr = req.query.echostr; //拿到echostr

  //进行字典排序
  var str = [token, timestamp, nonce].sort().join('');
  //进行加密
  var sha = sha1(str)

  //判断加密值是否等于签名值
  if (sha !== signature) {
  	return res.send('错误');
  }
  //请求方法的判断
  if (req.method === 'GET') {
    return res.send(echostr + '');
  } else if (req.method === 'POST') {
  	var wechatContent = await util.parseXMLAsync(req.rawBody)
  	var message = util.formatMessage(wechatContent.xml)
    var body = await replyTransform(message)
    var replyMessage = wechat.reply(body, message)
    console.log('=======message======')
    console.log(message)
    console.log('=======body======')
    console.log(body)
    res.set('Content-Type', 'application/xml')
    return res.send(replyMessage)
  }
};
