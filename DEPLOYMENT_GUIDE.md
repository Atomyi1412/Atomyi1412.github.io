# 🚀 生产环境部署指南

本指南详细说明如何在腾讯云等生产环境中安全部署考试系统。

## 🔐 安全配置原则

### 敏感信息保护
- ✅ 所有敏感配置通过环境变量传递
- ✅ 配置文件不包含硬编码的密钥
- ✅ 生产环境和开发环境配置分离
- ✅ 支持运行时配置覆盖

## 📋 腾讯云环境变量配置

### Firebase 配置
在腾讯云后台的"高级设置" → "环境变量"中添加：

| Key | Value | 说明 |
|-----|-------|------|
| `FIREBASE_API_KEY` | `你的Firebase API Key` | Firebase API密钥 |
| `FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase认证域名 |
| `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase项目ID |
| `FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` | Firebase存储桶 |
| `FIREBASE_MESSAGING_SENDER_ID` | `你的Sender ID` | Firebase消息发送者ID |
| `FIREBASE_APP_ID` | `你的App ID` | Firebase应用ID |
| `FIREBASE_MEASUREMENT_ID` | `你的Measurement ID` | Firebase分析ID（可选） |

### 应用配置
| Key | Value | 说明 |
|-----|-------|------|
| `FEISHU_TABLE_URL` | `你的飞书表格链接` | 飞书多维表查看链接 |
| `FEISHU_WEBHOOK_URL` | `你的飞书Webhook URL` | 飞书数据提交接口 |
| `PROXY_URL` | `你的代理服务器URL` | CORS代理服务器（可选） |
| `API_BASE_URL` | `你的API基础URL` | 后端API地址（如果有） |
| `DEBUG` | `false` | 是否开启调试模式 |
| `APP_VERSION` | `v4.2.0` | 应用版本号 |

## 🐳 Docker 配置说明

### 自动配置机制
Dockerfile 包含智能配置脚本：

```bash
# 如果设置了 FIREBASE_API_KEY，自动使用生产环境 Firebase 配置
if [ -n "$FIREBASE_API_KEY" ]; then
  cp firebase-config.production.js firebase-config.js
fi

# 如果设置了 FEISHU_WEBHOOK_URL，自动使用生产环境应用配置
if [ -n "$FEISHU_WEBHOOK_URL" ]; then
  cp config.production.js config.js
fi
```

### 配置文件层级
1. **开发环境**: 使用 `*.example.js` 文件手动创建配置
2. **生产环境**: 使用 `*.production.js` 文件 + 环境变量
3. **容器环境**: 自动根据环境变量选择配置文件

## 🔧 腾讯云部署步骤

### 1. 基础配置
- **仓库类型**: `Github`
- **仓库地址**: `Atomyi1412/Atomyi1412.github.io`
- **仓库分支**: `main`
- **启用自动部署**: ✅ 开启

### 2. 容器配置
- **服务名称**: `exam-system`
- **部署类型**: `容器型服务`
- **端口**: `80`
- **目标目录**: `/`
- **Dockerfile名称**: `Dockerfile`

### 3. 环境变量设置
在"高级设置" → "环境变量"中按上表添加所有必要的环境变量。

### 4. 部署验证
部署完成后检查：
- ✅ 应用正常启动
- ✅ Firebase 认证功能正常
- ✅ 飞书数据提交功能正常
- ✅ 配置验证无警告

## 🛡️ 安全最佳实践

### 环境变量安全
- 🔒 **不要在代码中硬编码敏感信息**
- 🔒 **定期轮换 API 密钥**
- 🔒 **使用最小权限原则**
- 🔒 **监控异常访问**

### Firebase 安全规则
```javascript
// Firestore 安全规则示例
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 考试结果需要认证用户才能写入
    match /exam_results/{resultId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 网络安全
- 🌐 **启用 HTTPS**（腾讯云自动配置）
- 🌐 **配置 CORS 策略**
- 🌐 **使用安全头**（已在 nginx 配置中包含）

## 🔍 故障排除

### 配置问题
```bash
# 检查容器日志
docker logs <container_id>

# 查看配置是否正确加载
curl http://your-domain/config.js
```

### 常见错误
1. **INVALID_PATH 错误**
   - **错误描述**: `Invalid path. For more information, please refer to https://docs.cloudbase.net/error-code/service`
   - **原因分析**: 腾讯云找不到匹配的转发规则或路径配置错误
   - **解决方案**:
     ```bash
     # 检查腾讯云配置
     - 确认「目标目录」设置为: /
     - 确认「端口」设置为: 80
     - 确认「Dockerfile名称」设置为: Dockerfile
     - 检查服务是否正常启动（查看部署日志）
     ```
   - **重新部署步骤**:
     1. 进入腾讯云控制台 → 云开发 → 云托管
     2. 选择你的服务 → 版本管理
     3. 新建版本，重新配置路径参数
     4. 等待部署完成（通常需要3-5分钟）

2. **Firebase 初始化失败**
   - 检查 Firebase 环境变量是否正确设置
   - 验证 Firebase 项目配置

3. **飞书数据提交失败**
   - 检查 FEISHU_WEBHOOK_URL 是否正确
   - 验证飞书 Webhook 权限

4. **CORS 错误**
   - 检查 PROXY_URL 配置
   - 验证代理服务器状态

## 📊 监控和维护

### 日志监控
- 📈 **应用访问日志**
- 📈 **错误日志监控**
- 📈 **性能指标监控**

### 定期维护
- 🔄 **定期更新依赖**
- 🔄 **监控安全漏洞**
- 🔄 **备份重要数据**
- 🔄 **测试灾难恢复**

## 🎯 性能优化

### 缓存策略
- ⚡ **静态资源缓存**（已配置1年）
- ⚡ **CDN 加速**（腾讯云自动配置）
- ⚡ **Gzip 压缩**（nginx 自动启用）

### 资源优化
- 📦 **最小化镜像体积**
- 📦 **优化构建时间**
- 📦 **减少网络传输**

---

💡 **提示**: 遵循本指南可以确保你的考试系统在生产环境中安全、稳定地运行！