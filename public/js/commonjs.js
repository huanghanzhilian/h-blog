$(document).ready(function() {
	var o = $(window).height();
    function n() {
        $(document.body).height() < o ? $("#footer").addClass("navbar-fixed-bottom") : $("#footer").removeClass("navbar-fixed-bottom")
    }
    n();

    $('.reply2_btn').on('click',function(){
    	var user_status=$('#user_status').attr('user_status');
        if(!user_status){
        	location.href='/signin';
        	return;
        }
    	$(this).parent().next().show();
    })
    var wechatShare = JSON.parse($('#wechatShare').val());
    var title = document.title
    var meta = document.getElementsByTagName('meta');
    var share_desc = '继小鹏的博客，一起共同进步';
    for(i in meta){
     if(typeof meta[i].name!="undefined"&&meta[i].name.toLowerCase()=="description"){
      share_desc = meta[i].content;
     }
    }
    wx.config({
        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: wechatShare.appId, // 必填，公众号的唯一标识
        timestamp: wechatShare.timestamp, // 必填，生成签名的时间戳
        nonceStr: wechatShare.nonceStr, // 必填，生成签名的随机串
        signature: wechatShare.signature, // 必填，签名，见附录1
        jsApiList: ['onMenuShareAppMessage', 'onMenuShareTimeline','onMenuShareQQ','onMenuShareQZone'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
    });
    wx.ready(function(){
        var shareContent={
            title: title,
            desc: share_desc,
            link: '',
            imgUrl: shareImage || 'http://blog.cheerspublishing.cn/uploads/article/6a058e12-b8a6-4f21-8b17-f51a7c441388.png',
            success: function() {
                console.log('分享成功')
            },
            // 用户取消分享后执行的回调函数
            cancel: function() {
                console.log('分享失败')
            }
        }
        // 分享给朋友
        wx.onMenuShareAppMessage(shareContent);
        //分享到朋友圈
        wx.onMenuShareTimeline(shareContent);
        //分享到qq
        wx.onMenuShareQQ(shareContent);
        //分享到qq空间
        wx.onMenuShareQZone(shareContent);
    });
});

