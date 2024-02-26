var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');

var reptile = {
    hostname: '',
    protocol: '',
    pathname: '',
    save_path:'sitemap.txt',//文件保存路径
    complete_arr: [],//已经爬取的url
    wait_arr: [],//等待爬取
    show_url:false,//是否打印当前爬取的链接   默认不显示
    wait_current: 0,//wait_arr[wait_current]获取不到值得时候则爬取完毕
    /**
     * 爬取的网站  提取hostname
     * @param json.href  地址链接 通过扩展名，来生成xml或则txt
     * @param json.save_path  文件保存路径
     */
    init: function (json,callback) {
        if(typeof json != 'object') throw "参数错误！";
        this.hostname = url.parse(json.href).hostname;
        this.wait_arr.length=0;
        this.complete_arr.length=0;
        this.protocol = url.parse(json.href).protocol;
        this.wait_arr.push(json.href);
        json.save_path && (this.save_path = json.save_path);
        json.show_url && (this.show_url = json.show_url);
        callback&&(this.callback=callback);
        this.wait_current=0;

        this.play_url();
    },
    /**
     * 获取等待爬取里面的url
     * 如果获取不到url时则爬取结束
     */
    play_url: function () {
        var i = this.wait_current;
        console.log('得到堆数据',this.wait_arr)
        if (!this.wait_arr[i]) {
            this.site_type();//最后生成的sitemap是什么格式
            this.callback({code:1});
            console.log('完成！');
        } else {
            this.req(this.wait_arr[i]);
            this.wait_current++;
        }
    },
    /**
     * sitemap生成的格式   xml||txt
     */
    site_type:function(){
        var s_p = this.save_path;
        // fs.writeFileSync(this.save_path,'');
        //判断生成什么类型的sitemap
        var sitemap_content = '';
        switch(s_p.substring(s_p.lastIndexOf('.'),s_p.length)){
            case '.xml':
                var str = this.complete_arr.toString(),
                xmlns = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"';
                var url = '<urlset '+ xmlns +'>\n<url>\n    <loc>' + str.replace(/,/g,'</loc>\n</url>\n<url>\n    <loc>') + '</loc>\n</url>\n</urlset>';
                sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n' + url;
                break;
            case '.txt':
                sitemap_content = this.complete_arr.toString().replace(/\,/g,'\n');
                break;
            default:
                sitemap_content = this.complete_arr.toString().replace(/\,/g,'\n');
                break;       
        }
        fs.writeFileSync(this.save_path,sitemap_content);
    },
    /**
     * 爬取对应的地址
     * @param src
     */
    req: function (src) {
        var _this = this;
        if (this.judge(src)) {
            //开始爬取页面，如果成功，就存入爬取成功的数组当中
            request(src, function (err, res, body) {
                if (err) return _this.callback({code:0});
                _this.show_url && console.log(src);
                //如果数组当中不存在才添加
                _this.pathname = res.request.uri.pathname;
                var s = _this.push(_this.complete_arr, src);
                s && _this.complete_arr.push(s);
                _this.get_url(body);
            })
        }
    },
    /**
     * 获取当期页面所有链接
     * @param body
     */
    get_url: function (body) {
        var $ = cheerio.load(body);
        var a = $('a');
        var _this = this;
        for (var i = 0, len = a.length; i < len; i++) {
            var src = _this.judge(a[i].attribs.href);
            //把当前页面本网站的链接存入带爬取的数组
            if (src) {
                //如果数组当中不存在才添加
                _this.push(_this.wait_arr, src) && _this.wait_arr.push(src);
            } else {
                continue;
            }
        }
        this.play_url();
    },
    /**
     * 判断链接是否属于本网站
     * @param src
     */
    judge: function (src) {
        var href = src;
        if (!href) return false;
        if (href.match(/(.png|.jpg|.gif|.zip)$/)) return false;
        if (src.match(/^https|^http|^javascript/g)) {
            url.parse(src).hostname != this.hostname && (href = false);
        } else {
            href = this.protocol + "//" + this.hostname;
            href += src.match(/^\?/g) ? (this.pathname + src) : src;
        }
        return href;
    },
    /**
     * 判断链接是否已经存在
     */
    push: function (arr, src) {
        var flag = src;
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] == src) {
                flag = false;
                break;
            }
        }
        return flag;
    }
};

module.exports = reptile;
