//引入mongoose建模工具模块
var mongoose=require('mongoose');

//引入'../schemas/movie.js'导出的模式模块
var AboutSchema=require('../schemas/about');


//1模型名字 2模式   编译生成about模型
var About=mongoose.model('about',AboutSchema);
// 将about模型[构造函数]导出
module.exports=About;



