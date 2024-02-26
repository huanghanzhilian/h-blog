var url = require('url')
var xml2js = require('xml2js'); //解析xml需要`xml2js`模块

exports.fullUrl = (req) => {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  })
}

exports.urlParse = (urlStr) => {
  return url.parse(urlStr)
}

/**
 * [parseXMLAsync 解析xml]
 */
exports.parseXMLAsync = function (xml) {
  //返回一个Promise对象
  return new Promise(function(resolve, reject) {
    xml2js.parseString(xml, { trim: true }, function(err, content) {
      if (err) reject(err)
      else resolve(content)
    })
  })
}

exports.formatMessage = function (result) {
  var message = {};
  if (typeof result === 'object') {
    var keys = Object.keys(result)
    for (var i = 0; i < keys.length; i++) {
      var item = result[keys[i]];
      var key = keys[i];
      if (!(item instanceof Array) || item.length === 0) {
        continue; //退出
      }
      if (item.length === 1) {
        var val = item[0];
        if (typeof val === 'object') {
          message[key] = formatMessage(val)
        } else {
          message[key] = (val || '').trim();
        }
      } else {
        message[key] = [];
        for (var j = 0, k = item.length; j < k; j++) {
          message[key].push(formatMessage(item[j]))
        }
      }
    }
  }
  return message;
}
