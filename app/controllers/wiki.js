
var Promise=require('bluebird')
var Settings = require('../models/settings');
var Wiki = require('../models/wiki.js'); // 载入mongoose编译后的模型wiki



var fs = require('fs')
var path = require('path')
var multer = require('multer')
var uuid=require('uuid') //生成唯一标识
var _underscore = require('underscore'); // _.extend用新对象里的字段替换老的字段

const md = require('markdown-it')();



var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      var dirPathParent = path.join(__dirname, '../../public/uploads/');//得到要保存的文件夹
      var dirPath = path.join(dirPathParent, 'wiki');//不能直接创建dirPath，因为父目录不存在会抛出异常
      fs.mkdir(dirPathParent, function (err) {
            if (err && err.code !== 'EEXIST') {
                cb(err);
            } else {
                fs.mkdir(dirPath, function (err) {
                    if (err && err.code !== 'EEXIST') {
                        cb(err);
                    } else {
                        cb(null, dirPath);
                    }
                });
            }
        });
    },
    filename: function(req, file, cb) {
      var type = file.mimetype.split('/')[1]
        cb(null,uuid.v4()+'.'+type)
    }
});


exports.savePoster = function(req, res, next) {
    var uploadfind = multer({ storage: storage }).single('fileupload')
    uploadfind(req, res, function(err) {
        if (err) {
            next(err);
        }
        next();
    })
};




exports.wiki = function(req, res,next) {
  var id = req.params.id;
  Wiki.findById(id)
  .exec(function(err, wiki) {
    // console.log(wiki)
    if (err) {
      console.log(err)
      return next(err)
    }
    if(!wiki){
      var error = new Error();
      error.status = 404;
      return next(error)
    }
    res.render('web/wiki', {
      title:wiki.title,
      wikiId:id
    });
  })
  
};

exports.wikiId = function(req, res,next) {
  var id = req.params.id;

    Wiki.findById(id)
    .exec(function(err, wiki) {
      if (err) {
        console.log(err)
        return next(err)
      }
      if(!wiki){
        var error = new Error();
        error.status = 404;
        return next(error)
      }
      
      res.send(wiki.content);
    })

};

exports.wikiList = function(req, res,next) {
  Promise.all([
      Wiki.find({}, null, { sort: { _id: -1 } }),
      Settings.find({})
  ])
  .then(function(data) {
      var wiki = data[0];
      var settings = data[1];
      res.render('web/wikiList', {
          title:"书",
          wiki:wiki,
          config: settings //得到网站配置信息
      });
  });
};

