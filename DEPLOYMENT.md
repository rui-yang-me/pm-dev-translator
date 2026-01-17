# PM-Dev Translator 部署文档

## GitHub Actions 自动部署 (推荐)

### 1. 配置 GitHub Secrets

在 GitHub 仓库 **Settings > Secrets and variables > Actions** 中添加以下 Secrets：

| Secret 名称 | 说明 | 获取方式 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | [创建 Token](https://dash.cloudflare.com/profile/api-tokens)，权限选择 "Edit Cloudflare Workers" |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | Dashboard 右侧栏或 URL 中获取 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | [DeepSeek 控制台](https://platform.deepseek.com/) |

### 2. 创建 Cloudflare API Token

1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token**
3. 选择 **Create Custom Token**
4. 配置权限：
   - **Account > Cloudflare Pages** - Edit
   - **Account > Cloudflare Workers Scripts** - Edit
   - **Account > Account Settings** - Read
   - **Zone > Zone** - Read (如需绑定自定义域名)
5. 创建并复制 Token

### 3. 触发部署

- **自动触发**：推送到 `main` 分支
- **手动触发**：GitHub Actions 页面点击 "Run workflow"

### 4. 首次部署注意

首次部署 Pages 前，需要先在 Cloudflare Dashboard 创建 Pages 项目：
1. 进入 **Workers & Pages > Create application > Pages**
2. 选择 **Direct Upload**
3. 项目名称填写 `pm-dev-translator`
4. 上传任意文件完成创建（后续由 GitHub Actions 覆盖）

---

## 手动部署

## 项目结构

```
pm-dev-translator/
├── worker/          # Cloudflare Workers 后端
│   ├── src/
│   │   ├── index.ts
│   │   └── prompts.ts
│   ├── wrangler.toml
│   └── package.json
└── frontend/        # Cloudflare Pages 前端
    ├── index.html
    ├── styles.css
    └── app.js
```

## 一、Cloudflare Workers 部署

### 前置条件

1. 安装 Node.js (>= 18)
2. 安装 Wrangler CLI: `npm install -g wrangler`
3. 登录 Cloudflare: `wrangler login`

### 部署步骤

```bash
# 1. 进入 worker 目录
cd worker

# 2. 安装依赖
npm install

# 3. 配置 API Key (只需执行一次)
wrangler secret put DEEPSEEK_API_KEY
# 输入你的 DeepSeek API Key

# 4. 部署
npm run deploy
```

### 注意事项

| 事项 | 说明 |
|------|------|
| API Key 安全 | 使用 `wrangler secret` 设置，不要写在代码或 wrangler.toml 中 |
| 本地开发 | 创建 `worker/.dev.vars` 文件存放本地 API Key，已加入 .gitignore |
| 域名绑定 | 部署后可在 Cloudflare Dashboard > Workers > 自定义域名 中配置 |
| 免费额度 | Workers 免费版每天 100,000 次请求 |

### wrangler.toml 当前配置

```toml
name = "pm-dev-translator"
main = "src/index.ts"
compatibility_date = "2024-06-14"

[vars]
# DEEPSEEK_API_KEY should be set as a secret:
# wrangler secret put DEEPSEEK_API_KEY
```

## 二、Cloudflare Pages 部署

### 方式一：通过 Git 仓库 (推荐)

1. **连接 Git 仓库**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 进入 **Workers & Pages** > **Create application** > **Pages**
   - 选择 **Connect to Git**
   - 授权并选择你的仓库

2. **配置构建设置**
   ```
   项目名称: pm-dev-translator
   生产分支: main
   构建命令: (留空，纯静态文件无需构建)
   构建输出目录: frontend
   根目录: /
   ```

3. **部署**
   - 点击 **Save and Deploy**
   - 后续每次 push 到 main 分支会自动部署

### 方式二：直接上传

```bash
# 使用 Wrangler 直接部署
wrangler pages deploy frontend --project-name=pm-dev-translator
```

### 注意事项

| 事项 | 说明 |
|------|------|
| API 地址 | 部署前需修改 `frontend/app.js` 中的 `API_BASE` 为 Worker 线上地址 |
| CORS | Worker 已配置 CORS 允许跨域请求 |
| 自定义域名 | Pages > 项目设置 > 自定义域 中配置 |
| 免费额度 | Pages 免费版每月 500 次构建，无限请求 |

## 三、部署前检查清单

- [ ] `worker/.dev.vars` 已添加到 `.gitignore`
- [ ] 已通过 `wrangler secret put DEEPSEEK_API_KEY` 设置线上 API Key
- [ ] `frontend/app.js` 中 `API_BASE` 已改为线上 Worker 地址
- [ ] 本地测试通过

## 四、修改 API 地址

部署 Worker 后，获取线上地址（如 `https://pm-dev-translator.your-subdomain.workers.dev`），然后修改前端：

```javascript
// frontend/app.js
const API_BASE = 'https://pm-dev-translator.your-subdomain.workers.dev';
```

## 五、常用命令

```bash
# Worker 本地开发
cd worker && npm run dev

# Worker 部署
cd worker && npm run deploy

# Worker 查看日志
wrangler tail

# Pages 直接部署
wrangler pages deploy frontend --project-name=pm-dev-translator

# 查看 secret 列表
wrangler secret list
```

## 六、故障排查

| 问题 | 解决方案 |
|------|----------|
| "API key not configured" | 检查是否执行了 `wrangler secret put DEEPSEEK_API_KEY` |
| CORS 错误 | 确认 Worker 的 CORS 配置，检查 `origin` 设置 |
| 502/503 错误 | 检查 DeepSeek API 是否正常，API Key 是否有效 |
| 部署失败 | 运行 `wrangler whoami` 确认登录状态 |
