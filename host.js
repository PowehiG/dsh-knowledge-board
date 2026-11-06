/**
 * Host half of Knowledge OS — a personal knowledge dashboard for the Harness.
 *
 * It merges three document sources (Obsidian vault, Notion, Feishu docs) and one
 * task source (Dida365) into a single snapshot, computes the dashboard stats,
 * serves the browser half over same-origin routes, and registers an agent tool.
 *
 * Everything runs locally: tokens never leave the machine, and every outgoing
 * request goes straight to the vendor's official API.
 */
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import {
  SOURCE_META,
  defaultVaults,
  syncObsidian,
  syncNotion,
  syncFeishu,
  syncDida,
  completeDidaTask,
  createDidaTask,
  loadNotionContent,
  loadFeishuContent,
  didaProjectUrl,
  FEISHU_OAUTH_PORT,
  FEISHU_REDIRECT_URI,
  feishuAuthorizeUrl,
  exchangeFeishuCode,
  fetchFeishuUserInfo,
} from './connectors.js'
import { getDemoDocuments, getDemoTodos, getDemoContent, getDemoProjects } from './demo.js'

const ROUTE_BASE = '/knowledge-board/api'
const DATA_DIR = process.env.DSH_KB_DATA_DIR || path.join(os.homedir(), '.dsh', 'storages', 'knowledge-board')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')
const SNAPSHOT_FILE = path.join(DATA_DIR, 'snapshot.json')
const CONTENT_TTL = 10 * 60 * 1000
const MAX_DOCS = 600

const APP_CANDIDATES = {
  obsidian: [{ path: '/Applications/Obsidian.app', url: 'obsidian://', name: 'Obsidian' }],
  notion: [{ path: '/Applications/Notion.app', url: 'notion://', name: 'Notion' }],
  feishu: [
    { path: '/Applications/Lark.app', url: 'lark://', name: '飞书' },
    { path: '/Applications/飞书.app', url: 'feishu://', name: '飞书' },
  ],
  dida: [
    { path: '/Applications/TickTick.app', url: 'ticktick://', name: '滴答清单' },
    { path: '/Applications/滴答清单.app', url: 'dida://', name: '滴答清单' },
  ],
}

export async function openApp(source) {
  if (process.platform !== 'darwin') throw new Error('本机应用唤起目前只支持 macOS')
  const app = detectApps()[source]
  if (!app?.installed) throw new Error('未检测到对应的本机应用')
  const bundleName = app.bundle || app.name
  await new Promise((resolve, reject) => {
    const child = spawn('open', ['-a', bundleName], { stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`打开 ${app.name} 失败（exit ${code}）`))))
  })
  return app
}

export function detectApps() {
  const apps = {}
  for (const [id, candidates] of Object.entries(APP_CANDIDATES)) {
    const hit = candidates.find((candidate) => {
      try {
        return fsSync.existsSync(candidate.path)
      } catch {
        return false
      }
    })
    apps[id] = hit
      ? { id, installed: true, url: hit.url, path: hit.path, name: hit.name, bundle: path.basename(hit.path, '.app') }
      : { id, installed: false, url: '', path: '', name: SOURCE_META[id]?.appName || id, bundle: '' }
  }
  return apps
}

export const inject = ['webServer']

/* ----------------------------------------------------------------- config */

function envConfig() {
  const env = {}
  if (process.env.NOTION_TOKEN) env.notion = { token: process.env.NOTION_TOKEN }
  if (process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET) {
    env.feishu = {
      appId: process.env.FEISHU_APP_ID,
      appSecret: process.env.FEISHU_APP_SECRET,
      ...(process.env.FEISHU_BASE_URL ? { baseUrl: process.env.FEISHU_BASE_URL } : {}),
    }
  }
  if (process.env.DIDA_TOKEN) env.dida = { token: process.env.DIDA_TOKEN }
  if (process.env.OBSIDIAN_VAULT) env.obsidian = { vaults: process.env.OBSIDIAN_VAULT.split(path.delimiter).filter(Boolean) }
  return env
}

function defaultConfig() {
  const vaults = defaultVaults()
  return {
    obsidian: { vaults },
    notion: { token: '' },
    feishu: { appId: '', appSecret: '', baseUrl: 'https://feishu.cn', userAuth: null, onlyMine: true, wikiSpace: '' },
    dida: { token: '' },
    refreshMinutes: 5,
    demoFill: true,
  }
}

function mergeConfig(base, patch) {
  const next = {
    ...base,
    ...patch,
    obsidian: { ...base.obsidian, ...(patch.obsidian || {}) },
    notion: { ...base.notion, ...(patch.notion || {}) },
    feishu: { ...base.feishu, ...(patch.feishu || {}) },
    dida: { ...base.dida, ...(patch.dida || {}) },
  }
  return next
}

