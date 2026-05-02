# Check CX Admin

`check-cx-admin` 是 `check-cx` 的后台管理项目，用于维护监控系统运行所依赖的核心配置与管理数据，包括：

## 相关项目

- 前台监控面板：[`BingZi-233/check-cx`](https://github.com/BingZi-233/check-cx)
- 前台项目负责轮询检测、状态展示与只读 API；当前项目负责模型、Provider、模板、分组及系统通知等后台管理能力。

- `check_models`：模型配置
- `check_configs`：Provider 配置
- `check_request_templates`：请求模板
- `group_info`：分组信息
- `system_notifications`：系统通知
- `check_history`：检测历史（只读）
- `check_poller_leases`：轮询主节点状态（只读）

主要技术栈如下：

- Next.js 16 App Router
- React 19
- shadcn/ui
- Supabase Auth + Supabase Database

## 一键部署 / 快速入口

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxingxinag%2Fcheck-cx-admin&project-name=check-cx-admin&repository-name=check-cx-admin)

适配情况：

- 项目是标准 `Next.js` 应用
- 需要在 Vercel 环境变量中填写下方“环境变量”章节的配置
- 生产环境建议设置 `APP_URL` 为最终访问域名
- 需要在 Supabase Auth Redirect URLs 中加入 `APP_URL/auth/callback`

### Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Fxingxinag%2Fcheck-cx-admin)

适配情况：

- 仓库已有 `Dockerfile`
- Railway 可按 Dockerfile 构建运行
- 需要在 Railway Variables 中填写下方“环境变量”章节的配置
- 生产环境必须正确设置 `APP_URL`，否则 OAuth 回调可能指向错误域名

### Docker / 自建服务器

```bash
docker compose up -d
```

适配情况：

- 仓库已有 `Dockerfile`
- 仓库已有 `docker-compose.yml`
- 默认镜像为 `bingzi233/check-cx-admin:latest`
- 需要准备 `.env` 文件，内容可参考 `.env.example`

### 其他平台支持情况

| 平台 | 状态 | 说明 |
|------|------|------|
| Docker / 自建服务器 | 推荐 | 仓库已有 `Dockerfile` 和 `docker-compose.yml`，适合管理后台长期运行 |
| Vercel | 可用 | 原生支持 Next.js，但要正确配置 `APP_URL` 和 Supabase OAuth 回调 |
| Railway | 可用 | 可基于 Dockerfile 部署 |
| Render | 理论可用 | 可按 Docker Web Service 部署，但仓库暂无 `render.yaml` 一键配置 |
| Netlify | 不推荐 | 仓库暂无 `netlify.toml`，管理后台认证回调更适合 Node 服务端运行 |
| Cloudflare Pages | 不推荐 | 仓库暂无 OpenNext/Workers 适配配置，Supabase service role 与 OAuth 回调更适合 Node/Docker/Vercel |

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

默认访问地址为 `http://localhost:3000`。

## 环境变量

环境变量示例请参见 `.env.example`。

### 必填

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 可选

- `APP_URL`：后台对外访问地址；在反向代理或 Docker 生产环境中，建议显式设置，例如 `https://admin.example.com`
- `SUPABASE_OAUTH_PROVIDERS`：默认 `google,github`
- `ADMIN_EMAILS`：逗号分隔的邮箱白名单；留空表示任意已登录用户均可访问后台

## 认证说明

- 登录页默认优先使用 OAuth。
- 邮箱密码登录保留为初始化与兜底方案。
- 登录、OAuth 发起、回调及登出流程均由服务端处理。
- `/dashboard/**` 路由受 Supabase 会话保护。
- 如果设置了 `ADMIN_EMAILS`，则 OAuth 回调、密码登录和后台页面访问都会校验邮箱白名单。
- 项目认证配置在服务端运行时读取，便于在 Docker 等部署环境中通过环境变量覆盖。
- 生产环境建议显式设置 `APP_URL`；否则 OAuth 回调地址会依赖请求头，在反向代理配置不当时可能错误地指向 `http://localhost:3000`。
- 同时需要在 Supabase Auth 的 Redirect URLs 中加入 `APP_URL/auth/callback`，例如 `https://admin.example.com/auth/callback`。

