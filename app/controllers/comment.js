var Comment = require('../models/comment'); // 载入mongoose编译后的模型comment

// comment
exports.save = function(req, res) {
    var _comment = req.body.comment
    var articleId = _comment.article
    //通过参数判断是否为一级评论还hi二级评论
    if (_comment.cid) {
        Comment.findById(_comment.cid, function(err, comment) {
            var reply = {
                from: _comment.from,
                to: _comment.tid,
                content: _comment.content
            }
            comment.reply.push(reply);
            comment.save(function(err, comment) {
                if (err) {
                    console.log(err);
                }
                res.redirect('/article/' + articleId);
            })
        })
    } else {
        var comment = new Comment(_comment);
        comment.save(function(err, comment) {
            if (err) {
                console.log(err);
            }
            res.redirect('/article/' + articleId);
        });
    }
};

//一级评论管理页
exports.manageComment = function(req, res) {
    //拿到页码
    var page = parseInt(req.query.p, 10) || 1;
    var count = 10; //每一页只展示两条数据
    var index = (page - 1) * count;

    Comment
        .find({}, null, { sort: { _id: -1 } })
        .populate('article', 'title')
        .populate('from', 'name')
        .exec(function(err, comments) {
            //console.log(comments)
            var results = comments.slice(index, index + count);
            var totalPage = Math.ceil(comments.length / count); //总页数
            var hasPreviousPage = page != 1 ? true : false; //是否有上一页
            var hasNextPage = page < totalPage; //是否有下一页
            var prePage = page == 1 || page > totalPage ? 0 : page - 1;
            var nextPage = page >= totalPage ? 0 : page + 1;

            res.render('admin/manageComment', {
                title: '评论管理',
                articles: results,
                pageNow: page,
                pageSize: count,
                recordAmount: comments.length,
                totalPage: totalPage,
                hasPreviousPage: hasPreviousPage,
                hasNextPage: hasNextPage,
                prePage: prePage,
                nextPage: nextPage,
            });
        });
};

//删除一级评论列表
exports.commentDel= function(req, res) {
  var id = req.query.id;
  if(id){
    Comment.remove({
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

//二级评论管理页
exports.manageCommentCh= function(req, res) {
  var id = req.params.id;
  Comment
  .findById(id)
  .populate('from', 'name')
  .populate('reply.to reply.from', 'name')
  .exec(function(err, comments) {
    if (err) {
        console.log(err)
        res.redirect('admin/comment');
    }
    // res.json(comments)
    res.render('admin/manageCommentCh', {
        title: '二级评论管理',
        commentsId:comments._id,
        comments:comments.reply
    });
  })
};

//删除二级评论列表
exports.commentDelCh= function(req, res) {
  var id = req.query.id;
  var fid = req.query.fid;
  if(id&&fid){
    Comment.findByIdAndUpdate(
      fid,
      { $pull: { 'reply':{_id:id}}},function(err, comment) {
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