let cachedConfig = null

export async function loadConfig() {
  if (cachedConfig) return cachedConfig
  let fileConfig = {}
  try {
    fileConfig = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'))
  } catch {
    fileConfig = {}
  }
  const defaults = defaultConfig()
  const env = envConfig()
  const merged = mergeConfig(mergeConfig(defaults, fileConfig), env)
  if (!Array.isArray(merged.obsidian.vaults) || !merged.obsidian.vaults.length) {
    merged.obsidian.vaults = defaultVaults()
  }
  cachedConfig = merged
  return merged
}

export async function saveConfig(patch) {
  const base = await loadConfig()
  const clean = JSON.parse(JSON.stringify(patch || {}))
  // A masked placeholder, an empty string or `undefined` means "keep the saved value".
  const keep = (value) => value === undefined || value === null || value === '' || /^[•*]+/.test(String(value))
  for (const src of ['notion', 'dida']) {
    if (!clean[src]) continue
    if (clean[src].token === null) clean[src].token = ''
    else if (keep(clean[src].token)) delete clean[src].token
  }
  if (clean.feishu) {
    if (clean.feishu.appSecret === null) clean.feishu.appSecret = ''
    else if (keep(clean.feishu.appSecret)) delete clean.feishu.appSecret
  }
  if (typeof clean.refreshMinutes === 'number') clean.refreshMinutes = Math.min(120, Math.max(1, Math.round(clean.refreshMinutes)))
  const next = mergeConfig(base, clean)
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), { mode: 0o600 })
  cachedConfig = next
  return next
}

function mask(value) {
  const text = String(value || '')
  if (!text) return ''
  const tail = text.length > 4 ? text.slice(-4) : ''
  return `••••••••${tail}`
}

function publicConfig(config) {
  return {
    obsidian: { vaults: config.obsidian.vaults || [] },
    notion: { token: mask(config.notion.token), configured: Boolean(config.notion.token) },
    feishu: {
      appId: config.feishu.appId || '',
      appSecret: mask(config.feishu.appSecret),
      baseUrl: config.feishu.baseUrl || 'https://feishu.cn',
      configured: Boolean(config.feishu.appId && config.feishu.appSecret),
      authorized: Boolean(config.feishu.userAuth?.accessToken || config.feishu.userAuth?.refreshToken),
      userName: config.feishu.userAuth?.name || '',
      onlyMine: config.feishu.onlyMine !== false,
      wikiSpace: config.feishu.wikiSpace || '',
      redirectUri: FEISHU_REDIRECT_URI,
    },
    dida: { token: mask(config.dida.token), configured: Boolean(config.dida.token) },
    refreshMinutes: config.refreshMinutes || 5,
    demoFill: config.demoFill !== false,
    dataDir: DATA_DIR,
  }
}

/* --------------------------------------------------------------- snapshot */

let snapshot = null
let snapshotAt = 0
let inflight = null
const lastGood = { obsidian: null, notion: null, feishu: null }
const contentCache = new Map()
const demoCompleted = new Set()
const demoAdded = []

function localDay(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - day)
  return x
}

