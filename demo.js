/**
 * Deterministic demo dataset for Knowledge OS.
 *
 * It exists so the dashboard is fully explorable before any account is
 * connected: every number, chart, folder tree, preview and task is generated
 * from this file, and every item carries `demo: true` so the UI can say so.
 * Dates are anchored to "today" but stable within a day.
 */

const SEED = 20261106

function rng(seed) {
  let a = seed >>> 0
  return function next() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dayOffset(days, hour = 10, minute = 12) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d
}

const OBSIDIAN = [
  ['研究/RAG', 'RAG 检索增强生成：从 Naive RAG 到 GraphRAG', ['RAG', '检索', 'LLM'], 4200, 0, 14],
  ['工作/会议', '知识中枢产品评审会议纪要', ['会议', '产品'], 1600, 0, 4],
  ['研究/Agent', 'Agent 记忆机制调研：短期、长期与情景记忆', ['Agent', '记忆'], 3600, 1, 11],
  ['研究/论文', 'DeepSeek-V4 技术报告精读', ['论文', 'DeepSeek', 'MoE'], 5200, 2, 22],
  ['工作/DSH', 'DSH 插件机制：host / client 双半边与 Slot 系统', ['DSH', '插件'], 2800, 3, 9],
  ['工作/周报', '2026-W45 周报', ['周报', '复盘'], 900, 4, 3],
  ['学习/前端', 'React 并发渲染与调度器笔记', ['React', '前端'], 2400, 6, 7],
  ['学习/系统', '分布式共识：Raft 与 Paxos 对照', ['分布式', '共识'], 3100, 8, 12],
  ['读书', '《思考，快与慢》读书笔记', ['读书', '认知'], 1800, 10, 2],
  ['生活', '2026 年度目标与季度复盘', ['复盘', '目标'], 1200, 13, 1],
  ['模板', '周复盘模板 v3', ['模板', '复盘'], 420, 16, 5],
  ['研究/多模态', '多模态大模型对齐方法综述', ['多模态', '对齐'], 4700, 20, 16],
  ['研究/推理', '推理模型：测试时计算扩展的三种路线', ['推理', 'TestTime'], 2900, 24, 13],
  ['工作/方案', '个人知识库数据模型设计', ['设计', '数据模型'], 2200, 29, 8],
  ['学习/工程', 'TypeScript 类型体操实用清单', ['TypeScript', '工程'], 1500, 35, 6],
  ['研究/评测', 'LLM 评测集与评测方法整理', ['评测', 'Benchmark'], 3300, 42, 19],
  ['归档', '2025 年度阅读清单', ['阅读', '归档'], 700, 68, 0],
  ['归档', '旧博客迁移说明', ['归档'], 300, 95, 0],
]

const NOTION = [
  ['项目 · 知识中枢', '知识中枢 PRD v2.3', ['产品', 'PRD'], 'page', 2400, 0, 9],
  ['团队空间', '2026 Q4 OKR · 个人版', ['OKR', '规划'], 'page', 1800, 2, 5],
  ['数据库 · 论文库', '论文库 · GraphRAG / RAG 方向', ['论文', '数据库'], 'database', 1200, 3, 0],
  ['会议纪要', '双周产品同步会 11-05', ['会议', '纪要'], 'page', 900, 5, 2],
  ['招聘', '算法实习生 JD（知识图谱方向）', ['招聘', 'JD'], 'page', 700, 9, 1],
  ['产品路线图', '2027 产品路线图草案', ['路线图', '规划'], 'page', 1500, 12, 4],
  ['竞品调研', '知识管理工具竞品分析：Notion / 飞书 / Obsidian', ['竞品', '调研'], 'page', 2800, 15, 7],
  ['读书清单', '2026 读书清单（42/60）', ['读书', '清单'], 'database', 600, 18, 0],
  ['生活', '京都七日行程', ['旅行', '计划'], 'page', 500, 22, 1],
  ['项目 · ArchLab', '架构显微镜需求池', ['需求', 'ArchLab'], 'database', 1100, 27, 3],
  ['团队空间', '设计系统规范 v1.4', ['设计系统', '规范'], 'page', 2000, 33, 6],
  ['内容选题库', '内容选题库 · 11 月', ['内容', '数据库'], 'database', 800, 40, 0],
  ['项目 · 知识中枢', '数据接入联调记录', ['联调', '记录'], 'page', 1300, 0, 4],
  ['用户研究', '用户访谈纪要（5 位重度笔记用户）', ['访谈', '纪要'], 'page', 2100, 55, 3],
  ['归档 · 2025', '2025 年度总结', ['总结', '归档'], 'page', 1700, 88, 2],
  ['团队空间', '入职指南（产品/研发）', ['入职', '流程'], 'page', 1000, 103, 5],
]

