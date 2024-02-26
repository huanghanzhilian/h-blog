/*
* @Author: huangjipeng
* @Date:   2019-10-03 22:34:52
* @Last Modified by:   macintoshhd
* @Last Modified time: 2019-12-16 15:30:16
*/
'use strict'

var Promise = require('bluebird');
// var _ = require('lodash');
var request = Promise.promisify(require('request'))
var util = require('./util')
var fs = require('fs');
var prefix = 'https://api.weixin.qq.com/cgi-bin/'; //前缀
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    //临时素材接口
    temporary: {
        upload: prefix + 'media/upload?', //上传零时素材
        fetch:prefix + 'media/get?', //获取零时素材
    },
    //永久素材接口
    permanent: {
        upload: prefix + 'material/add_material?', //上传图片和视频
        uploadNews: prefix + 'material/add_news?', //上传图文
        uploadNewsPic: prefix + 'material/uploadimg?', //上传图文消息用到的图片  上传图文消息内的图片获取URL
        fetch:prefix + 'media/get_material?', //获取永久素材
        del:prefix + 'media/del_material?', //删除永久素材
        update:prefix + 'media/update_news?', //更新永久素材
    },
    //分组接口
    group:{
        create:prefix + 'tags/create?', //创建分组 创建标签
        getUserInfo:prefix + 'user/info?', //获取用户信息
        /*get:prefix + 'tags/create?', //查询
        check:prefix + 'tags/create?', //查询用户所在分组
        check:prefix + 'tags/create?', //修改分组名*/
    },
    //菜单
    menu:{
        create:prefix + 'menu/create?', //创建菜单请求地址
        get:prefix + 'menu/get?',//自定义菜单查询接口
        delete:prefix + 'menu/delete?',//自定义菜单删除接口
        current:prefix + 'get_current_selfmenu_info?',//获取自定义菜单配置接口
    },
    //ticket 微信授权票据
    ticket:{
        get:prefix+'ticket/getticket?',//获取api_ticket  用于调用微信卡券JS API的临时票据
    },
    shorturl:prefix+'shorturl?'
}


function Wechat(opts) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.token = opts.token;
    this.getAccessToken = opts.getAccessToken; //获取票据的方法
    this.saveAccessToken = opts.saveAccessToken; //存储票据的方法
    this.getTicket = opts.getTicket; //获取票据的方法
    this.saveTicket = opts.saveTicket; //存储票据的方法
    this.fetchAccessToken()
}

Wechat.prototype.fetchAccessToken = function(data) {

    var that = this;
    if (this.access_token && this.expires_in) {
        if (this.isValidAccessToken(this)) {
            return Promise.resolve(this);
        }
    }
    return this.getAccessToken()
        .then(function(data) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                //更新票据
                return that.updateAccessToken()
            }
            if (that.isValidAccessToken(data)) { //拿到票据判断票据是否在有效期内
                return Promise.resolve(data); //将data传下去
                //return data;
            } else {
                //更新票据
                return that.updateAccessToken()
            }
        })
        .then(function(data) {
            //拿到最终票据结果
            that.access_token = data.access_token; //挂载到实例上
            that.expires_in = data.expires_in; //过期字段
            that.saveAccessToken(data); //调用存储票据的方法

            return Promise.resolve(data)
        })
}


//判断是否过期
Wechat.prototype.isValidAccessToken = function(data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false;
    }
    var access_token = data.access_token; //拿到票据
    var expires_in = data.expires_in; //拿到过期字段
    var now = (new Date().getTime()); //拿到当前时间
    //判断当前时间是否小于过期时间
    if (now < expires_in) {
        //还没过期
        return true;
    } else {
        return false;
    }
}
//票据更新方法
Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

    return new Promise(function(resolve, response) {
        //request 向某个服务器发请求
        request({ url: url, json: true }).then(function(response) {
            var data = response['body'];
            var now = (new Date().getTime()); //拿到当前时间
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;

            resolve(data)
        })
    })
}

Wechat.prototype.reply = function(content, massage) {
    var xml = util.tpl(content, massage);
    return xml
}



//上传方法
Wechat.prototype.uploadMaterial = function(type, material, permanent) {
    var that = this;
    var form = {};
    var uploadUrl = api.temporary.upload; //默认为临时上传接口

    //判断是否为永久素材
    if (permanent) {
        uploadUrl = api.permanent.upload;
        _.extend(form, permanent)
    }

    if (type === 'pic') { //如果为图片
        uploadUrl = api.permanent.uploadNewsPic;
    }

    if (type === 'news') { //如果为图文
        uploadUrl = api.permanent.uploadNews;
        form = material
    }
    //如果不是图文
    else {
        //认为就是一个文件路径
        form.media = fs.createReadStream(material)
    }


    var appID = this.appID;
    var appSecret = this.appSecret;


    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = uploadUrl + 'access_token=' + data.access_token;
                //如果不是永久类型
                if (!permanent) {
                    url += '&type=' + type;
                } else {
                    form.access_token = data.access_token;
                }

                //上传方法默认是post
                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                }
                //如果是上传图文就是body
                if (type === 'news') {
                    options.body = form;
                } else {
                    options.formData = form;
                }
                //request 向某个服务器发请求
                request({ method: 'POST', url: url, formData: form, json: true }).then(function(response) {
                        var _data = response['body'];

                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Upload material fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })

}

