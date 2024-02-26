//引入mongoose建模工具模块
var mongoose=require('mongoose');

//引入'../schemas/user.js'导出的模式模块
var UserSchema=require('../schemas/user');


//1模型名字 2模式   编译生成user模型
var User=mongoose.model('user',UserSchema);
// 将user模型[构造函数]导出
module.exports=User;
