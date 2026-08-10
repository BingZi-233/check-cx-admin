---
name: git-bump
description: 一键版本升级并 git 提交
category: Release
tags: [version, git, release]
---

**一键版本升级**

自动递增 patch 版本并提交。

**立即执行以下操作，无需确认**:

1. 读取 `package.json` 中的 `version` 字段
2. 递增 patch 版本 (例: 1.20.0 → 1.20.1)
3. 使用 Edit 工具更新 `package.json`
4. 执行 `git add -A` 暂存所有变更
5. 执行 `git diff --cached --stat` 查看暂存区的变更文件
6. 根据变更内容生成 commit 消息:
   - 如果只有 `package.json` 变更: `chore: bump version to <新版本>`
   - 如果有其他文件变更: 分析变更内容，生成符合 Conventional Commits 规范的消息，并在末尾附加 `(v<新版本>)`
7. 执行 `git commit -m "<生成的消息>"`
8. 创建 tag: `git tag v<新版本>`
9. 输出: `✓ 版本升级完成: <旧版本> → <新版本>，本地 tag v<新版本> 已创建`
