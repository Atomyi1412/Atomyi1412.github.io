// 应用配置文件
// 此文件包含敏感信息，已在 .gitignore 中排除，不会被提交到版本控制

const AppConfig = {
    // 飞书多维表相关配置
    feishu: {
        // 飞书多维表查看链接（请在部署时通过环境变量设置真实URL）
        tableUrl: window.FEISHU_TABLE_URL || 'https://your-feishu-table-url-here',
        
        // 飞书webhook URL（请在部署时通过环境变量设置真实URL）
        webhookUrl: window.FEISHU_WEBHOOK_URL || 'https://your-feishu-webhook-url-here'
    },
    
    // CORS代理服务器配置
    proxy: {
        url: window.PROXY_URL || 'https://cors-anywhere.herokuapp.com/'
    }
};

// 环境变量已直接集成在配置中
// 在 Vercel 等部署平台中，可以通过环境变量设置真实的 URL
// 例如：FEISHU_TABLE_URL, FEISHU_WEBHOOK_URL, PROXY_URL

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}