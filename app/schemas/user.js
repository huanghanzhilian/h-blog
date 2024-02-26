//引入mongoose建模工具模块
var mongoose=require('mongoose');

//用来密码存储设计的一个方法
var bcrypt =require('bcrypt');
var SALT_WORK_FACTOR=10;//加盐

//声明一个MovieSchema调用mongoose的Schema方法传入对象
var UserSchema=new mongoose.Schema({
	name:{
		unique:true,
		type:String
	},
	password:String,
	role:{
		type:Number,
		default:0
	},
	meta:{//录入数据或更新时，时间记录
		createAt:{//创建时间
			type:Date,//日期类型
			default:Date.now()//默认值创建的时间
		},
		updataAt:{//更新时间
			type:Date,//日期类型
			default:Date.now()//默认值创建的时间
		}
	}
});



//为模式添加一个方法
//每次添加数据之前都会来调用这个方法
UserSchema.pre('save',function(next){
	var user =this;
	//判断数据是否是新加的
	if(this.isNew){
		this.meta.createAt=this.meta.updataAt=Date.now();
	}else{
		this.meta.updataAt=Date.now();
	}

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if(err) return next(err)
		bcrypt.hash(user.password,salt,function(err,hast){
			if(err) return next(err)
			user.password=hast;
			next();
		})
	})

	//next();
});

UserSchema.methods = {
	//增加一个comparePassword实例方法
	//接收参数1 用户提交过来的密码
	//接收参数2 接收一个回掉方法
	comparePassword: function(_password, cb) {
		//同样bcrypt.compare做密码校对
		//参数1明文密码
		//2数据库密码
		//3回掉函数
		//参数1错误信息
		//参数2 isMatch是否正确
		bcrypt.compare(_password, this.password, function(err, isMatch) {
			//如果有错误的话直接把错误暴露给回掉方法里返回
			if (err) return cb(err)
			//没有错的话将错误设置为null
			//将isMatch匹配的状态返回
			cb(null, isMatch)
		})
	}
}


// movieSchema 模式的静态方法
UserSchema.statics={
	fetch:function(cb){
		return this
		.find({})
		.sort('meta.updataAt')
		.exec(cb)
	},
	findByid:function(id,cb){
		return this
		.findOne({_id:id})
		.exec(cb)
	}
}



// 导出movieSchema模式
module.exports=UserSchema;