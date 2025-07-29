#!/bin/bash

# 同步脚本：将代码推送到 GitHub 和 Gitee
# 使用方法：./sync-repos.sh "提交信息"

set -e  # 遇到错误立即退出

# 检查是否提供了提交信息
if [ $# -eq 0 ]; then
    echo "错误：请提供提交信息"
    echo "使用方法：./sync-repos.sh \"提交信息\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 开始同步代码到 GitHub 和 Gitee..."
echo "📝 提交信息：$COMMIT_MESSAGE"
echo ""

# 添加所有更改
echo "📦 添加所有更改..."
git add .

# 检查是否有更改需要提交
if git diff --staged --quiet; then
    echo "ℹ️  没有检测到更改，跳过提交步骤"
else
    echo "💾 提交更改..."
    git commit -m "$COMMIT_MESSAGE"
fi

# 推送到 GitHub
echo "🐙 推送到 GitHub..."
git push origin main
echo "✅ GitHub 推送完成"

# 推送到 Gitee
echo "🦄 推送到 Gitee..."
git push gitee main
echo "✅ Gitee 推送完成"

echo ""
echo "🎉 同步完成！代码已成功推送到："
echo "   📍 GitHub: https://github.com/Atomyi1412/Atomyi1412.github.io"
echo "   📍 Gitee:  https://gitee.com/xudongyi1412/atomyi1412.github.io"
echo ""
echo "💡 提示：GitHub Pages 和 Gitee Pages 可能需要几分钟时间更新"