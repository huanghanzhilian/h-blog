//引入mongoose建模工具模块
var mongoose=require('mongoose');
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

//声明一个MovieSchema调用mongoose的Schema方法传入对象
var GuestbookSchema=new mongoose.Schema({
  	from: {type: ObjectId, ref: 'user'},          //来自于哪个用户id
  	content: String,                              //评论内容
	reply: [{                                     //某条评论的回复
		from: {                                   //二级评论来源于谁
			type: ObjectId,
			ref: 'user'
		},
		to: {                                     //二级评论 评论于谁
			type: ObjectId,
			ref: 'user'
		},
		content: String						      //评论的内容
	}],
	meta:{                                        //录入数据或更新时，时间记录
		createAt:{                                //创建时间
			type:Date,                            //日期类型
			default:Date.now()                    //默认值创建的时间
		},
		updataAt:{                                //更新时间
			type:Date,                            //日期类型
			default:Date.now()                    //默认值创建的时间
		}
	}
});


//为模式添加一个方法
//每次添加数据之前都会来调用这个方法
GuestbookSchema.pre('save',function(next){
	//判断数据是否是新加的
	if(this.isNew){
		this.meta.createAt=this.meta.updataAt=Date.now();
	}else{
		this.meta.updataAt=Date.now();
	}
	next();
});


// movieSchema 模式的静态方法
GuestbookSchema.statics={
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

module.exports=GuestbookSchema;