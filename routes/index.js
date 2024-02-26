var Index = require('../app/controllers/index');
var User = require('../app/controllers/user');
var Article = require('../app/controllers/article');
var Admin = require('../app/controllers/admin');
var Comment = require('../app/controllers/comment');
var Guestbook = require('../app/controllers/guestbook');
var Settings = require('../app/controllers/settings');
var About = require('../app/controllers/about');
var Wiki = require('../app/controllers/wiki');
var WechatController = require('../app/controllers/wechat');
var wechat = require('../wechat')
var util = require('../app/controllers/util')

module.exports = function(app) {
  //pre handel user
  app.use(function(req, res, next) {
    var _user = req.session.user;
    app.locals.user = _user;
    app.locals.url = decodeURIComponent(util.fullUrl(req))
    app.locals.urlParse = util.urlParse(app.locals.url)
    app.locals.wechatShare = {}
    wechat.createShareProperties({ url: util.fullUrl(req) }).then(result => {
      app.locals.wechatShare = result
      return next()
    }).catch(error => {
      return next()
    })
  })

  // Index
  app.get('/', Index.index)
  app.get('/wechat/service/enter', WechatController.serviceEnter)
  app.post('/wechat/service/enter', WechatController.serviceEnter)

  //User
  app.get('/signup', User.showSignup); //注册页
  app.get('/signin', User.showSignin); //登录页
  app.get('/logout', User.logout)
  app.post('/user/signup', User.signup);
  app.post('/user/signin', User.signin);

  // results
  app.get('/results', Index.search)

  //article 文章相关
  app.get('/article/:id', Article.detail); //文章详情页

  app.get('/wiki/:id', Wiki.wiki); //书单静态页
  app.get('/wikiId/:id', Wiki.wikiId); //书单详情接口md
  app.get('/wikiList', Wiki.wikiList); //书单列表

  app.get('/admin/home', User.signinRequired, User.adminRequired, Admin.adminIndex); //后台首页

  app.get('/admin/wiki/new', User.signinRequired, User.adminRequired, Admin.wikiNew); //书单录入页
  app.get('/admin/wiki/update/:id', User.signinRequired, User.adminRequired, Admin.wikiUpdate); //重新更新书单
  app.post('/admin/wiki/save', User.signinRequired, User.adminRequired, Wiki.savePoster, Admin.wikiSave); //后台书单录入页
  app.get('/admin/wikimanage', User.signinRequired, User.adminRequired, Admin.wikiManage); //后台书单管理
  app.delete('/admin/wiki/list', User.signinRequired, User.adminRequired, Admin.wikiDel); //后台书单删除

  app.get('/admin/article/new', User.signinRequired, User.adminRequired, Admin.new); //后台文章录入页
  app.get('/admin/article/update/:id', User.signinRequired, User.adminRequired, Admin.update); //重新更新文章
  app.post('/admin/article/save', User.signinRequired, User.adminRequired, Admin.save); //后台文章录入页

  app.get('/admin/categorymanage', User.signinRequired, User.adminRequired, Admin.categorymanage); //后台文章分类管理
  app.get('/admin/categorymanage/add', User.signinRequired, User.adminRequired, Admin.categorymanageAdd); //后台文章分类管理添加
  app.get('/admin/categorymanage/update/:id', User.signinRequired, User.adminRequired, Admin.categorymanageUpdate); //后台文章分类更新名称
  app.post('/admin/categorymanage/save', User.signinRequired, User.adminRequired, Admin.categorymanageSave); //后台文章分类管理新建分类


  app.get('/admin/articlemanage', User.signinRequired, User.adminRequired, Admin.articlemanage); //后台文章管理
  app.delete('/admin/article/list', User.signinRequired, User.adminRequired, Admin.articleDel); //后台文章删除

  // Comment
  app.post('/user/comment', User.signinRequired, Comment.save); //评论文保存
  app.get('/admin/comment', User.signinRequired, User.adminRequired, Comment.manageComment); //一级评论管理页
  app.delete('/admin/comment/list', User.signinRequired, User.adminRequired, Comment.commentDel); //删除一级评论列表
  app.get('/admin/comment/children/:id', User.signinRequired, User.adminRequired, Comment.manageCommentCh); //二级评论管理页
  app.delete('/admin/commentch/list', User.signinRequired, User.adminRequired, Comment.commentDelCh); //删除二级评论列表

  //guestbook 留言
  app.get('/guestbook', Guestbook.showGuestbook); //留言页面
  app.post('/user/guestbook', User.signinRequired, Guestbook.save); //留言保存
  app.get('/admin/guestbook', User.signinRequired, User.adminRequired, Guestbook.manageGuestbook); //一级留言管理页
  app.delete('/admin/guestbook/list', User.signinRequired, User.adminRequired, Guestbook.guestbookDel); //删除一级留言列表
  app.get('/admin/guestbook/children/:id', User.signinRequired, User.adminRequired, Guestbook.manageGuestbookCh); //二级留言管理页
  app.delete('/admin/guestbookch/list', User.signinRequired, User.adminRequired, Guestbook.guestbookDelCh); //删除二级留言列表

  //settings 系统设置
  app.get('/admin/settings', User.signinRequired, User.adminRequired, Settings.showSettings); //系统设置页
  app.post('/admin/saveSettings', User.signinRequired, Settings.savePoster, Settings.saveSettings); //系统设置保存

  //关于本站
  app.get('/admin/about', User.signinRequired, User.adminRequired, About.manageAbout); //后台关于本站设置
  app.post('/admin/about/save', User.signinRequired, User.adminRequired, About.save); //后台关于本站设置提交修改
  app.get('/about', About.showAbout); //后台关于本站设置

  app.post('/uploadImg', User.signinRequired, Article.savePoster, Article.saveImage); //上传文章图片

  //seo
  app.post('/admin/seo', User.signinRequired, Admin.seo);
    //获取代理ip

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error();
    err.status = 404;
    next(err);
  });

  // error handlers
  app.use(function(err, req, res, next) {
    var code = err.status || 500,
      message = code === 404 ? '请求的页面已失联~系统已自动记录该错误。' : '服务器出现故障';
    res.render('web/error', {
      code: code,
      message: message
    });
  });
}
