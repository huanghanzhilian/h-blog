var multer = require('multer');
var _underscore = require('underscore'); // _.extend用新对象里的字段替换老的字段
var Article = require('../../models/article.js'); // 载入mongoose编译后的模型article
var Wiki = require('../../models/wiki');
var Category = require('../../models/category');
var Comment = require('../../models/comment');
var util = require('../util')
var pick = require('lodash.pick');
var fs = require('fs');
var path = require('path');
const md = require('markdown-it')();
const xml2js = require('xml2js')
const parser = new xml2js.Parser()
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))

// admin page 首页
exports.adminIndex = function(req, res) {
    res.render('admin/index', {
        title: '后台管理',
    })
}

exports.seo = function(req, res) {
    console.log({
        href:req.headers.origin,
        save_path:path.resolve('./', './public/sitemap1.xml')
    })
    var sitemap = require('./pachongutil.js');
    console.log('>>>>>>>>>>>>>>>>>>>开始执行>>>>>>>>>>>>>>>>>>>>>>>>')
    sitemap.init({
        href:'http://blog.huanghanlian.com',//req.headers.origin,
        save_path:path.resolve('./', './public/sitemap1.xml'),
        show_url:true,
    },function(result){
        console.log(result)
        if(result.code){
            fs.readFile(path.resolve('./', './public/sitemap1.xml'), 'utf-8', (error, data) => {//先读取文件
                if (error) {
                    console.log(error);
                    res.json({
                        success: 0
                    });
                } else {
                    parser.parseString(data, (err, result) => {//xml转为json
                        var urls = result.urlset.url.map(obj => obj.loc)//读取所有url存到数组
                        const reqData = urls.join('\n')//用换行符把所有url连成字符串
                        console.log('==========得到xml=========')
                        console.log(reqData)
                        console.log('==========得到xml=========')
                        console.log('>>>>>>>>>>>>>>>>>>>执行完毕>>>>>>>>>>>>>>>>>>>>>>>>')
                        const postOptions = {
                            url:'http://data.zz.baidu.com/urls?site=blog.huanghanlian.com&token=rSfq9MRpfu58ccwB',
                            method: 'POST',
                            headers: {
                                'User-Agent': 'curl/7.12.1',
                                'Content-Type': 'text/plain',
                                'Content-Length': reqData.length
                            },
                            body: reqData
                        }

                        request(postOptions)
                        .then((response)=>{
                            var resDatatwo=JSON.parse(response.body)
                            console.log('==========得到百度请求响应=========')
                            console.log(resDatatwo)
                            console.log('==========得到百度请求响应=========')
                            if(resDatatwo.success){
                                res.json({
                                    success: 1,
                                    reqData:reqData,
                                    alllength:urls.length
                                });
                            }else{
                                res.json({
                                    success: 0
                                });
                            }
                        }).catch((err)=>{
                            res.json({
                                success: 0
                            });
                        })


                        // res.json({
                        //     success: 1,
                        //     reqData:reqData,
                        //     alllength:urls.length
                        // });
                    })

                }

            })
        }else{
            res.json({
                success: 0
            });
        }
    });
};


//书单录入页
exports.wikiNew = function(req, res) {
    res.render('admin/wikiNew', {
        title: '书单录入页',
        wiki: {}
    })
};

// 后台书单更新页
exports.wikiUpdate = function(req, res) {
    var id = req.params.id;
    if (id) {
        Wiki.findById(id, function(err, wiki) {
            res.render('admin/wikiNew', {
                title: '书单更新',
                wiki: wiki
            });
        });
    }
};
// 后台书单删除

exports.wikiDel= function(req, res) {
  var id = req.query.id;
  if(id){
    Wiki.findById(id, function(err, wiki) {
        Promise.all([
            Wiki.remove({_id: id}),
        ])
        .then(function(data) {
            res.json({
                success: 1
            });
        }).catch(function onRejected(error){
            res.json({
                success: 0
            });
        });
    })
  }
};

