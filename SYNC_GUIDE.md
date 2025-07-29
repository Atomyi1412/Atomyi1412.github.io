# 代码同步指南

本项目已配置为同时推送到 GitHub 和 Gitee 两个平台。

## 🔗 仓库地址

- **GitHub**: https://github.com/Atomyi1412/Atomyi1412.github.io
- **Gitee**: https://gitee.com/xudongyi1412/atomyi1412.github.io

## 🚀 快速同步

### 方法一：使用同步脚本（推荐）

```bash
# 一键同步到两个平台
./sync-repos.sh "你的提交信息"
```

**示例：**
```bash
./sync-repos.sh "修复登录问题 v4.2.1"
./sync-repos.sh "添加新功能：自动保存提醒"
./sync-repos.sh "优化用户界面体验"
```

### 方法二：手动推送

```bash
# 添加更改
git add .

# 提交更改
git commit -m "你的提交信息"

# 推送到 GitHub
git push origin main

# 推送到 Gitee
git push gitee main
```

## 📋 远程仓库配置

查看当前配置的远程仓库：
```bash
git remote -v
```

应该显示：
```
gitee   https://gitee.com/xudongyi1412/atomyi1412.github.io.git (fetch)
gitee   https://gitee.com/xudongyi1412/atomyi1412.github.io.git (push)
origin  git@github.com:Atomyi1412/Atomyi1412.github.io.git (fetch)
origin  git@github.com:Atomyi1412/Atomyi1412.github.io.git (push)
```

## 🌐 Pages 服务

- **GitHub Pages**: https://atomyi1412.github.io/
- **Gitee Pages**: 需要在 Gitee 仓库设置中手动开启

## ⚠️ 注意事项

1. **同步延迟**: GitHub Pages 和 Gitee Pages 更新可能需要几分钟时间
2. **Gitee Pages**: 免费版需要手动更新，付费版支持自动更新
3. **权限问题**: 确保你有两个仓库的推送权限
4. **分支同步**: 目前配置为同步 `main` 分支

## 🔧 故障排除

### 推送失败
```bash
# 检查远程仓库配置
git remote -v

# 检查当前分支
git branch

# 检查仓库状态
git status
```

### 权限问题
- GitHub: 确保 SSH 密钥配置正确
- Gitee: 确保账号有仓库推送权限

### 同步冲突
```bash
# 拉取最新代码
git pull origin main
git pull gitee main

# 解决冲突后重新推送
./sync-repos.sh "解决同步冲突"
```

## 📝 版本管理规范

- **Bug 修复**: 增加小版本号 (v4.2.0 → v4.2.1)
- **功能修改**: 增加中间版本号 (v4.2.1 → v4.3.0)
- **重大更新**: 增加主版本号 (v4.3.0 → v5.0.0)

## 🎯 最佳实践

1. **提交信息规范**: 使用清晰描述性的提交信息
2. **定期同步**: 每次修改后及时同步到两个平台
3. **测试验证**: 推送后检查两个平台的部署状态
4. **备份重要**: 重要更新前先备份当前版本

---

💡 **提示**: 使用 `./sync-repos.sh` 脚本可以确保代码始终在两个平台保持同步！