var Guestbook = require('../models/guestbook'); // 载入mongoose编译后的模型guestbook
var Article = require('../models/article.js'); // 载入mongoose编译后的模型article
var Category = require('../models/category');
var Comment = require('../models/comment');
var Settings = require('../models/settings');

// 留言
exports.showGuestbook = function(req, res) {
	//拿到页码
  var page = parseInt(req.query.p, 10) || 1;
  var count = 10;//每一页只展示两条数据
  var index = (page-1) * count
  let fields = Object.assign({}, { 
      display: '1'
  })
	Guestbook
	.find({},null,{sort:{_id:-1}})
        .populate('from', 'name')
        .populate('reply.to reply.from', 'name')
        .exec(function(err, comments) {
        	Promise.all([
              Article.find(fields,null,{limit: 5,sort:{_id:-1}}).populate('categoryid', 'name').exec(),      //获取最新文章
              Category.find().populate({
                path: 'articles',
                match: { display: '1'},
                select: { 'display': '1' }
              }).exec(),                                                                    //获取所有分类
              Article.find(fields,null,{limit: 5,sort:{pv:-1}}).populate('categoryid', 'name').exec(),       //获取最热文章
              Comment.find({},null,{limit: 5,sort:{_id:-1}})											                       //获取最新评论文章
              .populate('article', 'title display')
              .populate('from', 'name')
              .populate('reply.to reply.from', 'name'),
              Settings.find({})
            ])
            .then(function(data) {
                var newests = data[0];        //获取最新文章
                var categorys = data[1].filter(item => item.articles.length)

                var hottests=data[2];         //获取最热文章
                var newComments=data[3].filter(c => {
                  return c.article.display == '1'
                });      //获取最新评论文章
                var settings = data[4][0]||{};//得到网站配置信息

                var results = comments.slice(index, index + count);
		            var totalPage= Math.ceil(comments.length / count);//总页数
		            var hasPreviousPage=page!=1?true:false;//是否有上一页
		            var hasNextPage=page<totalPage;//是否有下一页
		            var prePage=page==1||page>totalPage?0:page-1;
		            var nextPage=page>=totalPage?0:page+1;

                res.render('web/guestbook', {
					        title: '留下点什么',
					        categorys:categorys,
                  newests:newests,
                  hottests:hottests,
                  newComments:newComments,

                  comments:results,
                  pageNow:page,
	                pageSize:count,
	                recordAmount:comments.length,
	                totalPage: totalPage,
	                hasPreviousPage:hasPreviousPage,
	                hasNextPage:hasNextPage,
	                prePage:prePage,
	                nextPage:nextPage,

                  config: settings,//得到网站配置信息
						    });
            });
        })
};

exports.save = function(req, res) {
    var _comment = req.body.comment;//评论的body数据
    //通过参数判断是否为一级评论还hi二级评论
    if(_comment.cid){
    	Guestbook.findById(_comment.cid, function(err, comment) {
    		var reply={
    			from:_comment.from,
    			to:_comment.tid,
    			content:_comment.content
    		}
    		comment.reply.push(reply);
    		comment.save(function(err, comment) {
    			if (err) {
		            console.log(err);
		        }
		        res.redirect('/guestbook');
    		})
    	})
    }else{
    	var comment = new Guestbook(_comment);
	    comment.save(function(err, comment) {
	        if (err) {
	            console.log(err);
	        }
	        res.redirect('/guestbook');
	    });
    }
};
//一级评论管理页
exports.manageGuestbook= function(req, res) {
  //拿到页码
  var page = parseInt(req.query.p, 10) || 1;
  var count = 10;//每一页只展示两条数据
  var index = (page-1) * count;

  Guestbook
  .find({},null,{sort:{_id:-1}})
  .populate('from', 'name')
  .exec(function(err, comments) {
    var results = comments.slice(index, index + count);
    var totalPage= Math.ceil(comments.length / count);//总页数
    var hasPreviousPage=page!=1?true:false;//是否有上一页
    var hasNextPage=page<totalPage;//是否有下一页
    var prePage=page==1||page>totalPage?0:page-1;
    var nextPage=page>=totalPage?0:page+1;

    res.render('admin/manageGuestbook', {
        title: '留言管理',
        articles: results,
        pageNow:page,
        pageSize:count,
        recordAmount:comments.length,
        totalPage: totalPage,
        hasPreviousPage:hasPreviousPage,
        hasNextPage:hasNextPage,
        prePage:prePage,
        nextPage:nextPage,
    });
  });
};
//二级评论管理页
exports.manageGuestbookCh= function(req, res) {
  var id = req.params.id;
  Guestbook
  .findById(id)
  .populate('from', 'name')
  .populate('reply.to reply.from', 'name')
  .exec(function(err, comments) {
    if (err) {
        res.redirect('admin/guestbook');
    }
    // res.json(comments)
    res.render('admin/manageGuestbookCh', {
        title: '二级留言管理',
        commentsId:comments._id,
        comments:comments.reply
    });
  })
};

//删除一级留言列表
exports.guestbookDel= function(req, res) {
  var id = req.query.id;
  if(id){
    Guestbook.remove({
        _id: id
    }, function(err, movie) {
        if (err) {
            console.log(err);
        } else {
            res.json({
                success: 1
            });
        }
    });
  }
};

//删除二级留言列表
exports.guestbookDelCh= function(req, res) {
  var id = req.query.id;
  var fid = req.query.fid;
  if(id&&fid){
    Guestbook.findByIdAndUpdate(
      fid,
      { $pull: { 'reply':{_id:id}}},function(err, guestbook) {
      if (err) {
          console.log(err);
      }
      res.json({
          success: 1
      });
    })
  }else{
    res.json({
        success: 0
    });
  }
};

