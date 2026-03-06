# check-cx-admin

`check-cx-admin` 是 `BingZi-233/check-cx` 的后台管理项目，用来管理以下核心对象：

- `check_configs`：Provider 配置
- `check_request_templates`：请求模板
- `group_info`：分组信息
- `system_notifications`：系统通知
- `check_history`：检测历史（只读）
- `check_poller_leases`：轮询主节点状态（只读）

技术栈保持克制，没有乱加花活：

- Next.js 16 App Router
- React 19
- shadcn/ui
- Supabase Auth + Supabase Database

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

默认地址：`http://localhost:3000`

## 环境变量

见 `.env.example`。

### 必填

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 可选

- `SUPABASE_OAUTH_PROVIDERS`：默认 `google,github`
- `ADMIN_EMAILS`：逗号分隔白名单；留空表示任意已登录用户都能进后台

## 认证说明

- 登录页优先走 OAuth。
- 邮箱密码登录保留给初始化与兜底。
- 登录、OAuth 发起、回调、登出全部走服务端。
- `/dashboard/**` 路由受 Supabase 会话保护。
- 如果设置了 `ADMIN_EMAILS`，OAuth 回调、密码登录和后台页面都会校验邮箱白名单。
- 项目认证配置全部改为服务端运行时读取，便于在 Docker 运行时通过环境变量覆盖。

## Docker

### 本地构建镜像

```bash
docker build -t check-cx-admin:local .
```

### 本地运行容器

先准备 `.env`，变量名和 `.env.example` 一致。

```bash
docker compose up -d
```

镜像运行时直接读取 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_OR_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_OAUTH_PROVIDERS`、`ADMIN_EMAILS`，不会把这些值写死进前端产物。

## GitHub Actions

仓库已添加两条工作流：

- `.github/workflows/ci.yml`：在 `main` push 和 PR 上执行 `pnpm lint`、`pnpm build`
- `.github/workflows/docker.yml`：推送 `v*` tag 或手动触发时，发布 `docker.io/bingzi233/check-cx-admin`

Docker 发布工作流需要配置以下 secrets：

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## 当前页面

- `/login`：登录页
- `/dashboard`：概览
- `/dashboard/configs`：Provider 配置
- `/dashboard/templates`：请求模板
- `/dashboard/groups`：分组信息
- `/dashboard/notifications`：系统通知
- `/dashboard/history`：检测历史
- `/dashboard/system`：运行状态

## 数据权限建议

这个后台默认通过 `SUPABASE_SERVICE_ROLE_KEY` 读写管理表，因为上游项目当前 RLS 主要偏前台读取，并没有给管理后台准备完整的写策略。

别把 `SUPABASE_SERVICE_ROLE_KEY` 暴露到客户端。这个项目已经把它限制在服务端使用。