exports.wikiSave = function(req, res) {
    var id = req.body.wiki._id || "";
    var wikiObj = req.body.wiki || "";
    var _wiki = null;
    if(req.file){
        wikiObj.poster='/uploads/wiki/'+req.file.filename;
    }

    // 已经存在的数据
    if(id){
        Wiki.findById(id, function(err, wiki) {
            if (err) {
                console.log(err);
            }
            var beforeCategoryId=wiki._id;

            _wiki = _underscore.extend(wiki, wikiObj); // 用新对象里的字段替换老的字段
            _wiki.save(function(err, article) {
                if (err) {
                    console.log(err);
                }
                res.redirect('/admin/wiki/update/'+id);
            });
        });
    }else{
        // 新加的文章
        _wiki = new Wiki(wikiObj);
        _wiki.save(function(err, wiki) {
            if (err) {
                console.log(err);
            }
            res.redirect('/admin/wikimanage');
        })
    }
};
//后台书单管理
exports.wikiManage = function(req, res) {
    //拿到页码
    var page = parseInt(req.query.p, 10) || 1;
    var count = 10;//每一页只展示两条数据
    var index = (page-1) * count

    Wiki.find({}, null, { sort: { _id: -1 } })
    .exec(function(err, wiki) {
        if (err) {
            console.log(err)
        }
        var results = wiki.slice(index, index + count);
        var totalPage= Math.ceil(wiki.length / count);//总页数
        var hasPreviousPage=page!=1?true:false;//是否有上一页
        var hasNextPage=page<totalPage;//是否有下一页
        var prePage=page==1||page>totalPage?0:page-1;
        var nextPage=page>=totalPage?0:page+1;

        res.render('admin/wikimanage', {
            title: '书单管理',
            wiki: results,
            pageNow:page,
            pageSize:count,
            recordAmount:wiki.length,
            totalPage: totalPage,
            hasPreviousPage:hasPreviousPage,
            hasNextPage:hasNextPage,
            prePage:prePage,
            nextPage:nextPage,
        });
    })
};



//后台录入页
exports.new = function(req, res) {
    Category.find({}, function(err, categories) {
        res.render('admin/newArticle', {
            title: '文章录入页',
            articles: {},
            categories: categories
        })
    })
};

exports.update = function(req, res) {
    var id = req.params.id;
    if (id) {
        Article.findById(id, function(err, article) {
            Category.find({}, function(err, categories) {
                res.render('admin/newArticle', {
                    title: '文章更新',
                    articles: article,
                    categories:categories
                });
            })
        });
    }
};


//后台录入提交  文章的保存
exports.save = function(req, res) {
    var id = req.body.article._id || "";
    var articleObj = req.body.article || "";
    var categoryId=articleObj.categoryid;
    var _article = null;
    if (!categoryId) {
        if (id) {
            return res.redirect('/admin/article/update/'+id);
        } else {
            return res.redirect('/admin/article/new');
        }        
    }
    
    // 已经存在的数据
    if(id){
        Article.findById(id, function(err, article) {
            if (err) {
                console.log(err);
            }
            //找到之前关联的文章类型 将其删除
            var beforeCategoryId=article._id;

            _article = _underscore.extend(article, articleObj); // 用新对象里的字段替换老的字段
            _article.save(function(err, article) {
                if (err) {
                    console.log(err);
                }
                //找到之前关联的文章类型 将其删除
                Category.findByIdAndUpdate(
                    articleObj.beforeCategory,
                    { $pull: { 'articles':article._id}},function(err, beforeCategory) {
                    if (err) {
                        console.log(err);
                    }
                    Category.findById(categoryId, function(err, category) {
                        category.articles.push(article._id);
                        category.save(function(err, category) {
                            res.redirect('/admin/article/update/'+id);
                        })
                    })
                })
            });
        });
    }else{
        // 新加的文章
        _article = new Article(articleObj);
        _article.save(function(err, article) {
            if (err) {
                console.log(err);
            }
            Category.findById(categoryId, function(err, category) {
                category.articles.push(article._id);
                category.save(function(err, category) {
                    res.redirect('/admin/articlemanage');
                })
            })
        })
    }
};