//获取资源
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var that = this;
    var form = {};
    var fetchUrl = api.temporary.fetch; //默认为临时资源获取接口

    //判断是否为永久素材
    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = fetchUrl + 'access_token=' + data.access_token+'&media_id='+mediaId;
                //如果不是永久类型
                if (!permanent&&type==='video') {
                    url=url.replace('https://','http://');
                }
                resolve(url)
            })
    })
}
//删除素材
Wechat.prototype.deleteMaterial = function(mediaId) {
    var that = this;
    var form = {
        media_id:mediaId
    };
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.del + 'access_token=' + data.access_token+'&media_id='+mediaId;
                //request 向某个服务器发请求
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response['body'];

                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('del material fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//更新素材
Wechat.prototype.updateMaterial = function(mediaId,news) {
    var that = this;
    var form = {
        media_id:mediaId
    };

     _.extend(form, news)

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.update + 'access_token=' + data.access_token+'&media_id='+mediaId;
                //request 向某个服务器发请求
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response['body'];

                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('update material fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//创建分组 创建标签
Wechat.prototype.createGroup = function(name) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.create + 'access_token=' + data.access_token;
                var options = {
                    tag:{
                        name:name
                    }
                }
                //request 向某个服务器发请求
                request({ method: 'POST', url: url, body: options, json: true }).then(function(response) {
                        var _data = response['body'];
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('update material fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取用户信息
Wechat.prototype.getUserInfo = function(openid) {
    console.log(openid)
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.getUserInfo + 'access_token=' + data.access_token+'&openid='+openid;
                //request 向某个服务器发请求
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response['body'];
                        console.log(_data)
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('update material fails')
                        }
                    })
                    .catch(function(err) {
                        console.log(err)
                        reject(err)
                    })
            })
    })
}


//创建菜单
Wechat.prototype.createMenu = function(menu) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.create + 'access_token=' + data.access_token;
                console.log(url)
                //request 向某个服务器发请求
                request({ method: 'POST', url: url,body:menu,json: true }).then(function(response) {
                        var _data = response['body'];
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('create Menu fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取菜单
Wechat.prototype.getMenu = function(menu) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.get + 'access_token=' + data.access_token;
                console.log(url)
                //request 向某个服务器发请求
                request({ method: 'GET', url: url,json: true }).then(function(response) {
                        var _data = response['body'];
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('create Menu fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//删除菜单
Wechat.prototype.deleteMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.delete + 'access_token=' + data.access_token;
                //request 向某个服务器发请求
                request({ method: 'GET', url: url,json: true }).then(function(response) {
                        var _data = response['body'];
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('delete Menu fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取自定义菜单配置接口
Wechat.prototype.getCurrentMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.curren + 'access_token=' + data.access_token;
                console.log(url)
                //request 向某个服务器发请求
                request({ method: 'GET', url: url,json: true }).then(function(response) {
                        var _data = response['body'];
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Curren Menu fails')
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//ticket 微信授权票据
Wechat.prototype.fetchTicket = function(access_token) {
    var that = this;
    return this.getTicket()
        .then(function(data) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                //更新票据
                return that.updateTicket(access_token)
            }
            if (that.isValidTicket(data)) { //拿到票据判断票据是否在有效期内
                return Promise.resolve(data); //将data传下去
                //return data;
            } else {
                //更新票据
                return that.updateTicket(access_token)
            }
        })
        .then(function(data) {
            //拿到最终票据结果
            that.saveTicket(data); //调用存储票据的方法
            return Promise.resolve(data)
        })
}
//ticket 更新
Wechat.prototype.updateTicket = function(access_token) {
    var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi';

    return new Promise(function(resolve, response) {
        //request 向某个服务器发请求
        request({ url: url, json: true }).then(function(response) {
            var data = response['body'];
            var now = (new Date().getTime()); //拿到当前时间
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;

            resolve(data)
        })
    })
}
//ticket 判断是否过期
Wechat.prototype.isValidTicket = function(data) {
    if (!data || !data.ticket || !data.expires_in) {
        return false;
    }
    var ticket = data.ticket; //拿到票据
    var expires_in = data.expires_in; //拿到过期字段
    var now = (new Date().getTime()); //拿到当前时间
    //判断当前时间是否小于过期时间
    if (ticket && now < expires_in) {
        //还没过期
        return true;
    } else {
        return false;
    }
}

//创建短连接
Wechat.prototype.createShareUrl = function(long_url) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.shorturl + 'access_token=' + data.access_token;
                //request 向某个服务器发请求
                request({ method: 'POST', url: url,body: {'action':'long2short','long_url':long_url}, json: true }).then(function(response) {
                    var _data = response['body'];
                    console.log('微信短连接创建')
                    console.log(_data)
                    console.log('微信短连接创建')
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('create Menu fails')
                    }
                })
                .catch(function(err) {
                    console.log('微信短连接创建--失败')
                    reject(err)
                })
            })
    })
}

//创建分享配置
Wechat.prototype.createShareProperties = async function({ url } = {}) {
    var accessToken = await this.fetchAccessToken()
    var ticketData = await this.fetchTicket(accessToken.access_token);
    var params = util.sign(ticketData.ticket, url)
    params.appId = this.appID
    return Promise.resolve(JSON.stringify(params))
}

module.exports = Wechat;