function computeStats(docs, todos, sourceEntries) {
  const now = new Date()
  const today = localDay(now)
  const weekStart = startOfWeek(now)
  const weekEnd = new Date(weekStart.getTime() + 6 * 864e5)
  const monthAgo = now.getTime() - 30 * 864e5
  const weekAgo = now.getTime() - 7 * 864e5
  const prevWeekAgo = weekAgo - 7 * 864e5

  let totalWords = 0
  let stale = 0
  let weekUpdates = 0
  let prevWeekUpdates = 0
  let monthUpdates = 0
  const tagMap = new Map()
  const folderMap = new Map()
  const weekly = []
  const dailyMap = new Map()

  for (let i = 0; i < 84; i += 1) {
    const d = new Date(startOfDay(now).getTime() - i * 864e5)
    dailyMap.set(localDay(d), 0)
  }

  for (const doc of docs) {
    totalWords += Number(doc.words) || 0
    const updated = new Date(doc.updatedAt)
    const ms = updated.getTime()
    if (Number.isFinite(ms)) {
      if (ms >= monthAgo) monthUpdates += 1
      if (ms >= weekAgo) weekUpdates += 1
      else if (ms >= prevWeekAgo) prevWeekUpdates += 1
      if (ms < now.getTime() - 90 * 864e5) stale += 1
      const key = localDay(updated)
      if (dailyMap.has(key)) dailyMap.set(key, dailyMap.get(key) + 1)
    }
    for (const tag of doc.tags || []) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    }
    const fkey = `${doc.source}::${doc.folder}`
    const folder = folderMap.get(fkey) || { source: doc.source, path: doc.folder, count: 0, words: 0 }
    folder.count += 1
    folder.words += Number(doc.words) || 0
    folderMap.set(fkey, folder)
  }

  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(weekStart.getTime() - i * 7 * 864e5)
    const end = new Date(start.getTime() + 7 * 864e5)
    const bySource = { obsidian: 0, notion: 0, feishu: 0 }
    let count = 0
    for (const doc of docs) {
      const ms = new Date(doc.updatedAt).getTime()
      if (ms >= start.getTime() && ms < end.getTime()) {
        count += 1
        bySource[doc.source] = (bySource[doc.source] || 0) + 1
      }
    }
    weekly.push({
      start: localDay(start),
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      count,
      bySource,
    })
  }

  const openTodos = todos.filter((t) => !t.completed)
  const todo = {
    open: openTodos.length,
    today: openTodos.filter((t) => t.dueDay === today).length,
    overdue: openTodos.filter((t) => t.dueDay && t.dueDay < today).length,
    week: openTodos.filter((t) => t.dueDay && t.dueDay > today && t.dueDay <= localDay(weekEnd)).length,
    later: openTodos.filter((t) => !t.dueDay || t.dueDay > localDay(weekEnd)).length,
    done7d: todos.filter((t) => t.completed && t.completedTime && new Date(t.completedTime).getTime() >= weekAgo).length,
    projects: [],
  }
  const projectMap = new Map()
  for (const task of todos) {
    const entry = projectMap.get(task.projectId) || {
      id: task.projectId,
      name: task.projectName,
      color: task.projectColor,
      open: 0,
      total: 0,
    }
    entry.total += 1
    if (!task.completed) entry.open += 1
    projectMap.set(task.projectId, entry)
  }
  todo.projects = [...projectMap.values()].sort((a, b) => b.open - a.open)

  const sources = sourceEntries.map((entry) => {
    const entries = docs.filter((d) => d.source === entry.id)
    const words = entries.reduce((sum, d) => sum + (Number(d.words) || 0), 0)
    const folders = new Set(entries.map((d) => d.folder)).size
    const last = entries.reduce((max, d) => (String(d.updatedAt) > max ? String(d.updatedAt) : max), '')
    return {
      ...entry,
      count: entries.length,
      words,
      folders,
      lastUpdated: last || null,
    }
  })

  return {
    totalDocs: docs.length,
    totalWords,
    weekUpdates,
    prevWeekUpdates,
    monthUpdates,
    stale,
    avgWords: docs.length ? Math.round(totalWords / docs.length) : 0,
    tags: [...tagMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 18),
    folders: [...folderMap.values()].sort((a, b) => b.count - a.count || b.words - a.words).slice(0, 40),
    weekly,
    daily: [...dailyMap.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day)),
    todo,
    sources,
    today,
    weekStart: localDay(weekStart),
    weekEnd: localDay(weekEnd),
  }
}

function publicDoc(doc) {
  const { _ref, ...rest } = doc
  return rest
}

