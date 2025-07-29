// 应用配置文件
// 此文件包含敏感信息，已在 .gitignore 中排除，不会被提交到版本控制

const AppConfig = {
    // 飞书多维表相关配置
    feishu: {
        // 飞书多维表查看链接
        tableUrl: 'https://more2.feishu.cn/wiki/NEXXw0M6Micnfikr6MEcvZe1nXr?table=tbljG2LmtiCazz1W&view=vewAKqlLr5',
        
        // 飞书webhook URL（用于数据提交）
        webhookUrl: 'https://more2.feishu.cn/base/automation/webhook/event/XVQuaSLWZw3cAKhOUULcAnpHnJh'
    },
    
    // CORS代理服务器配置
    proxy: {
        url: 'https://cors-anywhere.herokuapp.com/'
    }
};

// 支持环境变量覆盖配置
if (typeof window !== 'undefined') {
    // 浏览器环境下，可以通过 window 对象设置配置
    if (window.FEISHU_TABLE_URL) {
        AppConfig.feishu.tableUrl = window.FEISHU_TABLE_URL;
    }
    if (window.FEISHU_WEBHOOK_URL) {
        AppConfig.feishu.webhookUrl = window.FEISHU_WEBHOOK_URL;
    }
    if (window.PROXY_URL) {
        AppConfig.proxy.url = window.PROXY_URL;
    }
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}