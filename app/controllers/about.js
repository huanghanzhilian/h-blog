var About = require('../models/about');

var Article = require('../models/article.js'); // 载入mongoose编译后的模型article
var Category = require('../models/category');
var Comment = require('../models/comment');
var Settings = require('../models/settings');

const md = require('markdown-it')({html:true});
var _underscore = require('underscore'); // _.extend用新对象里的字段替换老的字段

// 关于本站展示
exports.showAbout = function(req, res) {
    let fields = Object.assign({}, { 
          display: '1'
      })
    About
        .find({})
        .exec(function(err, about) {
            Promise.all([
                    Article.find(fields, null, { limit: 5, sort: { _id: -1 } }).populate('categoryid', 'name').exec(), //获取最新文章
                    Category.find().populate({
                        path: 'articles',
                        match: { display: '1'},
                        select: { 'display': '1' }
                      }).exec(),
                    Article.find(fields, null, { limit: 5, sort: { pv: -1 } }).populate('categoryid', 'name').exec(), //获取最热文章
                    Comment.find({}, null, { limit: 5, sort: { _id: -1 } }) //获取最新评论文章
                    .populate('article', 'title display')
                    .populate('from', 'name')
                    .populate('reply.to reply.from', 'name'),
                    Settings.find({})
                ])
                .then(function(data) {
                    var newests = data[0]; //获取最新文章
                    var categorys = data[1].filter(item => item.articles.length)
                    var hottests = data[2]; //获取最热文章
                    var newComments = data[3].filter(c => {
                      return c.article.display == '1'
                    });
                    var settings = data[4][0] || {}; //得到网站配置信息
                    var abstract;
                    if(about.length&&about[0].content){
                        abstract=abstractFn(about[0].content);
                        var alt_reg = /\!\[[\s\S]*?\]\([\s\S]*?\)/g;
                        about[0].content = about[0].content.replace(alt_reg,function(match, index, origin){
                            return match.replace(/\[(\S*)\]/,'[关于本站-黄继鹏博客]')
                        })
                        about[0].content=md.render(about[0].content);
                    }
                    res.render('web/about', {
                        title: '关于本站',
                        abstract:abstract,//文章剪切
                        about: about[0] || {},
                        categorys: categorys,
                        newests: newests,
                        hottests: hottests,
                        newComments: newComments,
                        config: settings, //得到网站配置信息
                    });
                });
        })

};

//管理关于本站
exports.manageAbout = function(req, res) {
    About.find({}, function(err, about) {
        res.render('admin/manageAbout', {
            title: '本站设置',
            about: about[0] || {}
        });
    })
};

//编辑关于本站
exports.save = function(req, res) {
    var aboutObj = req.body.about || "";
    var _about = null;
    About.find({}, function(err, about) {
        if (err) {
            console.log(err)
        }
        if (about.length) {
            _about = _underscore.extend(about[0], aboutObj); // 用新对象里的字段替换老的字段
            about[0].save(function(err, about) {
                if (err) {
                    console.log(err)
                }
                res.redirect('/admin/about');
            })
        } else {
            var aboutOne = new About(aboutObj);
            aboutOne.save(function(err, about) {
                if (err) {
                    console.log(err)
                }
                res.redirect('/admin/about');
            })
        }
    })
};

function abstractFn(res){
  if(!res){
    return '';
  }else{
    var str=res.replace(/(\*\*|__)(.*?)(\*\*|__)/g,'')          //全局匹配内粗体
    .replace(/\!\[[\s\S]*?\]\([\s\S]*?\)/g,'')                  //全局匹配图片
    .replace(/\[[\s\S]*?\]\([\s\S]*?\)/g,'')                    //全局匹配连接
    .replace(/<\/?.+?\/?>/g,'')                                 //全局匹配内html标签
    .replace(/(\*)(.*?)(\*)/g,'')                               //全局匹配内联代码块
    .replace(/`{1,2}[^`](.*?)`{1,2}/g,'')                       //全局匹配内联代码块
    .replace(/```([\s\S]*?)```[\s]*/g,'')                       //全局匹配代码块
    .replace(/\~\~(.*?)\~\~/g,'')                               //全局匹配删除线
    .replace(/[\s]*[-\*\+]+(.*)/g,'')                           //全局匹配无序列表
    .replace(/[\s]*[0-9]+\.(.*)/g,'')                           //全局匹配有序列表
    .replace(/(#+)(.*)/g,'')                                    //全局匹配标题
    .replace(/(>+)(.*)/g,'')                                    //全局匹配摘要
    .replace(/\r\n/g,"")                                        //全局匹配换行
    .replace(/\n/g,"")                                          //全局匹配换行
    .replace(/\s/g,"")                                          //全局匹配空字符;
    return str.slice(0,155);
  }
}