async function buildSnapshot() {
  const config = await loadConfig()
  const configured = {
    obsidian: Boolean(config.obsidian.vaults && config.obsidian.vaults.length),
    notion: Boolean(config.notion.token),
    feishu: Boolean(config.feishu.appId && config.feishu.appSecret),
  }
  const state = { obsidian: { docs: [], warnings: [], error: '' }, notion: { docs: [], warnings: [], error: '' }, feishu: { docs: [], warnings: [], error: '' } }
  let dida = { todos: [], projects: [], warnings: [], error: '' }

  const jobs = [
    (async () => {
      if (!configured.obsidian) return
      try {
        const result = await syncObsidian(config.obsidian)
        state.obsidian.docs = result.docs
        state.obsidian.warnings = result.warnings || []
        lastGood.obsidian = result.docs
      } catch (e) {
        state.obsidian.error = e.message
      }
    })(),
    (async () => {
      if (!configured.notion) return
      try {
        const result = await syncNotion(config.notion)
        state.notion.docs = result.docs
        state.notion.warnings = result.warnings || []
        lastGood.notion = result.docs
      } catch (e) {
        state.notion.error = e.message
      }
    })(),
    (async () => {
      if (!configured.feishu) return
      try {
        const beforeAuth = JSON.stringify(config.feishu.userAuth || null)
        const beforeBase = config.feishu.baseUrl
        const result = await syncFeishu(config.feishu)
        state.feishu.docs = result.docs
        state.feishu.warnings = result.warnings || []
        lastGood.feishu = result.docs
        if (JSON.stringify(config.feishu.userAuth || null) !== beforeAuth) {
          await saveConfig({ feishu: { userAuth: config.feishu.userAuth } })
        }
        if (config.feishu.baseUrl !== beforeBase) {
          await saveConfig({ feishu: { baseUrl: config.feishu.baseUrl } })
        }
      } catch (e) {
        state.feishu.error = e.message
      }
    })(),
    (async () => {
      if (!config.dida.token) return
      try {
        const result = await syncDida(config.dida)
        dida.todos = result.todos
        dida.projects = result.projects || []
        dida.warnings = result.warnings || []
      } catch (e) {
        dida.error = e.message
      }
    })(),
  ]
  await Promise.allSettled(jobs)

  const docs = []
  const sources = []
  const apps = detectApps()
  for (const id of ['obsidian', 'notion', 'feishu']) {
    const meta = SOURCE_META[id]
    const entry = {
      ...meta,
      id,
      configured: configured[id],
      appUrl: '',
      state: 'off',
      error: '',
      warnings: [],
      stale: false,
      appUrl: apps[id]?.installed ? apps[id].url : '',
      home:
        id === 'obsidian'
          ? (config.obsidian.vaults || []).join('、')
          : id === 'notion'
            ? 'notion.so'
            : String(config.feishu.baseUrl || 'feishu.cn'),
    }
    if (configured[id]) {
      const item = state[id]
      if (item.error) {
        entry.state = 'error'
        entry.error = item.error
        if (lastGood[id] && lastGood[id].length) {
          entry.stale = true
          docs.push(...lastGood[id])
        }
      } else {
        entry.state = 'live'
        docs.push(...item.docs)
        entry.warnings = item.warnings || []
      }
    } else if (config.demoFill) {
      entry.state = 'demo'
      docs.push(...getDemoDocuments().filter((d) => d.source === id))
    }
    sources.push(entry)
  }

  // Demo todos for the task column when Dida is not connected.
  let todos = dida.todos
  let todoSource = {
    state: config.dida.token ? (dida.error ? 'error' : 'live') : 'demo',
    configured: Boolean(config.dida.token),
    error: dida.error || '',
    warnings: dida.warnings || [],
    projects: dida.projects || [],
    home: 'dida365.com',
    appUrl: apps.dida?.installed ? apps.dida.url : '',
  }
  if (!config.dida.token && config.demoFill) {
    todos = getDemoTodos()
  } else if (!config.dida.token) {
    todos = []
  }
  if ((!config.dida.token || todoSource.state !== 'live') && demoCompleted.size) {
    todos = todos.map((t) => (demoCompleted.has(t.id) ? { ...t, completed: true, completedTime: new Date().toISOString() } : t))
  }
  todos = [...demoAdded, ...todos]

  docs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  const limited = docs.slice(0, MAX_DOCS)
  const stats = computeStats(limited, todos, sources)
  const mode = !configured.obsidian && !configured.notion && !configured.feishu ? 'demo' : sources.every((s) => s.state === 'live') ? 'live' : 'mixed'

  const docIndex = new Map()
  for (const doc of docs) docIndex.set(doc.id, doc)

  return {
    generatedAt: new Date().toISOString(),
    mode,
    demo: mode === 'demo',
    sources: stats.sources,
    todoSource,
    stats,
    documents: limited,
    todos: todos.slice(0, 400),
    apps,
    config: publicConfig(config),
    docIndex,
  }
}

async function persistSnapshot(snap) {
  try {
    const { docIndex, ...rest } = snap
    await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 })
    await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(rest), { mode: 0o600 })
  } catch {
    /* cache is best effort */
  }
}

function restoreSnapshotSync() {
  try {
    const parsed = JSON.parse(fsSync.readFileSync(SNAPSHOT_FILE, 'utf8'))
    if (!parsed?.generatedAt || !Array.isArray(parsed.documents)) return
    const age = Date.now() - new Date(parsed.generatedAt).getTime()
    if (!(age >= 0 && age < 3 * 864e5)) return
    const docIndex = new Map(parsed.documents.map((doc) => [doc.id, doc]))
    snapshot = { ...parsed, docIndex }
    snapshotAt = new Date(parsed.generatedAt).getTime()
  } catch {
    /* no cache yet */
  }
}

function startRefresh() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const next = await buildSnapshot()
      snapshot = next
      snapshotAt = Date.now()
      await persistSnapshot(next)
      return next
    } finally {
      inflight = null
    }
  })()
  return inflight
}

async function ensureSnapshot(force = false) {
  const config = await loadConfig()
  const ttl = Math.max(1, Number(config.refreshMinutes) || 5) * 60 * 1000
  if (!force) {
    if (!snapshot) return startRefresh()
    if (Date.now() - snapshotAt <= ttl) return snapshot
    // Serve the last snapshot immediately and refresh in the background.
    startRefresh().catch(() => {})
    return snapshot
  }
  return startRefresh()
}

