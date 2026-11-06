# DSH Knowledge Board · 个人知识中枢

一个 DeepSeek Harness 插件：把 **Obsidian、Notion、飞书文档** 和 **滴答清单** 收进同一块看板，提供文档统计、存储地图、Markdown 预览、深链跳转和 TODO 规划。

- 插件包：`dsh-knowledge-board`
- 入口：DSH Web 侧边栏「知识看板」
- 形态：Host 数据连接器 + Web 客户端面板，无第三方运行时依赖
- 主题：跟随 DSH 深色 / 浅色
- 数据：所有 Token 只存本机；未配置的来源用演示数据兜底

## 功能

- **总览**：文档总数、总字数、本周更新、待办；12 周趋势、来源分布、最近更新、今日焦点、标签分布
- **文档库**：跨来源搜索 / 筛选 / 排序；点击行内预览 Markdown，或深链打开原应用
- **知识地图**：来源卡（路径、数量、字数）、目录树、12 周热力图、格式分布、90 天未更新
- **待办**：已逾期 / 今天 / 本周 / 以后四列；勾选完成、快速添加直接写回滴答清单
- **设置**：Obsidian Vault、Notion Token、飞书 App、滴答 Token；每个来源可测试连接
- **Agent 工具**：`knowledge_board`，可让模型查询文档统计、搜索结果、待办和刷新

## 安装

要求：DeepSeek Harness `>= 0.2.0-rc.2`，Node.js 22+。

### 方式 A：npm（推荐给最终用户）

```bash
npm publish --access public
```

然后在 DSH Web → **Plugins → Add** 填入包名：

```
dsh-knowledge-board
```

安装后刷新页面，侧边栏出现「知识看板」图标。

### 方式 B：GitHub

把仓库推到 GitHub（确保 `client.js` 已构建并提交），在 DSH 的 Plugins → Add 填：

```
github:your-name/dsh-knowledge-board
```

### 方式 C：本地目录 / 开发

```bash
cd ~/.dsh/profiles/<your-profile>
pnpm add link:/absolute/path/to/dsh-knowledge-board
```

然后把包名加入该 profile `package.json` 的 `dsh.profile.bundles`：

```json
{
  "dsh": {
    "profile": {
      "bundles": ["dsh-knowledge-board"]
    }
  }
}
```

重启 DSH 或重新加载 profile。Client 改动需要刷新页面；`pnpm run dev:web` 时才会自动热更新。

> 不要用 `@local/...` 作为发布名；npm 不会接受未授权的 scope。本包的 `name` 已改为 `dsh-knowledge-board`，`client.js` 的 ModuleLoader id 与 `cordis.patch.yml` 也同步改了。

## 配置

打开看板 → 设置：

### Obsidian
自动探测 `~/Documents/Obsidian Vault`、iCloud 的 Obsidian 目录等；也可手动填写 Vault 路径（一行一个）。只读 Markdown，不修改文件。

### Notion
1. <https://www.notion.so/my-integrations> 创建 Internal Integration，复制 Token
2. 在目标页面右上角 `···` →「连接」里加入该集成
3. 填进设置 → 测试连接

### 飞书文档
1. <https://open.feishu.cn/app> 创建企业自建应用，拿 App ID / App Secret
2. 权限管理开通：`drive:drive`、`docx:document:readonly`、`wiki:wiki:readonly`、`offline_access`
3. 安全设置 → 重定向 URL 添加：`http://127.0.0.1:17890/knowledge-board/oauth/callback`
4. 发布版本
5. 看板设置 → 飞书 → 「授权读取我的飞书文档」

授权后只同步个人「我的空间」和知识库；「知识库空间」可填空间名称或 `space_id` 只同步一个知识库，留空为全部。

### 滴答清单
不要用开发者后台的 Client ID / Secret。打开 <https://dida365.com/webapp/> → 左上角头像 → 设置 → 账户 → **API Token**，创建后填入设置。

## 数据与安全

- 配置：`~/.dsh/storages/knowledge-board/config.json`（目录 700，文件 600）
- 快照：同目录 `snapshot.json`，用于秒开；过期后台刷新
- Token 只在本机 Host 进程使用，接口返回时脱敏
- Agent 工具只读统计、标题、路径、任务，不返回 Token
- 所有请求从本机直接发往官方 API

## 已知限制

- 飞书个人空间和滴答账号内容少时，看板数量也会很少
- 飞书租户 token 看不到个人「我的空间」，必须完成个人 OAuth
- 知识库需要 `wiki:wiki:readonly`；权限没发布时返回 `99991679` / `20027`
- Obsidian 本地图片附件 `![[...]]` 显示占位，不提供附件服务
- 本机应用唤起（`open -a`）目前仅 macOS；文档同步跨平台可用
- 演示数据仅在未配置来源时出现

## 开发

```bash
node build.mjs      # src/*.js → client.js
node --check client.js
```

目录：

```
host.js          # 路由、快照、统计、配置、Agent 工具
connectors.js    # Obsidian / Notion / 飞书 / 滴答 连接器
demo.js          # 演示数据
src/             # 浏览器半边（纯 h()，无构建依赖）
client.js        # 构建产物
cordis.patch.yml # bundle 插入声明
```

MIT License.