## Docker

### 本地构建镜像

```bash
docker build -t check-cx-admin:local .
```

### 本地运行容器

请先准备 `.env` 文件，变量名与 `.env.example` 保持一致。

```bash
docker compose up -d
```

镜像在运行时直接读取 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_OR_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`APP_URL`、`SUPABASE_OAUTH_PROVIDERS`、`ADMIN_EMAILS`，不会将这些值固化到前端构建产物中。

## 生产部署示例

生产环境不建议直接使用 `latest` 标签，推荐固定使用明确的版本 tag。

### 1. 准备目录

```bash
mkdir -p /opt/check-cx-admin
cd /opt/check-cx-admin
```

### 2. 写入环境变量

创建 `.env` 文件：

```env
SUPABASE_URL=https://service.check-cx.org
SUPABASE_PUBLISHABLE_OR_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
APP_URL=https://admin.example.com
SUPABASE_OAUTH_PROVIDERS=google,github
ADMIN_EMAILS=admin@example.com
```

### 3. 配置 Supabase Auth 回调白名单

至少加入以下回调地址：

```text
https://admin.example.com/auth/callback
```

如果本地开发环境也需要测试 OAuth，可额外加入：

```text
http://localhost:3000/auth/callback
```

### 4. 写入生产 compose

创建 `docker-compose.yml` 文件：

```yaml
services:
  check-cx-admin:
    image: bingzi233/check-cx-admin:v0.1.1
    container_name: check-cx-admin
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
      APP_URL: ${APP_URL}
```

如果前置使用 Nginx、Caddy 或 Traefik 等反向代理，建议仅将容器绑定到内网端口。此处为便于演示，直接暴露 `3000` 端口。

### 5. 启动

```bash
docker compose pull
docker compose up -d
```

### 6. 更新版本

将 `image` 从旧版本 tag 更新为新版本 tag 后，执行：

```bash
docker compose pull
docker compose up -d
```

### 7. 查看日志

```bash
docker compose logs -f check-cx-admin
```

## GitHub Actions

仓库当前包含以下两条工作流：

- `.github/workflows/ci.yml`：在 `main` push 和 PR 上执行 `pnpm lint`、`pnpm build`
- `.github/workflows/docker.yml`：推送 `v*` tag 或手动触发时，发布 `docker.io/bingzi233/check-cx-admin`

Docker 发布工作流需要配置以下 Secrets：

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## 发版方式

### 推送版本 tag

```bash
git tag v0.1.0
git push origin v0.1.0
```

推送后，`docker.yml` 会自动构建并发布以下镜像：

- `docker.io/bingzi233/check-cx-admin:v0.1.1`
- `docker.io/bingzi233/check-cx-admin:latest`

### 手动触发

也可以在 GitHub Actions 页面手动触发 `Build and Push Docker Image` 工作流。

## 当前页面

- `/login`：登录页
- `/dashboard`：概览
- `/dashboard/models`：模型配置
- `/dashboard/configs`：Provider 配置
- `/dashboard/templates`：请求模板
- `/dashboard/groups`：分组信息
- `/dashboard/notifications`：系统通知
- `/dashboard/history`：检测历史
- `/dashboard/system`：运行状态

## 数据权限建议

该后台默认通过 `SUPABASE_SERVICE_ROLE_KEY` 读写管理表。原因在于上游项目当前的 RLS 策略主要面向前台读取场景，尚未为管理后台提供完整的写入策略。

请勿将 `SUPABASE_SERVICE_ROLE_KEY` 暴露到客户端。当前项目已将其限制为仅在服务端使用。