const FEISHU = [
  ['云文档 / 产品', '知识中枢 · 技术方案评审', ['评审', '技术'], 'docx', 2600, 1, 8],
  ['云文档 / 产品', '需求文档：多源文档聚合 v1.2', ['需求', 'PRD'], 'docx', 3200, 4, 11],
  ['知识库 / 团队', '新人上手指南（研发）', ['指南', '入职'], 'docx', 1500, 7, 3],
  ['会议 / 双周会', '双周会纪要 2026-10-30', ['纪要', '会议'], 'docx', 800, 10, 1],
  ['多维表格 / 内容', '内容排期表 · Q4', ['排期', '表格'], 'bitable', 400, 14, 0],
  ['云文档 / 运营', '季度运营复盘（Q3）', ['复盘', '运营'], 'docx', 1900, 19, 4],
  ['知识库 / 技术', '服务端接口规范 v1', ['接口', '规范'], 'docx', 2300, 25, 7],
  ['云文档 / 财务', '2027 预算测算', ['预算', '财务'], 'sheet', 1100, 32, 2],
  ['思维笔记 / 产品', '知识图谱交互脑暴', ['脑暴', '图谱'], 'mindnote', 600, 38, 0],
  ['云文档 / 产品', '埋点与数据看板设计', ['数据', '埋点'], 'docx', 1700, 46, 5],
  ['知识库 / 团队', '值班与故障响应手册', ['SRE', '手册'], 'docx', 2100, 58, 9],
  ['云文档 / 项目', '迁移方案：Notion → 飞书', ['迁移', '方案'], 'docx', 1900, 71, 6],
  ['多维表格 / 招聘', '候选人跟踪表', ['招聘', '表格'], 'bitable', 500, 84, 0],
  ['云文档 / 归档', '2025 产品年报', ['归档', '年报'], 'docx', 2500, 108, 1],
]

const TYPE_WORDS = { docx: '飞书文档', sheet: '飞书表格', bitable: '多维表格', mindnote: '思维笔记', page: 'Notion 页面', database: 'Notion 数据库' }