function publicSnapshot(snap) {
  const { docIndex, ...rest } = snap
  return { ...rest, documents: (rest.documents || []).map(publicDoc), refreshing: Boolean(inflight) }
}

function recomputeSnapshotStats() {
  if (!snapshot) return
  snapshot.stats = computeStats(snapshot.documents, snapshot.todos, snapshot.sources)
  snapshot.generatedAt = new Date().toISOString()
}

/* ---------------------------------------------------------------- content */

async function readDocContent(id) {
  if (!snapshot) await ensureSnapshot()
  const doc = snapshot?.docIndex.get(id)
  if (!doc) throw new Error('文档不存在或快照已刷新，请重试')
  const cached = contentCache.get(id)
  if (cached && Date.now() - cached.at < CONTENT_TTL) return cached

  const config = await loadConfig()
  let content = ''
  let format = 'markdown'
  let error = ''
  try {
    if (doc.demo) {
      content = getDemoContent(doc)
    } else if (doc.source === 'obsidian') {
      const raw = await fs.readFile(doc._ref.abs, 'utf8')
      content = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    } else if (doc.source === 'notion') {
      if (!doc.previewable) throw new Error('Notion 数据库不支持内置预览，请点击“打开 Notion”。')
      content = await loadNotionContent(doc._ref.pageId, config.notion.token)
      format = 'markdown'
    } else if (doc.source === 'feishu') {
      if (!doc.previewable) throw new Error('该飞书文档类型暂不支持内置预览，请点击“打开飞书”。')
      content = await loadFeishuContent(doc._ref.token, config.feishu)
      format = 'text'
    }
  } catch (e) {
    error = e.message
  }
  const result = { at: Date.now(), content, format, error, title: doc.title, source: doc.source, url: doc.url, previewable: doc.previewable }
  contentCache.set(id, result)
  return result
}

/* ----------------------------------------------------------- oauth server */

const oauthStates = new Map()
let oauthServer = null
let oauthServerError = ''

function pruneOAuthStates() {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [key, ts] of oauthStates) if (ts < cutoff) oauthStates.delete(key)
}

function startOAuthServer() {
  if (oauthServer) return
  oauthServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    if (url.pathname === '/knowledge-board/oauth/start') {
      try {
        const config = await loadConfig()
        if (!config.feishu.appId || !config.feishu.appSecret) throw new Error('请先填写飞书 App ID / App Secret')
        const state = crypto.randomBytes(16).toString('hex')
        oauthStates.set(state, Date.now())
        pruneOAuthStates()
        res.writeHead(302, { Location: feishuAuthorizeUrl(config.feishu, state) })
        res.end()
      } catch (e) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
        res.end(String(e.message || e))
      }
      return
    }
    if (url.pathname !== '/knowledge-board/oauth/callback') {
      res.writeHead(404)
      res.end('not found')
      return
    }
    const state = url.searchParams.get('state') || ''
    const code = url.searchParams.get('code') || ''
    const error = url.searchParams.get('error') || ''
    const page = (title, detail, ok) =>
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title>` +
      `<style>body{font-family:-apple-system,"PingFang SC",sans-serif;background:#0a0e17;color:#e8ecf4;display:grid;place-items:center;height:100vh;margin:0}` +
      `.card{max-width:560px;padding:28px 32px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#111726;line-height:1.7}` +
      `h1{font-size:18px;margin:0 0 10px;color:${ok ? '#34d399' : '#fb7185'}}p{font-size:13px;color:#98a2b6;margin:0}</style></head>` +
      `<body><div class="card"><h1>${title}</h1><p>${detail}</p></div></body></html>`
    try {
      if (error) throw new Error(`用户拒绝授权：${error}`)
      if (!code) throw new Error('缺少授权码 code')
      if (!oauthStates.has(state)) throw new Error('授权状态已失效，请回看板重新发起授权')
      oauthStates.delete(state)
      const config = await loadConfig()
      const token = await exchangeFeishuCode(config.feishu, code)
      const info = await fetchFeishuUserInfo(token.access_token)
      const userAuth = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token || '',
        expiresAt: Date.now() + Number(token.expires_in || 7200) * 1000,
        refreshExpiresAt: token.refresh_token_expires_in
          ? Date.now() + Number(token.refresh_token_expires_in) * 1000
          : 0,
        openId: info.open_id || '',
        name: info.name || '',
        scope: token.scope || '',
        authorizedAt: new Date().toISOString(),
      }
      await saveConfig({ feishu: { userAuth } })
      snapshot = null
      snapshotAt = 0
      try {
        fsSync.rmSync(SNAPSHOT_FILE, { force: true })
      } catch {
        /* ignore */
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(page('飞书授权成功', `已授权 ${userAuth.name || '你的飞书账号'}。可以关闭此页，回到知识看板点一次刷新；飞书将只同步「我的空间」里的文档。`, true))
    } catch (e) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(page('飞书授权失败', String(e.message || e), false))
    }
  })
  oauthServer.on('error', (e) => {
    oauthServerError = e.message
    oauthServer = null
  })
  oauthServer.listen(FEISHU_OAUTH_PORT, '127.0.0.1')
}

