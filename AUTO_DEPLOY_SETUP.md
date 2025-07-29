# Vercel 自动部署配置指南

## 🚨 问题背景

**当前状况**: Vercel 自动部署功能失效，推送代码到 GitHub 后不会自动触发部署。

**根本原因**: <mcreference link="https://blog.csdn.net/zhq426/article/details/143969104" index="1">1</mcreference> <mcreference link="https://community.vercel.com/t/github-webhook-not-created-deployments-not-triggering/15935" index="2">2</mcreference>
1. Vercel 免费版限制了自动部署功能
2. GitHub Webhook 未正确创建或失效
3. Vercel GitHub 集成存在已知问题

## ✅ 解决方案

### 方案一：Deploy Hook + GitHub Webhook（推荐）

#### 步骤 1: 创建 Vercel Deploy Hook

1. **访问 Vercel 项目设置**
   ```
   https://vercel.com/atomyis-projects/atomyi1412_github_io/settings/git
   ```

2. **创建 Deploy Hook**
   - 找到 "Deploy Hooks" 部分
   - 点击 "Create Hook"
   - 名称: `Auto Deploy`
   - 分支: `main`
   - 点击 "Create Hook"

3. **复制 Hook URL**
   - 复制生成的 Deploy Hook URL
   - 格式类似: `https://api.vercel.com/v1/integrations/deploy/xxx/xxx`

#### 步骤 2: 配置 GitHub Webhook

1. **访问 GitHub 仓库设置**
   ```
   https://github.com/Atomyi1412/Atomyi1412.github.io/settings/hooks
   ```

2. **添加 Webhook**
   - 点击 "Add webhook"
   - **Payload URL**: 粘贴 Deploy Hook URL
   - **Content type**: `application/json`
   - **Secret**: 留空
   - **SSL verification**: 启用
   - **触发事件**: 选择 "Just the push event"
   - 点击 "Add webhook"

### 方案二：GitHub Actions（最可靠）

#### 已创建的文件

**<mcfile name="deploy.yml" path="/Users/atomapp/Documents/kaoti/Atomyi1412.github.io/.github/workflows/deploy.yml"></mcfile>**

此文件已自动创建，包含完整的 GitHub Actions 工作流配置。

#### 配置 GitHub Secrets

1. **访问 GitHub 仓库设置**
   ```
   https://github.com/Atomyi1412/Atomyi1412.github.io/settings/secrets/actions
   ```

2. **添加 Secret**
   - 点击 "New repository secret"
   - **Name**: `VERCEL_DEPLOY_HOOK_URL`
   - **Value**: 粘贴从 Vercel 获取的 Deploy Hook URL
   - 点击 "Add secret"

## 🔧 配置验证

### 测试自动部署

1. **提交测试更改**
   ```bash
   echo "# 测试自动部署" >> README.md
   git add README.md
   git commit -m "测试: 验证自动部署功能"
   git push origin main
   ```

2. **检查部署状态**
   - **GitHub Actions**: 访问 `https://github.com/Atomyi1412/Atomyi1412.github.io/actions`
   - **Vercel Dashboard**: 访问 `https://vercel.com/atomyis-projects/atomyi1412_github_io`

### 预期结果

✅ **成功指标**:
- GitHub Actions 工作流成功执行
- Vercel 显示新的部署记录
- 网站版本号更新为 v4.3.9
- 飞书功能正常工作

## 🚀 部署流程说明

### 自动触发条件

- ✅ 推送到 `main` 分支
- ✅ 合并 Pull Request 到 `main` 分支
- ❌ 推送到其他分支（不会触发生产部署）

### 部署步骤

1. **代码检出**: GitHub Actions 获取最新代码
2. **触发部署**: 调用 Vercel Deploy Hook
3. **等待完成**: 等待 30 秒确保部署启动
4. **状态报告**: 显示部署信息和状态

## 🔍 故障排除

### 常见问题

#### 1. GitHub Actions 失败

**症状**: Actions 标签页显示红色 ❌

**解决方案**:
```bash
# 检查 Secret 是否正确设置
# 访问: https://github.com/Atomyi1412/Atomyi1412.github.io/settings/secrets/actions
# 确认 VERCEL_DEPLOY_HOOK_URL 存在且正确
```

#### 2. Deploy Hook 无效

**症状**: Actions 成功但 Vercel 无新部署

**解决方案**:
1. 重新创建 Deploy Hook
2. 更新 GitHub Secret
3. 重新推送代码测试

#### 3. 部署成功但版本未更新

**症状**: Vercel 显示部署成功，但网站版本仍为旧版本

**解决方案**:
```bash
# 清除浏览器缓存
# 硬刷新: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)
# 或访问新的部署 URL
```

### 调试命令

```bash
# 检查最新提交
git log --oneline -5

# 检查远程状态
git status
git remote -v

# 手动触发部署
vercel --prod

# 查看部署列表
vercel ls
```

## 📊 监控和维护

### 定期检查

- **每周**: 检查 GitHub Actions 执行状态
- **每月**: 验证 Deploy Hook 有效性
- **版本发布时**: 确认自动部署正常工作

### 性能指标

- **部署时间**: 通常 30-60 秒
- **成功率**: 目标 >95%
- **错误恢复**: 自动重试机制

## 🎯 后续优化

### 可选改进

1. **多环境部署**: 支持 staging 和 production 环境
2. **部署通知**: 集成 Slack 或邮件通知
3. **回滚机制**: 自动检测部署失败并回滚
4. **性能监控**: 集成部署后的性能检查

### 高级配置

```yaml
# 可添加到 deploy.yml 的高级功能
- name: Health Check
  run: |
    sleep 60
    curl -f https://atomyi1412githubio.vercel.app || exit 1
    
- name: Notify Success
  if: success()
  run: echo "✅ 部署成功！"
  
- name: Notify Failure
  if: failure()
  run: echo "❌ 部署失败，请检查日志"
```

---

## 📞 支持

如果遇到问题，请按以下顺序排查：

1. **检查 GitHub Actions 日志**
2. **验证 Vercel Deploy Hook 配置**
3. **确认 GitHub Secrets 设置正确**
4. **尝试手动部署**: `vercel --prod`
5. **清除浏览器缓存测试**

**紧急情况**: 如果自动部署完全失效，可以随时使用 `vercel --prod` 进行手动部署。