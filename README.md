# check-cx-admin 管理后台使用手册

## 1. 项目介绍

`check-cx-admin` 是一个基于 Next.js App Router 的管理后台，用于维护 check-cx 相关的：

- 检测配置（`check_configs`）
- 分组信息（`group_info`）
- 系统通知（`system_notifications`）

登录方式：使用 Supabase Auth 的 GitHub OAuth 登录。

核心依赖：

- Next.js `16.1.1`（Node.js 20+）
- Supabase（`@supabase/ssr` + `@supabase/supabase-js`）
- pnpm（Docker 镜像里固定 pnpm@9）

路由概览：

| 路径 | 说明 |
|------|------|
| `/auth/login` | 登录页（GitHub OAuth） |
| `/auth/oauth` | OAuth 回调 |
| `/protected` | 仪表盘 |
| `/protected/configs` | 检测配置管理 |
| `/protected/groups` | 分组管理 |
| `/protected/notifications` | 系统通知管理 |

访问控制：

- Supabase SSR middleware 会在未登录时把请求重定向到 `/auth/login`
- `/protected/*` 使用布局层二次校验

## 2. 环境配置

### 2.1 运行环境

- Node.js：`>= 20`
- 包管理器：pnpm `>= 9`

### 2.2 安装与本地启动

```bash
pnpm install
pnpm dev
```

默认访问：`http://localhost:3000`

### 2.3 环境变量（必需）

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（仅服务端） |

可选变量：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `GROUP_CONFIG_TABLE` | `check_config` | 分组关联的配置表名 |
| `GROUP_CONFIG_FK_COLUMN` | `group_id` | 分组外键列名 |

**注意**：`SUPABASE_SERVICE_ROLE_KEY` 具有高权限，不要暴露到前端或提交到仓库。

### 2.4 Supabase 与 GitHub OAuth 配置

回调路径：

- 生产环境：`https://<你的域名>/auth/oauth`
- 本地开发：`http://localhost:3000/auth/oauth`

Supabase 控制台配置：

1. 启用 GitHub provider
2. 将回调 URL 加入允许列表

## 3. Docker 部署

### 3.1 使用 docker compose（推荐）

1. 准备环境变量文件 `.env`

2. 启动：

```bash
docker compose up -d --build
```

3. 访问：`http://<服务器IP或域名>:3000`

### 3.2 使用 docker build + docker run

```bash
docker build -t check-cx-admin:latest .
docker run -d --name check-cx-admin \
  -p 3000:3000 \
  --env-file .env \
  check-cx-admin:latest
```

## 4. 功能模块说明

### 4.1 仪表盘（`/protected`）

系统概览统计：

- 检测配置：总数、已启用、维护中、已禁用
- 分组：总数及各分组下配置数量
- 通知：总数及当前激活数量

快捷操作：新增配置、新增通知

### 4.2 检测配置管理（`/protected/configs`）

数据源：`check_configs` 表

**列表功能**：

- 分页（每页 20 条）
- 关键字搜索：`name/type/model/endpoint/group_name`
- 分组筛选

**配置字段**：

| 字段 | 说明 |
|------|------|
| `name` | 必填 |
| `type` | Provider 类型：`openai / gemini / anthropic` |
| `model` | 必填 |
| `endpoint` | 必填，完整 URL |
| `api_key` | 创建必填，编辑可选 |
| `enabled` | 启用开关 |
| `is_maintenance` | 维护中标记 |
| `request_header` | JSON 对象 |
| `metadata` | JSON 对象 |
| `group_name` | 分组名称 |

**支持操作**：新增、编辑、复制、删除、启用/禁用切换

### 4.3 分组管理（`/protected/groups`）

数据源：`group_info` 表

**分组字段**：

| 字段 | 说明 |
|------|------|
| `group_name` | 必填，<= 80 字符，唯一 |
| `website_url` | 必填，http/https URL |

**支持操作**：新增、编辑、删除

### 4.4 系统通知管理（`/protected/notifications`）

数据源：`system_notifications` 表

**通知字段**：

| 字段 | 说明 |
|------|------|
| `message` | 必填，支持 Markdown |
| `level` | `info / warning / error` |
| `is_active` | 是否激活 |
| `start_time / end_time` | 可选时间范围 |

**支持操作**：新增、编辑、删除、激活/关闭切换

## 5. 常见问题

### 5.1 打开 `/protected` 被重定向到登录页

检查项：

- Supabase URL/anon key 是否正确
- GitHub OAuth 回调 URL 是否配置正确
- 反向代理是否传递了 `x-forwarded-host`

### 5.2 检测配置无法写入

检查项：

- 是否设置了 `SUPABASE_SERVICE_ROLE_KEY`
- `check_configs` 表是否存在且字段匹配

### 5.3 系统通知/分组管理无法写入

这两个模块使用登录用户的会话，需要在 Supabase 配置 RLS policy，允许已登录用户进行相应操作。