/* ----------------------------------------------------------------- routes */

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 512 * 1024) {
        reject(new Error('请求体过大'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('JSON 解析失败'))
      }
    })
    req.on('error', reject)
  })
}

async function handleRoute(ctx, req, res) {
  const url = new URL(req.url || '/', 'http://kb.local')
  const route = url.pathname.slice(ROUTE_BASE.length).replace(/^\/+/, '')
  try {
    if (req.method === 'GET' && (route === 'overview' || route === '')) {
      const force = url.searchParams.get('refresh') === '1'
      const snap = await ensureSnapshot(force)
      return json(res, 200, { ok: true, ...publicSnapshot(snap) })
    }
    if (req.method === 'POST' && route === 'refresh') {
      const snap = await ensureSnapshot(true)
      return json(res, 200, { ok: true, ...publicSnapshot(snap) })
    }
    if (req.method === 'GET' && route === 'doc') {
      const id = url.searchParams.get('id') || ''
      const data = await readDocContent(id)
      return json(res, 200, { ok: !data.error, id, ...data })
    }
    if (req.method === 'GET' && route === 'config') {
      const config = await loadConfig()
      return json(res, 200, { ok: true, config: publicConfig(config) })
    }
    if (req.method === 'POST' && route === 'config') {
      const patch = await readBody(req)
      const config = await saveConfig(patch)
      snapshot = null
      snapshotAt = 0
      contentCache.clear()
      try {
        fsSync.rmSync(SNAPSHOT_FILE, { force: true })
      } catch {
        /* ignore */
      }
      const snap = await ensureSnapshot(true)
      return json(res, 200, { ok: true, config: publicConfig(config), mode: snap.mode })
    }
    if (req.method === 'POST' && route === 'open-app') {
      const body = await readBody(req)
      const app = await openApp(String(body.source || ''))
      return json(res, 200, { ok: true, app })
    }
    if (req.method === 'POST' && route === 'source/test') {
      const { source } = await readBody(req)
      const config = await loadConfig()
      if (source === 'obsidian') {
        const result = await syncObsidian(config.obsidian)
        return json(res, 200, { ok: true, count: result.docs.length, warnings: result.warnings })
      }
      if (source === 'notion') {
        const result = await syncNotion(config.notion)
        return json(res, 200, { ok: true, count: result.docs.length, warnings: result.warnings })
      }
      if (source === 'feishu') {
        const result = await syncFeishu(config.feishu)
        return json(res, 200, { ok: true, count: result.docs.length, warnings: result.warnings })
      }
      if (source === 'dida') {
        const result = await syncDida(config.dida)
        return json(res, 200, { ok: true, count: result.todos.length, warnings: result.warnings })
      }
      return json(res, 400, { ok: false, error: '未知来源' })
    }
    if (req.method === 'POST' && route === 'todo/complete') {
      const body = await readBody(req)
      const id = String(body.id || '')
      const completed = body.completed !== false
      const config = await loadConfig()
      if (id.startsWith('demo:')) {
        if (completed) demoCompleted.add(id)
        else demoCompleted.delete(id)
        const task = snapshot?.todos.find((t) => t.id === id)
        if (task) {
          task.completed = completed
          task.completedTime = completed ? new Date().toISOString() : null
          recomputeSnapshotStats()
        }
        return json(res, 200, { ok: true, demo: true, message: '演示任务已更新（仅本次会话）' })
      }
      if (!config.dida.token) return json(res, 400, { ok: false, error: '未连接滴答清单' })
      const task = snapshot?.todos.find((t) => t.id === id)
      const projectId = body.projectId || task?.projectId
      if (!projectId) return json(res, 400, { ok: false, error: '缺少 projectId' })
      await completeDidaTask(config.dida.token, id.replace(/^dida:/, ''), projectId, completed)
      snapshotAt = 0
      snapshot = null
      await ensureSnapshot(true)
      return json(res, 200, { ok: true, message: completed ? '已在滴答清单中完成' : '已恢复为未完成' })
    }
    if (req.method === 'POST' && route === 'todo/create') {
      const body = await readBody(req)
      const title = String(body.title || '').trim()
      if (!title) return json(res, 400, { ok: false, error: '请输入任务标题' })
      const config = await loadConfig()
      const demo = !config.dida.token
      if (demo) {
        const project = getDemoProjects().find((p) => p.id === body.projectId) || getDemoProjects()[0]
        const newTask = {
          id: `demo:new:${Date.now()}`,
          title,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          dueDay: body.dueDay || null,
          dueTime: '',
          priority: Number(body.priority) || 0,
          completed: false,
          completedTime: null,
          tags: [],
          url: '',
          demo: true,
        }
        demoAdded.unshift(newTask)
        if (snapshot) {
          snapshot.todos.unshift(newTask)
          recomputeSnapshotStats()
        }
        return json(res, 200, { ok: true, demo: true, message: '已加入演示清单（仅本次会话）' })
      }
      await createDidaTask(config.dida.token, {
        title,
        projectId: body.projectId,
        dueDay: body.dueDay,
        priority: Number(body.priority) || 0,
      })
      snapshot = null
      snapshotAt = 0
      await ensureSnapshot(true)
      return json(res, 200, { ok: true, message: '已加入滴答清单' })
    }
    if (req.method === 'GET' && route === 'feishu/oauth/check') {
      const config = await loadConfig()
      if (!config.feishu.appId) return json(res, 400, { ok: false, error: '请先填写 App ID' })
      try {
        const target = feishuAuthorizeUrl(config.feishu, 'probe')
        const probe = await fetch(target, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
        const text = await probe.text()
        const invalid = /20029|redirect_uri\s*请求不合法/.test(text)
        return json(res, 200, {
          ok: !invalid,
          registered: !invalid,
          message: invalid
            ? '飞书返回 20029：这个回调地址还没有登记。请在开发者后台「安全设置 → 重定向 URL」添加后再测。'
            : '回调地址已通过飞书校验（授权页可以正常打开）。',
        })
      } catch (e) {
        return json(res, 500, { ok: false, error: e.message })
      }
    }
    if (req.method === 'GET' && route === 'feishu/oauth/start') {
      const config = await loadConfig()
      if (!config.feishu.appId || !config.feishu.appSecret) {
        return json(res, 400, { ok: false, error: '请先填写飞书 App ID 和 App Secret' })
      }
      startOAuthServer()
      const state = crypto.randomBytes(16).toString('hex')
      oauthStates.set(state, Date.now())
      pruneOAuthStates()
      res.writeHead(302, { Location: feishuAuthorizeUrl(config.feishu, state) })
      res.end()
      return
    }
    if (req.method === 'POST' && route === 'feishu/oauth/logout') {
      await saveConfig({ feishu: { userAuth: null } })
      snapshot = null
      snapshotAt = 0
      try {
        fsSync.rmSync(SNAPSHOT_FILE, { force: true })
      } catch {
        /* ignore */
      }
      return json(res, 200, { ok: true })
    }
    if (req.method === 'GET' && route === 'health') {
      return json(res, 200, {
        ok: true,
        dataDir: DATA_DIR,
        hasSnapshot: Boolean(snapshot),
        generatedAt: snapshot?.generatedAt || null,
        mode: snapshot?.mode || null,
      })
    }
    return json(res, 404, { ok: false, error: 'not found' })
  } catch (e) {
    return json(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}

/* ------------------------------------------------------------------- tool */

const TOOL = {
  name: 'knowledge_board',
  description:
    'Knowledge OS bridge. Read the user\'s personal knowledge dashboard: document stats across Obsidian / Notion / Feishu, search documents, list Dida365 tasks, or refresh all sources. Use it whenever the user asks about their notes, docs, knowledge base, folders, or todo list.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      action: {
        type: 'string',
        enum: ['overview', 'search', 'docs', 'todos', 'refresh'],
        description: 'overview = stats summary; search = find documents by title/tag; docs = recent documents; todos = task list; refresh = re-sync sources.',
      },
      query: { type: 'string', description: 'search: keyword matched against title, tags and excerpt.' },
      source: { type: 'string', enum: ['obsidian', 'notion', 'feishu'], description: 'docs: filter by source.' },
      scope: { type: 'string', enum: ['today', 'overdue', 'week', 'open'], description: 'todos: which slice to list (default open).' },
      limit: { type: 'number', description: 'docs/search/todos: max rows, default 10, max 50.' },
    },
    required: ['action'],
  },
  output: {
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        ok: { type: 'boolean' },
        action: { type: 'string' },
        markdown: { type: 'string' },
        count: { type: 'number' },
      },
    },
    render: (_args, value) => [{ type: 'text', text: String(value?.markdown || '') }],
  },
  async execute(args) {
    const action = String(args?.action || 'overview')
    const limit = Math.min(50, Math.max(1, Number(args?.limit) || 10))
    if (action === 'refresh') await ensureSnapshot(true)
    const snap = await ensureSnapshot(action === 'refresh')
    const s = snap.stats
    const sourceLine = snap.sources
      .map((x) => `- ${x.name}: ${x.count} 篇 · ${(x.words / 1000).toFixed(1)}k 字 · ${x.state}${x.error ? ` · 错误：${x.error}` : ''}`)
      .join('\n')

    if (action === 'overview') {
      const md = [
        `# 知识概览（${new Date(snap.generatedAt).toLocaleString('zh-CN')}）`,
        `- 文档总数：${s.totalDocs}，总字数：${s.totalWords.toLocaleString('en-US')}`,
        `- 最近 7 天更新：${s.weekUpdates} 篇；最近 30 天：${s.monthUpdates} 篇`,
        `- 待办：${s.todo.open} 个未完成，今日 ${s.todo.today}，逾期 ${s.todo.overdue}，本周完成 ${s.todo.done7d}`,
        '',
        '## 来源',
        sourceLine,
        '',
        '## 高频标签',
        s.tags.slice(0, 10).map((t) => `#${t.name}(${t.count})`).join(' '),
        '',
        '## 最近更新',
        ...snap.documents.slice(0, 8).map((d) => `- [${d.title}](${d.url || '#'}) · ${d.path} · ${String(d.updatedAt).slice(0, 10)}`),
      ].join('\n')
      return { ok: true, action, markdown: md, count: s.totalDocs }
    }

    if (action === 'search') {
      const q = String(args?.query || '').trim().toLowerCase()
      if (!q) throw new Error('search 需要 query')
      const hits = snap.documents
        .filter((d) => `${d.title} ${(d.tags || []).join(' ')} ${d.excerpt} ${d.path}`.toLowerCase().includes(q))
        .slice(0, limit)
      const md = hits.length
        ? [`# 搜索结果：${q}（${hits.length}）`, ...hits.map((d) => `- [${d.title}](${d.url || '#'}) · ${d.source} · ${d.path} · ${String(d.updatedAt).slice(0, 10)}`)] .join('\n')
        : `没有找到与「${q}」相关的文档。`
      return { ok: true, action, markdown: md, count: hits.length }
    }

    if (action === 'docs') {
      const rows = snap.documents.filter((d) => (args?.source ? d.source === args.source : true)).slice(0, limit)
      const md = [`# 最近文档（${rows.length}）`, ...rows.map((d) => `- [${d.title}](${d.url || '#'}) · ${d.source} · ${d.path} · ${String(d.updatedAt).slice(0, 10)}`)] .join('\n')
      return { ok: true, action, markdown: md, count: rows.length }
    }

    if (action === 'todos') {
      const today = s.today
      const scope = String(args?.scope || 'open')
      let rows = snap.todos.filter((t) => !t.completed)
      if (scope === 'today') rows = rows.filter((t) => t.dueDay === today)
      if (scope === 'overdue') rows = rows.filter((t) => t.dueDay && t.dueDay < today)
      if (scope === 'week') rows = rows.filter((t) => t.dueDay && t.dueDay > today && t.dueDay <= s.weekEnd)
      rows = rows.slice(0, limit)
      const md = [
        `# 待办 · ${scope}（${rows.length}）`,
        ...rows.map((t) => `- [ ] ${t.title} · ${t.projectName}${t.dueDay ? ` · ${t.dueDay}${t.dueTime ? ' ' + t.dueTime : ''}` : ''}${t.priority >= 5 ? ' · 高优先级' : ''}`),
      ].join('\n')
      return { ok: true, action, markdown: md, count: rows.length }
    }

    throw new Error(`knowledge_board: unknown action "${action}"`)
  },
}

/* ------------------------------------------------------------------- boot */

export function apply(ctx) {
  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_BASE,
      handler: (req, res) => handleRoute(ctx, req, res),
    }),
  )

  const tools = ctx.get('tools')
  if (tools) {
    ctx.effect(() =>
      tools.register({
        ...TOOL,
        presentCall: (args) => ({
          card: 'generic',
          title:
            args?.action === 'search'
              ? `Search knowledge: ${args?.query || ''}`
              : args?.action === 'todos'
                ? 'Read Dida365 tasks'
                : args?.action === 'refresh'
                  ? 'Refresh knowledge board'
                  : 'Read knowledge overview',
          kind: 'other',
        }),
      }),
    )
  }

  // Restore the last snapshot from disk so the panel renders instantly, then
  // refresh in the background when it is older than the configured TTL.
  restoreSnapshotSync()
  startOAuthServer()
  ctx.effect(() => {
    ensureSnapshot(false).catch(() => {})
    return () => {
      if (oauthServer) {
        try {
          oauthServer.close()
        } catch {
          /* ignore */
        }
        oauthServer = null
      }
    }
  })

  // Make sure the data directory is private.
  try {
    fsSync.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 })
  } catch {
    /* best effort */
  }
}