//后台文章分类管理
exports.categorymanage = function(req, res) {
    Category.fetch(function(err, categorys) {
        if (err) {
            console.log(err);
        }
        res.render('admin/categorymanage', {
            title: '文章分类管理',
            categorys: categorys
        });
    });
};
//后台文章分类管理添加
exports.categorymanageAdd = function(req, res) {
    res.render('admin/categorymanageAdd', {
        title: '添加分类',
        category:{}
    });
};
//分类修改名称
exports.categorymanageUpdate = function(req, res) {
    var id = req.params.id;
    if (id) {
        Category.findById(id, function(err, category) {
            res.render('admin/categorymanageAdd', {
                title: '修改分类',
                category:category
            });
        });
    }

};

//后台文章分类管理新建分类
exports.categorymanageSave = function(req, res) {
    var id = req.body._id || "";
    var categoryName=req.body.categoryname;
    var _category = null;

    if(id){
        Category.findById(id, function(err, category) {
            if (err) {
                console.log(err);
            }
            var categoryObj={
                _id:id,
                name:categoryName
            }
            _category = _underscore.extend(category, categoryObj); // 用新对象里的字段替换老的字段
            _category.save(function(err, category) {
                if (err) {
                    console.log(err);
                }
                res.redirect('/admin/categorymanage')
            });
        });
    }else{
        var category=new Category({
            name:categoryName,
            articles:[]
        });
        category.save(function(err, category) {
            if (err) {
                console.log(err);
            }
            res.redirect('/admin/categorymanage')
        })
    }
};



//删除文章
exports.articleDel= function(req, res) {
  var id = req.query.id;
  if(id){
    Article.findById(id, function(err, article) {
        if (err) {
            console.log(err);
        }
        Promise.all([
            Comment.remove({'article':id}),
            Article.remove({_id: id}),
            Category.findByIdAndUpdate(article.categoryid,{ $pull: { 'articles':id}})
        ])
        .then(function(data) {
            res.json({
                success: 1
            });
        }).catch(function onRejected(error){
            res.json({
                success: 0
            });
        });
    })
  }
};


// admin articlemanage page 后台文章管理
exports.articlemanage = function(req, res) {
    let query = pick(Object.assign({}, req.query), 'title', 'display', 'categoryid')
    let fields = Object.assign({}, query, { 
        title: query.title ? new RegExp(query.title + '.*', 'i'): new RegExp('.*', 'i'),
        display: query.display ? query.display: { $in: ['0', '1'] },
        categoryid: query.categoryid ? query.categoryid: {$exists: true}
    })
    //拿到页码
    var page = parseInt(req.query.p, 10) || 1;
    var count = 10;//每一页只展示两条数据
    var index = (page-1) * count
    Promise.all([
      Article.find(fields, {}, { sort: { _id: -1 } }).populate('categoryid', 'name').exec(),
      Category.find().exec()
    ]).then(function(data) {
      var articles = data[0];
      var categories = data[1];
      var results = articles.slice(index, index + count);
        var totalPage= Math.ceil(articles.length / count);//总页数
        var hasPreviousPage=page!=1?true:false;//是否有上一页
        var hasNextPage=page<totalPage;//是否有下一页
        var prePage=page==1||page>totalPage?0:page-1;
        var nextPage=page>=totalPage?0:page+1;
        res.render('admin/articlemanage', {
            title: '文章管理',
            articles: results,
            pageNow:page,
            pageSize:count,
            recordAmount:articles.length,
            totalPage: totalPage,
            hasPreviousPage:hasPreviousPage,
            hasNextPage:hasNextPage,
            prePage:prePage,
            nextPage:nextPage,
            query: query,
            categories: categories
        })
    })
};