function buildDocs() {
  const rand = rng(SEED)
  const clauses = ['可检索性', '上下文组织', '长期记忆', '低成本召回', '结构化沉淀', '跨源关联', '自动摘要', '语义索引']
  const docs = []
  let slot = 0
  const push = (source, row) => {
    const [folder, title, tags] = row
    const rich = row.length >= 7
    const type = rich ? row[3] : source === 'obsidian' ? 'markdown' : source === 'notion' ? 'page' : 'docx'
    const realWords = rich ? row[4] : row[3]
    const realDays = rich ? row[5] : row[4]
    const realLinks = rich ? row[6] : row[5]
    const day = dayOffset(realDays, 8 + (slot % 11), (slot * 7) % 60)
    slot += 1
    const id = `demo:${source}:${docs.filter((d) => d.source === source).length}`
    docs.push({
      id,
      source,
      title,
      folder,
      path:
        source === 'obsidian'
          ? `Obsidian Vault / ${folder}`
          : source === 'notion'
            ? `Notion / ${folder}`
            : `飞书 / ${folder}`,
      url: '',
      updatedAt: day.toISOString(),
      createdAt: dayOffset(realDays + 40 + Math.round(rand() * 220), 9, 0).toISOString(),
      words: realWords,
      chars: realWords * 1.65,
      tags,
      excerpt: `${title}。${clauses[slot % clauses.length]}与${clauses[(slot + 3) % clauses.length]}的整理，包含结论、待验证假设和下一步动作。`,
      type,
      typeLabel: source === 'obsidian' ? 'Markdown' : TYPE_WORDS[type] || type,
      links: realLinks,
      demo: true,
      previewable: true,
    })
  }
  for (const row of OBSIDIAN) push('obsidian', row)
  for (const row of NOTION) push('notion', row)
  for (const row of FEISHU) push('feishu', row)
  return docs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

function dueDay(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PROJECTS = [
  { id: 'p-work', name: '工作', color: '#4f7cff' },
  { id: 'p-research', name: '科研', color: '#a78bfa' },
  { id: 'p-study', name: '学习', color: '#22d3ee' },
  { id: 'p-life', name: '生活', color: '#f59e0b' },
]

const TODO_ROWS = [
  ['完成知识中枢数据接入联调', 'p-work', 0, 5, false],
  ['修复看板深色模式对比度问题', 'p-work', 0, 3, false],
  ['提交本周周报', 'p-work', 0, 3, false],
  ['修改论文第三章的实验部分', 'p-research', -2, 5, false],
  ['给导师发阶段性进展邮件', 'p-research', -1, 3, false],
  ['准备组会汇报 PPT', 'p-research', 1, 5, false],
  ['预约下月体检', 'p-life', 0, 1, false],
  ['整理 10 月账单', 'p-life', -3, 1, false],
  ['读完 GraphRAG 论文并整理笔记', 'p-study', 0, 3, false],
  ['整理 Obsidian 标签体系', 'p-study', 2, 1, false],
  ['购买显示器支架', 'p-life', 3, 0, false],
  ['评审飞书技术方案文档', 'p-work', 4, 3, false],
  ['续费 Notion Plus', 'p-life', 10, 0, false],
  ['跑步 5km（周三/周六）', 'p-life', 6, 1, false],
  ['完成 DSH 插件市场调研', 'p-work', 12, 3, false],
  ['读书：《系统之美》前 4 章', 'p-study', 9, 1, false],
  ['备份 Obsidian Vault 到 iCloud', 'p-life', 15, 0, false],
  ['写 Q4 个人 OKR', 'p-work', 5, 3, false],
  ['整理 9 月读书笔记', 'p-study', -6, 1, true],
  ['完成架构显微镜 v9 发布', 'p-work', -3, 5, true],
  ['预约牙科复查', 'p-life', -1, 1, true],
  ['看完《深度工作》第 3 部分', 'p-study', -4, 1, true],
]

function buildTodos() {
  return TODO_ROWS.map((row, i) => {
    const [title, projectId, offset, priority, completed] = row
    const project = PROJECTS.find((p) => p.id === projectId)
    return {
      id: `demo:dida:${i}`,
      title,
      projectId,
      projectName: project.name,
      projectColor: project.color,
      dueDay: dueDay(offset),
      dueTime: i % 3 === 0 ? '09:30' : i % 3 === 1 ? '14:00' : '',
      priority,
      completed: Boolean(completed),
      completedTime: completed ? dayOffset(-Math.abs(offset), 18, 20).toISOString() : null,
      tags: [],
      url: '',
      demo: true,
    }
  })
}

const CONTENT = {
  'RAG 检索增强生成': `# RAG 检索增强生成：从 Naive RAG 到 GraphRAG

> 目标：把「检索」从关键词匹配升级为可解释的证据组织。

## 一句话结论
RAG 的上限不取决于生成模型，而取决于**切分粒度 × 召回质量 × 重排策略**三者是否匹配。

## 演进路线
1. **Naive RAG**：固定长度切分 → 向量召回 top-k → 直接拼接。
2. **Advanced RAG**：查询改写、混合检索（BM25 + dense）、cross-encoder 重排。
3. **GraphRAG**：先抽实体与关系，建图后做社区摘要，回答「跨文档、全局性」问题。

## 关键实验
| 方案 | Recall@5 | 答案忠实度 | 延迟 |
| --- | --- | --- | --- |
| Naive | 0.62 | 0.71 | 0.9s |
| + 混合检索 | 0.78 | 0.79 | 1.2s |
| + 重排 | 0.84 | 0.85 | 1.6s |
| GraphRAG | 0.81 | 0.88 | 3.4s |

## 待验证
- [ ] 中文长文档的实体抽取质量
- [ ] 图索引增量更新的成本
- [ ] 与个人知识库（Obsidian）的联动方式

## 参考
- [[DeepSeek-V4 技术报告精读]]
- [[Agent 记忆机制调研：短期、长期与情景记忆]]`,

  'DSH 插件机制': `# DSH 插件机制：host / client 双半边与 Slot 系统

## 一个插件包，两个半边
- **Host 半边**（Node）：注册 Web 路由、Tools、存储；没有 DOM。
- **Client 半边**（浏览器）：由 ModuleLoader 求值，注册侧边栏图标与主面板。

\`\`\`js
return {
  inject: ['slots', 'theme', 'locale'],
  apply(ctx) {
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register({ name: 'sidebar.panellist', id: 'kb', order: 13 }, Icon))
    ctx.slots.inject('main', () =>
      ctx.slots.register({ name: 'main', key: 'kb' }, () => Panel({ ctx })))
  },
}
\`\`\`

## 关键约束
1. 侧边栏 id 必须与 main 的 key 一致，点击图标才会切到你的面板。
2. client 半边只能 \`require('react')\`，不能直接 import 本地模块。
3. 路由用 \`ctx.webServer.register({ kind: 'prefix', path })\`。
4. 主题跟随 DSH：监听 \`theme/change\`，使用 \`--dsw-alias-*\` 变量。

## 下一步
- [x] 跑通最小面板
- [ ] 接入真实数据源
- [ ] 设计卡片与图表组件`,

  '知识中枢 PRD': `# 知识中枢 PRD v2.3

## 1. 背景
个人知识散落在 Obsidian、Notion、飞书文档与本地文件中，缺少一个「统一入口 + 全局视图」。

## 2. 核心场景
- **找得到**：搜索标题、标签、摘要，知道文档存在哪个软件、哪个目录。
- **看得清**：文档量、更新趋势、来源分布、标签结构。
- **接得上**：一键预览，或深链跳回原应用。
- **排得动**：把滴答清单的今日/逾期任务和文档放在同一屏。

## 3. 信息架构
\`\`\`
总览 ─ KPI / 趋势 / 来源 / 最近更新 / 今日焦点
文档库 ─ 筛选 / 排序 / 预览抽屉 / 深链
知识地图 ─ 来源 → 文件夹 → 文档
待办 ─ 逾期 / 今天 / 本周 / 以后
设置 ─ Token / 路径 / 同步频率
\`\`\`

## 4. 验收标准
- [ ] 首屏 3 秒内可用（含演示数据兜底）
- [ ] 任一文档 ≤ 2 次点击可打开原应用
- [ ] 待办完成状态与滴答清单双向一致（API 失败时明确提示）
- [ ] 深浅色主题对比度 ≥ 4.5:1`,

  '知识中枢 · 技术方案评审': `# 知识中枢 · 技术方案评审

## 结论
方案整体可行，建议把「连接器」与「统计聚合」拆开，连接器只负责产出标准文档模型。

## 评审意见
1. 统一模型字段：id / source / title / folder / url / updatedAt / tags / words。
2. 深链协议分别封装，前端不拼 URL。
3. Token 只落本机，接口返回必须脱敏。
4. 首次同步可能很慢，需要缓存 + 手动刷新。

## 风险
| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 飞书权限未开通 | 拉不到文档 | 降级为演示数据并提示申请权限 |
| Notion 限流 3 req/s | 搜索变慢 | 分页 + 本地缓存 5 分钟 |
| 深链协议变化 | 跳转失败 | 统一封装 + 兜底网页链接 |`,
}

function demoContentFor(doc) {
  for (const [key, text] of Object.entries(CONTENT)) {
    if (doc.title.includes(key)) return text
  }
  const tagLine = doc.tags.length ? doc.tags.map((t) => `#${t}`).join(' ') : ''
  return `# ${doc.title}

> 来源：${doc.path} · 最近更新 ${new Date(doc.updatedAt).toLocaleDateString('zh-CN')}

## 摘要
${doc.excerpt}

## 要点
1. **背景**：这个问题来自最近的项目实践，需要沉淀成可复用的方法。
2. **观察**：现有流程的摩擦点主要在「跨工具检索」和「上下文丢失」。
3. **判断**：先把数据模型统一，再谈自动化和智能推荐。

## 下一步
- [ ] 补齐关键数据与截图
- [ ] 与相关同事对齐结论
- [ ] 把结论回写到知识库索引

${tagLine}

---
*这是演示内容。接入真实账号后，这里会显示该文档的原文。*`
}

export function getDemoDocuments() {
  return buildDocs()
}

export function getDemoTodos() {
  return buildTodos()
}

export function getDemoProjects() {
  return PROJECTS.map((p) => ({ ...p }))
}

export function getDemoContent(doc) {
  return demoContentFor(doc)
}

export const DEMO_SOURCE_COUNTS = {
  obsidian: OBSIDIAN.length,
  notion: NOTION.length,
  feishu: FEISHU.length,
}
