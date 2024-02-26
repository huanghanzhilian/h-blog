var Article = require('../models/article.js'); // 载入mongoose编译后的模型article
var Category = require('../models/category');
var Comment = require('../models/comment');
var Settings = require('../models/settings');

var Promise = require('bluebird')
const md = require('markdown-it')();

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

// index page 首页
exports.index = function(req, res) {
  //拿到页码
  var page = parseInt(req.query.p, 10) || 1;
  var count = 20; //每一页只展示两条数据
  var index = (page - 1) * count
  let fields = Object.assign({}, { 
      display: '1'
  })
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
      var articles = data[0];
      var categorys = data[1].filter(item => item.articles.length)
      var newests = articles.slice(0, 5);
      var hottests = data[2];
      var newComments = data[3].filter(c => {
        return c.article.display == '1'
      })

      var settings = data[4][0] || {}; //得到网站配置信息

      var results = articles.slice(index, index + count);
      var totalPage = Math.ceil(articles.length / count); //总页数
      var hasPreviousPage = page != 1 ? true : false; //是否有上一页
      var hasNextPage = page < totalPage; //是否有下一页
      var prePage = page == 1 || page > totalPage ? 0 : page - 1;
      var nextPage = page >= totalPage ? 0 : page + 1;
      // console.log(results)
      results.forEach(function(item) {
        var haveImgBox = item.content.match(/!\[(.*?)\]\((.*?)\)/),
          haveImg = null;
        if (haveImgBox) {
          haveImg = haveImgBox[2].match(/((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?/);
        }
        if (haveImg) {
          item.haveImg = haveImg[0];
        }
        item.content = abstractFn(item.content);
        //console.log(item)
      })

      res.render('web/index', {
        title: '首页',
        categorys: categorys,
        newests: newests,
        hottests: hottests,
        newComments: newComments,
        articles: results,
        pageNow: page,
        pageSize: count,
        recordAmount: articles.length,
        totalPage: totalPage,
        hasPreviousPage: hasPreviousPage,
        hasNextPage: hasNextPage,
        prePage: prePage,
        nextPage: nextPage,
        config: settings, //得到网站配置信息
      });
    })
}


// search page
exports.search = function(req, res, next) {
  //拿到搜索关键字
  var q = req.query.q
  //拿到分类id
  var catId = req.query.cat;
  let fields = Object.assign({}, {
      display: '1'
  })
  //拿到页码
  var page = parseInt(req.query.p, 10) || 1;
  var count = 20; //每一页只展示两条数据
  var index = (page - 1) * count

  if (catId) {
    Category
      .find({
        _id: catId
      })
      .populate({
        path: 'articles',
        select: 'title pv meta display',
        /*options: {
            limit: 2,
            skip:index
        }*/
      })
      .exec(function(err, articlesbox) {
        if (err) {
          return next(err)
        }
        Promise.all([
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
            var articles = articlesbox[0].articles.filter(c => {
              return c.display == '1'
            });
            var categorys = data[0].filter(item => item.articles.length)
            var newests = articles.slice(0, 5);
            var hottests = data[1];
            var newComments = data[2].filter(c => {
              return c.article.display == '1'
            })
            var settings = data[3][0] || {}; //得到网站配置信息
            var results = articles.slice(index, index + count);
            var totalPage = Math.ceil(articles.length / count); //总页数
            var hasPreviousPage = page != 1 ? true : false; //是否有上一页
            var hasNextPage = page < totalPage; //是否有下一页
            var prePage = page == 1 || page > totalPage ? 0 : page - 1;
            var nextPage = page >= totalPage ? 0 : page + 1;

            res.render('web/results', {
              title: '结果列表页面',

              categorys: categorys,
              newests: newests,
              hottests: hottests,
              newComments: newComments,

              articles: results,
              pageNow: page,
              pageSize: count,
              recordAmount: articles.length,
              totalPage: totalPage,
              hasPreviousPage: hasPreviousPage,
              hasNextPage: hasNextPage,
              prePage: prePage,
              nextPage: nextPage,

              config: settings, //得到网站配置信息
            });
          })
      })
  } else {
    Promise.all([
        Article.find({
          title: new RegExp(q + '.*', 'i'),
          display: '1'
        }, null, { sort: { _id: -1 } }).populate('categoryid', 'name').exec(),
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
        var articles = data[0];
        var categorys = data[1].filter(item => item.articles.length)
        var newests = articles.slice(0, 5);
        var hottests = data[2];
        var newComments = data[3].filter(c => {
          return c.article.display == '1'
        })
        var settings = data[4][0] || {}; //得到网站配置信息

        var results = articles.slice(index, index + count);
        var totalPage = Math.ceil(articles.length / count); //总页数
        var hasPreviousPage = page != 1 ? true : false; //是否有上一页
        var hasNextPage = page < totalPage; //是否有下一页
        var prePage = page == 1 || page > totalPage ? 0 : page - 1;
        var nextPage = page >= totalPage ? 0 : page + 1;

        res.render('web/results', {
          title: '结果列表页面',

          categorys: categorys,
          newests: newests,
          hottests: hottests,
          newComments: newComments,

          articles: results,
          pageNow: page,
          pageSize: count,
          recordAmount: articles.length,
          totalPage: totalPage,
          hasPreviousPage: hasPreviousPage,
          hasNextPage: hasNextPage,
          prePage: prePage,
          nextPage: nextPage,

          config: settings, //得到网站配置信息
        });
      })

  }

}