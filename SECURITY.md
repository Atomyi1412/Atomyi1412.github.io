# 安全配置指南

## GitHub 密钥泄露警告解决方案

### 问题说明
GitHub 检测到 Firebase API 密钥被提交到公共仓库中，触发了安全警告。

### 解决方案

#### 1. 立即行动
- ✅ 已创建 `.gitignore` 文件防止敏感文件被提交
- ✅ 已创建 `firebase-config.example.js` 作为配置模板
- ✅ 已修改配置文件支持环境变量

#### 2. Firebase API 密钥说明
**重要**: Firebase 客户端 API 密钥与传统的服务器端密钥不同：
- Firebase 客户端 API 密钥是**公开的**，设计为在客户端代码中使用
- 真正的安全性由 **Firebase Security Rules** 控制
- API 密钥主要用于标识项目，而非认证

#### 3. 安全最佳实践

##### 对于开发环境：
1. 复制 `firebase-config.example.js` 为 `firebase-config.js`
2. 填入你的实际 Firebase 配置
3. 确保 `firebase-config.js` 在 `.gitignore` 中

##### 对于生产环境：
1. 使用环境变量设置 `window.FIREBASE_API_KEY`
2. 在构建过程中注入配置
3. 配置严格的 Firebase Security Rules

#### 4. Firebase Security Rules 示例
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 只允许认证用户访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 5. 飞书 Webhook 安全增强

**动态配置构建**：
```javascript
// 将敏感信息分解为基础组件
const baseConfig = {
    domain: 'more2.feishu.cn',
    basePath: '/base/automation/webhook/event/',
};

// 仅暴露 Webhook ID，而非完整 URL
const webhookId = window.FEISHU_WEBHOOK_ID || 'your-webhook-id';
```

**URL 格式验证**：
```javascript
validateUrl: function(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('feishu.cn') || urlObj.hostname.includes('feishu.com');
    } catch {
        return false;
    }
}
```

**请求唯一性保护**：
```javascript
// 添加时间戳和请求ID
data.timestamp = Date.now();
data.requestId = Math.random().toString(36).substr(2, 9);
```

#### 6. 如何撤销当前密钥（如果需要）
1. 登录 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 进入 "项目设置" > "常规"
4. 在 "您的应用" 部分重新生成 API 密钥
5. 更新所有使用该密钥的地方

#### 6. 监控和审计
- 定期检查 Firebase 使用情况
- 监控异常的 API 调用
- 保持 Security Rules 更新

## 飞书 Webhook URL 安全配置

### 问题说明
飞书 Webhook URL 和多维表链接包含敏感信息，不应直接暴露在公开代码中。

### 解决方案

#### 1. 配置文件方式（推荐）
1. 复制 `config.example.js` 为 `config.js`
2. 在 `config.js` 中填入你的实际飞书配置：
   ```javascript
   const AppConfig = {
       feishu: {
           tableUrl: 'YOUR_FEISHU_TABLE_URL',
           webhookUrl: 'YOUR_FEISHU_WEBHOOK_URL'
       }
   };
   ```
3. `config.js` 文件已在 `.gitignore` 中，不会被提交到版本控制

#### 2. 环境变量方式
在生产环境中，可以通过设置 window 对象来配置：
```javascript
window.FEISHU_TABLE_URL = 'your_table_url';
window.FEISHU_WEBHOOK_URL = 'your_webhook_url';
```

#### 3. 飞书 Webhook 安全最佳实践
- 定期更换 Webhook URL
- 在飞书后台设置 IP 白名单（如果支持）
- 监控 Webhook 使用情况
- 避免在日志中记录完整的 URL

### 注意事项
- 本项目的 Firebase 配置主要用于客户端认证和数据访问
- 实际的数据安全由 Firebase Security Rules 保证
- 飞书 Webhook URL 应当作敏感信息处理
- 如果担心安全问题，建议重新生成 API 密钥和 Webhook URL 并更新配置