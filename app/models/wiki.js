//引入mongoose建模工具模块
var mongoose=require('mongoose');

//引入'../schemas/movie.js'导出的模式模块
var WikiSchema=require('../schemas/wiki');


//1模型名字 2模式   编译生成movie模型
var Wiki=mongoose.model('wiki',WikiSchema);
// 将movie模型[构造函数]导出
module.exports=Wiki;



