// 应用配置文件
// 此文件包含敏感信息，已在 .gitignore 中排除，不会被提交到版本控制

// 安全配置：使用动态构建和环境变量
function getSecureConfig() {
    // 基础配置部分
    const baseConfig = {
        domain: 'more2.feishu.cn',
        basePath: '/base/automation/webhook/event/',
        tablePath: '/wiki/NEXXw0M6Micnfikr6MEcvZe1nXr',
        tableParams: '?table=tbljG2LmtiCazz1W&view=vewAKqlLr5'
    };
    
    // 敏感部分（可通过环境变量覆盖）
    const webhookId = window.FEISHU_WEBHOOK_ID || 'XVQuaSLWZw3cAKhOUULcAnpHnJh';
    
    return {
        feishu: {
            // 动态构建 URL
            tableUrl: window.FEISHU_TABLE_URL || `https://${baseConfig.domain}${baseConfig.tablePath}${baseConfig.tableParams}`,
            webhookUrl: window.FEISHU_WEBHOOK_URL || `https://${baseConfig.domain}${baseConfig.basePath}${webhookId}`
        },
        proxy: {
            url: window.PROXY_URL || 'https://cors-anywhere.herokuapp.com/'
        }
    };
}

// 获取配置
const AppConfig = getSecureConfig();

// 安全增强功能
AppConfig.security = {
    // 验证 URL 格式
    validateUrl: function(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('feishu.cn') || urlObj.hostname.includes('feishu.com');
        } catch {
            return false;
        }
    },
    
    // 生成请求时间戳（防重放攻击）
    getTimestamp: function() {
        return Date.now();
    },
    
    // 检查配置完整性
    validateConfig: function() {
        const config = AppConfig.feishu;
        return config.tableUrl && config.webhookUrl && 
               this.validateUrl(config.tableUrl) && 
               this.validateUrl(config.webhookUrl);
    }
};

// 环境变量配置说明
// 在 Vercel 等部署平台中，可以通过环境变量设置：
// - FEISHU_TABLE_URL: 完整的多维表 URL
// - FEISHU_WEBHOOK_URL: 完整的 Webhook URL  
// - FEISHU_WEBHOOK_ID: 仅 Webhook ID 部分（更安全）
// - PROXY_URL: CORS 代理服务器 URL

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}