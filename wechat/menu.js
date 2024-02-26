'use strict'

module.exports = {
    "button": [{
            "type": "click",
            "name": "点击事件",
            "key": "menu_click"
        },
        {
            "name": "点出菜单",
            "sub_button": [{
                    "type": "view",
                    "name": "首页",
                    "url": "http://blog.cheerspublishing.cn/"
                },
                {
                    "type": "scancode_push",
                    "name": "扫码推事件",
                    "key": "qr_scan",
                    "sub_button": []
                },
                {
                    "type": "click",
                    "name": "赞一下我们",
                    "key": "V1001_GOOD"
                }
            ]
        },{
            "type": "click",
            "name": "点击事件2",
            "key": "menu_click2"
        }
    ]
};