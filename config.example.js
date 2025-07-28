// 配置文件示例
// 复制此文件为 config.js 并填入实际的配置信息
// config.js 文件已在 .gitignore 中，不会被提交到版本控制

const AppConfig = {
    // 飞书多维表相关配置
    feishu: {
        // 飞书多维表查看链接
        tableUrl: 'YOUR_FEISHU_TABLE_URL_HERE',
        
        // 飞书webhook URL（用于数据提交）
        webhookUrl: 'YOUR_FEISHU_WEBHOOK_URL_HERE'
    },
    
    // CORS代理服务器配置
    proxy: {
        url: 'https://cors-anywhere.herokuapp.com/'
    },
    
    // 其他敏感配置可以在这里添加
    // api: {
    //     baseUrl: 'YOUR_API_BASE_URL_HERE',
    //     apiKey: 'YOUR_API_KEY_HERE'
    // }
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