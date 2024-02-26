var moment = require('moment');
var Promise = require('bluebird')

var Article = require('../models/article.js'); // 载入mongoose编译后的模型article
var Category = require('../models/category');
var Comment = require('../models/comment');
var Settings = require('../models/settings');


var fs = require('fs')
var path = require('path')
var multer = require('multer')
var uuid = require('uuid') //生成唯一标识
var _underscore = require('underscore'); // _.extend用新对象里的字段替换老的字段

var hljs = require('highlight.js'); // https://highlightjs.org/
const md = require('markdown-it')({
  html: true,
  highlight: function(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>';
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

/*const md = new require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    // 此处判断是否有添加代码语言
    if (lang && hljs.getLanguage(lang)) {
      try {
        // 得到经过highlight.js之后的html代码
        const preCode = hljs.highlight(lang, str, true).value
        // 以换行进行分割
        const lines = preCode.split(/\n/).slice(0, -1)
        // 添加自定义行号
        let html = lines.map((item, index) => {
          return '<li><span class="line-num" data-line="' + (index + 1) + '"></span>' + item + '</li>'
        }).join('')
        html = '<ol>' + html + '</ol>'
        // 添加代码语言
        if (lines.length) {
          html += '<b class="name">' + lang + '</b>'
        }
        return '<pre class="hljs"><code>' +
          html +
          '</code></pre>'
      } catch (__) {}
    }
  // 未添加代码语言，此处与上面同理
    const preCode = md.utils.escapeHtml(str)
    const lines = preCode.split(/\n/).slice(0, -1)
    let html = lines.map((item, index) => {
      return '<li><span class="line-num" data-line="' + (index + 1) + '"></span>' + item + '</li>'
    }).join('')
    html = '<ol>' + html + '</ol>'
    return '<pre class="hljs"><code>' +
      html +
      '</code></pre>'
  }
})*/



//上传qq二维码 中间件
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var dirPathParent = path.join(__dirname, '../../public/uploads/'); //得到要保存的文件夹
    var dirPath = path.join(dirPathParent, 'article'); //不能直接创建dirPath，因为父目录不存在会抛出异常
    fs.mkdir(dirPathParent, function(err) {
      if (err && err.code !== 'EEXIST') {
        cb(err);
      } else {
        fs.mkdir(dirPath, function(err) {
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
    cb(null, uuid.v4() + '.' + type)
  }
});


exports.savePoster = function(req, res, next) {
  if (req.query.guid) {
    var uploadfind = multer({ storage: storage }).single('editormd-image-file')
  } else {
    var uploadfind = multer({ storage: storage }).single('file')
  }
  
  uploadfind(req, res, function(err) {
    if (err) {
      next(err);
    }
    next();
  })
};

exports.saveImage = function(req, res) {
  var fileUrl = '/uploads/article/' + req.file.filename;
  res.json({
    success: 1,
    url: fileUrl,
    message: 'ok'
  })
};



// detail page 文章详情页
exports.detail = function(req, res, next) {
  var id = req.params.id;
  let fields = Object.assign({}, { 
      display: '1'
  })
  Article.findById(id)
    .populate('categoryid', 'name')
    .exec(function(err, article) {
      if (err) {
        return next(err)
      }
      if (!article) {
        var error = new Error();
        error.status = 404;
        return next(error)
      }
      //每次访问更新pv
      Article.update({ _id: id }, { $inc: { pv: 1 } }, function(err) {
        if (err) {
          return next(err)
        }
      })
      Comment
        .find({ article: id }, null, { sort: { _id: -1 } })
        .populate('from', 'name')
        .populate('reply.to reply.from', 'name')
        .exec(function(err, comments) {
          Promise.all([
              Article.find(fields, null, { sort: { _id: -1 } }).populate('categoryid', 'name').exec(),
              Category.find().populate({
                path: 'articles',
                match: { display: '1'},
                select: { 'display': '1' }
              }).exec(),
              Article.find(fields, null, { limit: 5, sort: { pv: -1 } }).populate('categoryid', 'name').exec(),
              Comment.find({}, null, { limit: 5, sort: { _id: -1 } })
              .populate('article', 'title display')
              .populate('from', 'name')
              .populate('reply.to reply.from', 'name'),
              Settings.find({})
            ])
            .then(function(data) {
              //console.log(data[0])
              var articles = data[0];
              var categorys = data[1].filter(item => item.articles.length)
              var newests = articles.slice(0, 5);
              var hottests = data[2];
              var newComments = data[3].filter(c => {
                return c.article.display == '1'
              })

              var settings = data[4][0] || {}; //得到网站配置信息

              var abstract = abstractFn(article.content);

              var alt_reg = /\!\[[\s\S]*?\]\([\s\S]*?\)/g;
              article.content = article.content.replace(alt_reg, function(match, index, origin) {
                return match.replace(/\[(\S*)\]/, '[' + article.title + '-黄继鹏博客]')
                // return match.replace(/\[(\S*)\]/,'['+article.title+'-黄继鹏博客]').replace(/(\.\w+)([\S\s]*)/,'$1 "'+article.title+'黄继鹏博客")')
              })
              article.content = md.render(article.content);
              res.render('web/article', {
                createAt: moment(article.meta.createAt).format("YYYY-MM-DD"),
                title: article.title,
                content: article.content,
                abstract: abstract, //文章剪切
                contentType: article.categoryid.name,
                article: article,
                comments: comments,

                articles: articles,
                categorys: categorys,
                newests: newests,
                hottests: hottests,
                newComments: newComments,

                config: settings, //得到网站配置信息
              });

            })
        })
    })

};

function abstractFn(res) {
  if (!res) {
    return '';
  } else {
    var str = res.replace(/(\*\*|__)(.*?)(\*\*|__)/g, '') //全局匹配内粗体
      .replace(/\!\[[\s\S]*?\]\([\s\S]*?\)/g, '') //全局匹配图片
      .replace(/\[[\s\S]*?\]\([\s\S]*?\)/g, '') //全局匹配连接
      .replace(/<\/?.+?\/?>/g, '') //全局匹配内html标签
      .replace(/(\*)(.*?)(\*)/g, '') //全局匹配内联代码块
      .replace(/`{1,2}[^`](.*?)`{1,2}/g, '') //全局匹配内联代码块
      .replace(/```([\s\S]*?)```[\s]*/g, '') //全局匹配代码块
      .replace(/\~\~(.*?)\~\~/g, '') //全局匹配删除线
      .replace(/[\s]*[-\*\+]+(.*)/g, '') //全局匹配无序列表
      .replace(/[\s]*[0-9]+\.(.*)/g, '') //全局匹配有序列表
      .replace(/(#+)(.*)/g, '') //全局匹配标题
      .replace(/(>+)(.*)/g, '') //全局匹配摘要
      .replace(/\r\n/g, "") //全局匹配换行
      .replace(/\n/g, "") //全局匹配换行
      .replace(/\s/g, "") //全局匹配空字符;
    return str.slice(0, 155);
  }
}