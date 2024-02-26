var fs = require('fs')
var path = require('path')
var multer = require('multer')
var uuid=require('uuid') //生成唯一标识
var Settings = require('../models/settings');
var _underscore = require('underscore'); // _.extend用新对象里的字段替换老的字段
//var upload = multer({ dest: 'uploads/' })


//上传qq二维码 中间件
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
    	var dirPathParent = path.join(__dirname, '../../public/uploads/');//得到要保存的文件夹
    	var dirPath = path.join(dirPathParent, 'qq');//不能直接创建dirPath，因为父目录不存在会抛出异常
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




// 系统设置页页
exports.showSettings = function(req, res) {
    Settings.find({},function(err, settings){
        if (err) {
            console.log(err)
        }
        res.render('admin/settings', {
            title: '系统设置',
            settings:settings[0]||{}
        });
    })
};

//系统设置保存
exports.saveSettings = function(req, res) {
    var settingsObj=req.body.settings || "";
    if(req.file){
        settingsObj.fileupload='/uploads/qq/'+req.file.filename;
    }
    if(!settingsObj.qqfileshow||settingsObj.qqfileshow=='false'){
        settingsObj.qqfileshow=false;
    }else{
        settingsObj.qqfileshow=true;
    }

    var _settings = null;
    Settings.find({},function(err, settings){
        if (err) {
            console.log(err)
        }
        if (settings.length) {
            _article = _underscore.extend(settings[0], settingsObj); // 用新对象里的字段替换老的字段
            settings[0].save(function(err, settings) {
                if (err) {
                    console.log(err)
                }
                res.json({
                    success:true,
                    data:settings
                })
            })
          } else {
            var settingsOne = new Settings(settingsObj);
            settingsOne.save(function(err, settings) {
                if (err) {
                    console.log(err)
                }
                res.json({
                    success:true,
                    data:settings
                })
            })
        }
    })
    // res.json(req.body);
};

//系统设置保存
exports.savePoster = function(req, res, next) {
    var uploadfind = multer({ storage: storage }).single('fileupload')
    uploadfind(req, res, function(err) {
        if (err) {
            next(err);
        }
        next();
    })
};


