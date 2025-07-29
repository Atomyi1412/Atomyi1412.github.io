# 部署配置指南

## 安全配置说明

为了保护敏感信息，本项目采用环境变量的方式管理配置。

### 配置文件说明

- `config.js` - 公开配置文件，使用占位符，可安全提交到版本控制
- `config.local.js` - 本地开发配置，包含真实参数，已在 .gitignore 中排除
- `config.example.js` - 配置模板文件

### Vercel 部署配置

在 Vercel 项目设置中添加以下环境变量：

#### 必需的环境变量

```bash
# 飞书多维表查看链接
FEISHU_TABLE_URL=https://more2.feishu.cn/wiki/your-table-url

# 飞书 Webhook URL（敏感信息）
FEISHU_WEBHOOK_URL=https://more2.feishu.cn/base/automation/webhook/event/your-webhook-id

# CORS 代理服务器（可选）
PROXY_URL=https://cors-anywhere.herokuapp.com/
```

#### 设置步骤

1. 登录 Vercel Dashboard
2. 选择您的项目
3. 进入 Settings → Environment Variables
4. 添加上述环境变量
5. 重新部署项目

### 本地开发

#### 方法一：使用 config.local.js（推荐）

1. 复制 `config.local.js` 并填入真实配置
2. 在 `index.html` 中临时引用本地配置：
   ```html
   <script src="config.local.js"></script>
   ```
3. 开发完成后记得改回 `config.js`

#### 方法二：设置 window 变量

在浏览器控制台中设置：
```javascript
window.FEISHU_TABLE_URL = 'your-real-table-url';
window.FEISHU_WEBHOOK_URL = 'your-real-webhook-url';
```

### 安全注意事项

1. **永远不要**将真实的 Webhook URL 提交到公开仓库
2. **定期轮换** Webhook URL 和其他敏感配置
3. **监控访问日志**，确保配置未被滥用
4. **使用最小权限原则**，仅授予必要的访问权限

### 故障排除

#### 配置未生效
- 检查环境变量名称是否正确
- 确认 Vercel 部署已完成
- 查看浏览器控制台是否有错误信息

#### 功能异常
- 验证 Webhook URL 是否有效
- 检查飞书多维表权限设置
- 确认 CORS 代理服务可用

### 联系支持

如遇到配置问题，请检查：
1. 环境变量设置是否正确
2. 网络连接是否正常
3. 第三方服务是否可用