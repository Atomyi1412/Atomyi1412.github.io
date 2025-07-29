// 生产环境配置文件
// 此文件用于腾讯云等生产环境部署
// 通过环境变量或容器配置来设置敏感信息

const AppConfig = {
    // 飞书多维表相关配置
    feishu: {
        // 从环境变量获取飞书配置，如果没有则使用空值
        tableUrl: process.env.FEISHU_TABLE_URL || '',
        webhookUrl: process.env.FEISHU_WEBHOOK_URL || ''
    },
    
    // CORS代理服务器配置
    proxy: {
        // 生产环境建议使用自己的代理服务器
        url: process.env.PROXY_URL || 'https://cors-anywhere.herokuapp.com/'
    },
    
    // API配置
    api: {
        baseUrl: process.env.API_BASE_URL || '',
        timeout: parseInt(process.env.API_TIMEOUT) || 10000
    },
    
    // 应用配置
    app: {
        environment: 'production',
        debug: process.env.DEBUG === 'true' || false,
        version: process.env.APP_VERSION || 'v4.2.0'
    }
};

// 浏览器环境下的配置覆盖
if (typeof window !== 'undefined') {
    // 支持通过 window 对象设置配置（用于容器化部署时的运行时配置）
    if (window.FEISHU_TABLE_URL) {
        AppConfig.feishu.tableUrl = window.FEISHU_TABLE_URL;
    }
    if (window.FEISHU_WEBHOOK_URL) {
        AppConfig.feishu.webhookUrl = window.FEISHU_WEBHOOK_URL;
    }
    if (window.PROXY_URL) {
        AppConfig.proxy.url = window.PROXY_URL;
    }
    if (window.API_BASE_URL) {
        AppConfig.api.baseUrl = window.API_BASE_URL;
    }
}

// 配置验证
function validateConfig() {
    const warnings = [];
    
    if (!AppConfig.feishu.tableUrl) {
        warnings.push('飞书表格URL未配置，保存功能可能无法正常使用');
    }
    
    if (!AppConfig.feishu.webhookUrl) {
        warnings.push('飞书Webhook URL未配置，数据提交功能可能无法正常使用');
    }
    
    if (warnings.length > 0 && AppConfig.app.debug) {
        console.warn('配置警告:', warnings);
    }
    
    return warnings.length === 0;
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, validateConfig };
} else {
    window.AppConfig = AppConfig;
    window.validateConfig = validateConfig;
    
    // 在生产环境下验证配置
    if (AppConfig.app.environment === 'production') {
        validateConfig();
    }
}