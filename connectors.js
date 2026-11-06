/**
 * Source connectors for Knowledge OS.
 *
 * Every connector returns the same document shape so the host can merge,
 * aggregate and serve them without caring where they came from:
 *
 *   { id, source, title, folder, path, url, updatedAt, createdAt, words,
 *     chars, tags, excerpt, type, typeLabel, links, previewable, demo, _ref }
 *
 * `_ref` is the connector-private locator (absolute path, Notion page id,
 * Feishu document token) and is stripped before anything reaches the browser.
 */
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

export const SOURCE_META = {
  obsidian: { id: 'obsidian', name: 'Obsidian', appName: 'Obsidian', color: '#a78bfa', kind: 'local' },
  notion: { id: 'notion', name: 'Notion', appName: 'Notion', color: '#9ca3af', kind: 'cloud' },
  feishu: { id: 'feishu', name: '飞书文档', appName: '飞书', color: '#3370ff', kind: 'cloud' },
}

const NOTION_VERSION = '2022-06-28'
const SKIP_DIRS = new Set(['.obsidian', '.trash', '.git', 'node_modules', '.DS_Store', 'venv', '__pycache__'])
const MAX_FILES = 3000
const MAX_MD_BYTES = 1024 * 1024

/** Parsed-note cache keyed by absolute path; refresh only re-reads changed files. */
const noteCache = new Map()

/* ------------------------------------------------------------------ utils */

export function hashId(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 12)
}

export function countWords(text) {
  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length
  const latin = (text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, ' ').match(/[A-Za-z0-9_][A-Za-z0-9_'’-]*/g) || []).length
  return cjk + latin
}

export function stripMarkdown(md) {
  return String(md)
    .replace(/---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseFrontmatter(raw) {
  const meta = {}
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!m) return { meta, body: raw }
  const block = m[1]
  let currentKey = ''
  for (const line of block.split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_\u4e00-\u9fa5-]+)\s*:\s*(.*)$/.exec(line)
    if (kv) {
      currentKey = kv[1].trim()
      let value = kv[2].trim()
      if (!value) {
        meta[currentKey] = []
        continue
      }
      value = value.replace(/^["']|["']$/g, '')
      if (value.startsWith('[') && value.endsWith(']')) {
        meta[currentKey] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean)
      } else {
        meta[currentKey] = value
      }
      continue
    }
    const item = /^\s*-\s+(.*)$/.exec(line)
    if (item && currentKey) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = meta[currentKey] ? [meta[currentKey]] : []
      meta[currentKey].push(item[1].trim().replace(/^["']|["']$/g, ''))
    }
  }
  return { meta, body: raw.slice(m[0].length) }
}

export function normalizeIso(value, fallback) {
  if (!value) return fallback
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d.toISOString() : fallback
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) })
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    const detail = body?.message || body?.msg || body?.error || text.slice(0, 200) || res.statusText
    throw new Error(`HTTP ${res.status}: ${detail}`)
  }
  return body
}

function tagList(value) {
  if (!value) return []
  const arr = Array.isArray(value) ? value : String(value).split(/[,，;；\s]+/)
  return [...new Set(arr.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean))].slice(0, 24)
}

/* --------------------------------------------------------------- obsidian */

export function readRegisteredVaults() {
  const out = []
  try {
    const file = path.join(os.homedir(), 'Library', 'Application Support', 'obsidian', 'obsidian.json')
    const data = JSON.parse(fsSync.readFileSync(file, 'utf8'))
    for (const value of Object.values(data.vaults || {})) {
      if (value && typeof value.path === 'string') out.push(value.path)
    }
  } catch {
    /* Obsidian may not be installed */
  }
  return out
}

function findVaultsUnder(root, depth, out, seen) {
  let real
  try {
    real = fsSync.realpathSync(root)
  } catch {
    return
  }
  if (seen.has(real)) return
  seen.add(real)
  let hasMarker = false
  try {
    hasMarker = fsSync.statSync(path.join(real, '.obsidian')).isDirectory()
  } catch {
    hasMarker = false
  }
  if (hasMarker) {
    out.add(real)
    return
  }
  if (depth <= 0) return
  let entries = []
  try {
    entries = fsSync.readdirSync(real, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'Library') continue
    findVaultsUnder(path.join(real, entry.name), depth - 1, out, seen)
  }
}

/**
 * Find real Obsidian vaults: every directory that owns a `.obsidian` marker.
 * This matters for iCloud, where the notes usually live one level below
 * `iCloud~md~obsidian/Documents` (e.g. Documents/ScientificResearch).
 */
export function defaultVaults() {
  const roots = [
    path.join(os.homedir(), 'Documents', 'Obsidian Vault'),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Obsidian'),
    path.join(os.homedir(), 'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents'),
  ]
  const found = new Set()
  const seen = new Set()
  for (const registered of readRegisteredVaults()) {
    try {
      if (fsSync.statSync(registered).isDirectory()) found.add(fsSync.realpathSync(registered))
    } catch {
      /* ignore stale registry entries */
    }
  }
  for (const root of roots) findVaultsUnder(root, 2, found, seen)
  return [...found]
}

async function walkMarkdown(root, out, state) {
  let entries
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (state.files >= MAX_FILES) return
    if (entry.name.startsWith('.') && entry.name !== '.md') continue
    if (SKIP_DIRS.has(entry.name)) continue
    const abs = path.join(root, entry.name)
    if (entry.isDirectory()) {
      await walkMarkdown(abs, out, state)
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (!['.md', '.markdown'].includes(ext)) continue
    state.files += 1
    out.push(abs)
  }
}

function isRegisteredVault(vault) {
  try {
    const real = fsSync.realpathSync(vault)
    return readRegisteredVaults().some((item) => {
      try {
        return fsSync.realpathSync(item) === real
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

export async function syncObsidian(config = {}) {
  const vaults = (Array.isArray(config.vaults) && config.vaults.length ? config.vaults : defaultVaults()).filter(Boolean)
  if (!vaults.length) {
    throw new Error('未找到 Obsidian 库，请在设置里填写 Vault 路径')
  }
  const docs = []
  const warnings = []
  for (const vault of vaults) {
    if (!isRegisteredVault(vault)) {
      warnings.push(`库「${path.basename(vault)}」尚未在 Obsidian 中注册；深链会尝试用绝对路径打开，建议在 Obsidian 中「打开文件夹作为库」。`)
    }
    let stat
    try {
      stat = await fs.stat(vault)
    } catch {
      warnings.push(`路径不存在：${vault}`)
      continue
    }
    if (!stat.isDirectory()) {
      warnings.push(`不是目录：${vault}`)
      continue
    }
    const vaultName = path.basename(vault)
    const files = []
    await walkMarkdown(vault, files, { files: 0 })
    for (const abs of files) {
      try {
        const fstat = await fs.stat(abs)
        if (fstat.size > MAX_MD_BYTES) continue
        const cachedNote = noteCache.get(abs)
        if (cachedNote && cachedNote.mtimeMs === fstat.mtimeMs && cachedNote.size === fstat.size) {
          docs.push({ ...cachedNote.doc })
          continue
        }
        const raw = await fs.readFile(abs, 'utf8')
        const rel = path.relative(vault, abs)
        const relNoExt = rel.replace(/\.(md|markdown)$/i, '')
        const { meta, body } = parseFrontmatter(raw)
        const h1 = /^#\s+(.+)$/m.exec(body)
        const title = String(meta.title || (h1 && h1[1].trim()) || path.basename(relNoExt))
        const inlineTags = body.match(/(^|\s)#([\u4e00-\u9fa5A-Za-z0-9_/-]{1,32})/g) || []
        const tags = [...new Set([...tagList(meta.tags || meta.tag), ...inlineTags.map((t) => t.trim().replace(/^#/, ''))])].slice(0, 20)
        const links = (body.match(/\[\[[^\]]+\]\]/g) || []).length
        const text = stripMarkdown(body)
        const folder = path.dirname(rel) === '.' ? '根目录' : path.dirname(rel).split(path.sep).join(' / ')
        const registered = isRegisteredVault(vault)
        const url = registered
          ? `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(relNoExt)}`
          : `obsidian://open?path=${encodeURIComponent(abs)}`
        const doc = {
          id: `obsidian:${hashId(vault + '::' + rel)}`,
          source: 'obsidian',
          title,
          folder,
          path: `${vaultName} / ${folder}`,
          url,
          updatedAt: fstat.mtime.toISOString(),
          createdAt: fstat.birthtime && fstat.birthtime.getTime() > 0 ? fstat.birthtime.toISOString() : fstat.mtime.toISOString(),
          words: countWords(text),
          chars: text.length,
          tags,
          excerpt: text.slice(0, 160),
          type: 'markdown',
          typeLabel: 'Markdown',
          links,
          previewable: true,
          demo: false,
          vaultRegistered: registered,
          _ref: { abs, vault, rel },
        }
        noteCache.set(abs, { mtimeMs: fstat.mtimeMs, size: fstat.size, doc })
        if (noteCache.size > 6000) {
          const first = noteCache.keys().next().value
          if (first) noteCache.delete(first)
        }
        docs.push(doc)
      } catch {
        /* unreadable file: skip */
      }
    }
  }
  return { docs, warnings }
}

/* ----------------------------------------------------------------- notion */

function notionHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'content-type': 'application/json',
  }
}

function notionPlain(rich) {
  if (!Array.isArray(rich)) return ''
  return rich.map((r) => r?.plain_text ?? '').join('')
}

function notionTitle(page) {
  const props = page?.properties || {}
  for (const value of Object.values(props)) {
    if (value?.type === 'title') return notionPlain(value.title).trim()
    if (Array.isArray(value?.title) && value.title.length) return notionPlain(value.title).trim()
  }
  return '未命名页面'
}

function notionTags(page) {
  const props = page?.properties || {}
  const tags = []
  for (const [name, value] of Object.entries(props)) {
    if (!/tag|标签/i.test(name)) continue
    if (value?.type === 'multi_select') tags.push(...(value.multi_select || []).map((o) => o.name))
    if (value?.type === 'select' && value.select) tags.push(value.select.name)
  }
  return [...new Set(tags)].filter(Boolean).slice(0, 16)
}

const NOTION_PARENT_LABEL = {
  workspace: '工作空间',
  page_id: '子页面',
  database_id: '数据库条目',
  data_source_id: '数据源',
}

export async function syncNotion(config = {}) {
  const token = String(config.token || '').trim()
  if (!token) throw new Error('未配置 Notion Integration Token')
  const docs = []
  const warnings = []
  let cursor
  let pages = 0
  for (let page = 0; page < 4; page += 1) {
    const body = {
      page_size: 100,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      ...(cursor ? { start_cursor: cursor } : {}),
    }
    const data = await fetchJson('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: notionHeaders(token),
      body: JSON.stringify(body),
    })
    for (const item of data?.results || []) {
      if (item.object === 'database') {
        docs.push({
          id: `notion:${item.id}`,
          source: 'notion',
          title: notionPlain(item.title) || '未命名数据库',
          folder: '数据库',
          path: 'Notion / 数据库',
          url: item.url || '',
          updatedAt: normalizeIso(item.last_edited_time, new Date().toISOString()),
          createdAt: normalizeIso(item.created_time, new Date().toISOString()),
          words: 0,
          chars: 0,
          tags: [],
          excerpt: 'Notion 数据库，可在原应用中查看表格与视图。',
          type: 'database',
          typeLabel: 'Notion 数据库',
          links: 0,
          previewable: false,
          demo: false,
          _ref: { kind: 'database', pageId: item.id },
        })
        continue
      }
      if (item.object !== 'page' || item.archived) continue
      pages += 1
      const parentLabel = NOTION_PARENT_LABEL[item.parent?.type] || '页面'
      docs.push({
        id: `notion:${item.id}`,
        source: 'notion',
        title: notionTitle(item),
        folder: parentLabel,
        path: `Notion / ${parentLabel}`,
        url: item.url || '',
        updatedAt: normalizeIso(item.last_edited_time, new Date().toISOString()),
        createdAt: normalizeIso(item.created_time, new Date().toISOString()),
        words: 0,
        chars: 0,
        tags: notionTags(item),
        excerpt: item.icon?.emoji ? `${item.icon.emoji} Notion 页面` : 'Notion 页面',
        type: 'page',
        typeLabel: 'Notion 页面',
        links: 0,
        previewable: true,
        demo: false,
        _ref: { kind: 'page', pageId: item.id },
      })
    }
    if (!data?.has_more || !data?.next_cursor) break
    cursor = data.next_cursor
  }
  if (!pages) warnings.push('搜索到 0 个页面：请确认 Integration 已被添加到目标页面（页面右上角 ··· → 连接）。')
  return { docs, warnings }
}

export async function loadNotionContent(pageId, token) {
  const blocks = []
  let cursor
  for (let page = 0; page < 5; page += 1) {
    const qs = new URLSearchParams({ page_size: '100', ...(cursor ? { start_cursor: cursor } : {}) })
    const data = await fetchJson(`https://api.notion.com/v1/blocks/${encodeURIComponent(pageId)}/children?${qs}`, {
      headers: notionHeaders(token),
    })
    for (const block of data?.results || []) {
      const type = block.type
      const payload = block[type] || {}
      const text = notionPlain(payload.rich_text)
      if (type === 'heading_1') blocks.push(`# ${text}`)
      else if (type === 'heading_2') blocks.push(`## ${text}`)
      else if (type === 'heading_3') blocks.push(`### ${text}`)
      else if (type === 'bulleted_list_item') blocks.push(`- ${text}`)
      else if (type === 'numbered_list_item') blocks.push(`1. ${text}`)
      else if (type === 'to_do') blocks.push(`- [${payload.checked ? 'x' : ' '}] ${text}`)
      else if (type === 'quote') blocks.push(`> ${text}`)
      else if (type === 'code') blocks.push(`\`\`\`${payload.language || ''}\n${text}\n\`\`\``)
      else if (type === 'divider') blocks.push('---')
      else if (text) blocks.push(text)
    }
    if (!data?.has_more || !data?.next_cursor) break
    cursor = data.next_cursor
  }
  return blocks.join('\n\n') || '(这个页面还没有内容)'
}

/* ----------------------------------------------------------------- feishu */

function feishuBase(config) {
  let base = String(config.baseUrl || config.domain || 'https://feishu.cn').trim()
  if (!/^https?:\/\//i.test(base)) base = 'https://' + base
  try {
    // Accept a pasted document URL too: only the origin matters for links.
    base = new URL(base).origin
  } catch {
    base = base.replace(/\/+$/, '')
  }
  return base.replace(/\/+$/, '')
}

async function feishuToken(config) {
  const appId = String(config.appId || '').trim()
  const appSecret = String(config.appSecret || '').trim()
  if (!appId || !appSecret) throw new Error('未配置飞书 App ID / App Secret')
  const data = await fetchJson('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  })
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`飞书鉴权失败：${data.msg || data.code}`)
  }
  return data.tenant_access_token
}

async function feishuGet(url, token, timeoutMs = 15000) {
  const data = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } }, timeoutMs)
  if (data.code !== 0) {
    const hint = /permission|scope|权限/i.test(String(data.msg)) ? '（请在飞书开放平台为该应用开通云文档读取权限）' : ''
    throw new Error(`飞书 API：${data.msg || data.code}${hint}`)
  }
  return data.data || {}
}

function feishuTime(value) {
  if (!value) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return normalizeIso(value, null)
  const ms = num > 1e12 ? num : num * 1000
  return new Date(ms).toISOString()
}

const FEISHU_TYPE = {
  doc: 'docx',
  docx: 'docx',
  sheet: 'sheet',
  bitable: 'bitable',
  mindnote: 'mindnote',
  slides: 'slides',
  file: 'file',
}

const FEISHU_SEARCH_SEEDS = ['的', '我', '工', '会', '文', '表', '记', '项', '目', '报', '总', '待', '人', 'a']
const FEISHU_MAX_DOCS = 250
const FEISHU_SEARCH_CACHE_TTL = 20 * 60 * 1000
const feishuSearchCache = new Map()

const FEISHU_DOC_TYPE = {
  docx: { label: '飞书文档', path: 'docx' },
  doc: { label: '飞书旧版文档', path: 'docs' },
  sheet: { label: '飞书表格', path: 'sheets' },
  bitable: { label: '多维表格', path: 'base' },
  mindnote: { label: '思维笔记', path: 'mindnotes' },
  slides: { label: '飞书幻灯片', path: 'slides' },
  file: { label: '云文件', path: 'file' },
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function feishuUrl(base, type, token) {
  const info = FEISHU_DOC_TYPE[type] || FEISHU_DOC_TYPE.docx
  return `${base}/${info.path}/${token}`
}

async function searchFeishuDocs(base, token) {
  const key = hashId(token)
  const cached = feishuSearchCache.get(key)
  if (cached && Date.now() - cached.at < FEISHU_SEARCH_CACHE_TTL) return cached.items
  const map = new Map()
  for (const seed of FEISHU_SEARCH_SEEDS) {
    for (let page = 0; page < 2; page += 1) {
      let data
      try {
        data = await fetchJson('https://open.feishu.cn/open-apis/suite/docs-api/search/object', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ search_key: seed, count: 50, offset: page * 50 }),
        }, 15000)
      } catch {
        break
      }
      if (data.code !== 0) break
      const items = data.data?.docs_entities || []
      for (const item of items) {
        if (!item.docs_token || map.has(item.docs_token)) continue
        map.set(item.docs_token, {
          token: item.docs_token,
          type: FEISHU_DOC_TYPE[item.docs_type] ? item.docs_type : 'docx',
          title: item.title || '未命名文档',
          owner: item.owner_id || '',
        })
      }
      if (!data.data?.has_more || items.length < 50) break
      await sleep(60)
    }
  }
  const items = [...map.values()].slice(0, FEISHU_MAX_DOCS)
  const metas = new Map()
  for (let i = 0; i < items.length; i += 50) {
    const chunk = items.slice(i, i + 50)
    try {
      const data = await fetchJson('https://open.feishu.cn/open-apis/drive/v1/metas/batch_query', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ request_docs: chunk.map((item) => ({ doc_token: item.token, doc_type: item.type })), with_url: true }),
      }, 15000)
      if (data.code === 0) {
        for (const meta of data.data?.metas || []) {
          if (meta.doc_token) metas.set(meta.doc_token, meta)
        }
      }
    } catch {
      /* fall back to search-only metadata */
    }
    await sleep(60)
  }
  const enriched = items.map((item) => {
    const meta = metas.get(item.token)
    return {
      ...item,
      title: meta?.title || item.title,
      owner: meta?.owner_id || item.owner,
      url: meta?.url || '',
      createdAt: meta?.create_time ? new Date(Number(meta.create_time) * 1000).toISOString() : null,
      updatedAt: meta?.latest_modify_time ? new Date(Number(meta.latest_modify_time) * 1000).toISOString() : null,
    }
  })
  enriched.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const limited = enriched.slice(0, FEISHU_MAX_DOCS)
  feishuSearchCache.set(key, { at: Date.now(), items: limited })
  return limited
}

/* ------------------------------------------------------- feishu user OAuth */

export const FEISHU_OAUTH_PORT = 17890
export const FEISHU_REDIRECT_URI = `http://127.0.0.1:${FEISHU_OAUTH_PORT}/knowledge-board/oauth/callback`
const FEISHU_OAUTH_SCOPE = 'drive:drive docx:document:readonly wiki:wiki:readonly offline_access'

export function feishuAuthorizeUrl(config = {}, state = '') {
  const url = new URL('https://accounts.feishu.cn/open-apis/authen/v1/authorize')
  url.searchParams.set('client_id', String(config.appId || ''))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', FEISHU_REDIRECT_URI)
  url.searchParams.set('scope', FEISHU_OAUTH_SCOPE)
  if (state) url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'consent')
  return url.toString()
}

function feishuOAuthBody(config, extra) {
  return JSON.stringify({
    client_id: String(config.appId || ''),
    client_secret: String(config.appSecret || ''),
    ...extra,
  })
}

export async function exchangeFeishuCode(config, code) {
  const data = await fetchJson('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: feishuOAuthBody(config, { grant_type: 'authorization_code', code, redirect_uri: FEISHU_REDIRECT_URI }),
  }, 20000)
  if (data.code !== 0 || !data.access_token) {
    throw new Error(`飞书授权失败：${data.error_description || data.msg || data.code || 'unknown'}`)
  }
  return data
}

export async function refreshFeishuUserToken(config, refreshToken) {
  const data = await fetchJson('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: feishuOAuthBody(config, { grant_type: 'refresh_token', refresh_token: refreshToken }),
  }, 20000)
  if (data.code !== 0 || !data.access_token) throw new Error(`刷新飞书授权失败：${data.error_description || data.msg || data.code}`)
  return data
}

export async function fetchFeishuUserInfo(accessToken) {
  const data = await fetchJson('https://open.feishu.cn/open-apis/authen/v1/user_info', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 15000)
  if (data.code !== 0) throw new Error(`获取飞书用户信息失败：${data.msg || data.code}`)
  return data.data || {}
}

export async function feishuUserToken(config = {}) {
  const auth = config.userAuth
  if (!auth || !auth.accessToken) return ''
  if (Date.now() < Number(auth.expiresAt || 0) - 60 * 1000) return auth.accessToken
  if (!auth.refreshToken) return ''
  try {
    const data = await refreshFeishuUserToken(config, auth.refreshToken)
    auth.accessToken = data.access_token
    auth.expiresAt = Date.now() + Number(data.expires_in || 7200) * 1000
    if (data.refresh_token) auth.refreshToken = data.refresh_token
    auth.refreshExpiresAt = data.refresh_token_expires_in
      ? Date.now() + Number(data.refresh_token_expires_in) * 1000
      : auth.refreshExpiresAt
    return auth.accessToken
  } catch {
    return ''
  }
}

async function feishuUserGet(url, token) {
  const data = await fetchJson(url, { headers: { Authorization: `Bearer ${token}` } }, 15000)
  if (data.code !== 0) throw new Error(`飞书 API：${data.msg || data.code}`)
  return data.data || {}
}

async function syncFeishuUserDrive(config, token) {
  const docs = []
  const warnings = []
  const meta = await feishuUserGet('https://open.feishu.cn/open-apis/drive/explorer/v2/root_folder/meta', token)
  const rootToken = meta.token
  if (!rootToken) throw new Error('飞书未返回「我的空间」根目录')
  let count = 0
  async function walk(folderToken, folderPath, depth) {
    if (count >= 400 || depth > 4) return
    let data
    try {
      data = await feishuUserGet(
        `https://open.feishu.cn/open-apis/drive/v1/files?folder_token=${encodeURIComponent(folderToken)}&page_size=50`,
        token,
      )
    } catch (e) {
      warnings.push(`读取目录「${folderPath || '我的空间'}」失败：${e.message}`)
      return
    }
    for (const file of data.files || []) {
      if (file.trashed) continue
      if (file.type === 'folder') {
        await walk(file.token, folderPath ? `${folderPath} / ${file.name}` : file.name, depth + 1)
        continue
      }
      const type = FEISHU_TYPE[file.type] || file.type || 'docx'
      const info = FEISHU_DOC_TYPE[type] || FEISHU_DOC_TYPE.docx
      docs.push({
        id: `feishu:${file.token}`,
        source: 'feishu',
        title: file.name || '未命名文档',
        folder: folderPath || '我的空间',
        path: `飞书 / 我的空间${folderPath ? ' / ' + folderPath : ''}`,
        url: file.url || feishuUrl(feishuBase(config), type, file.token),
        updatedAt: feishuTime(file.modified_time) || new Date().toISOString(),
        createdAt: feishuTime(file.created_time) || new Date().toISOString(),
        words: 0,
        chars: 0,
        tags: [],
        excerpt: `${info.label} · 我的空间`,
        type,
        typeLabel: info.label,
        links: 0,
        previewable: type === 'docx',
        demo: false,
        _ref: { kind: type, token: file.token },
      })
      count += 1
      if (count >= 400) return
    }
  }
  await walk(rootToken, '', 0)
  // Personal drive URLs carry the real tenant origin (e.g. my.feishu.cn);
  // use it for wiki links and future fallbacks.
  const sampleUrl = docs.find((doc) => doc.url)?.url
  if (sampleUrl) {
    try {
      const origin = new URL(sampleUrl).origin
      if (origin && origin !== config.baseUrl) config.baseUrl = origin
    } catch {
      /* keep configured base */
    }
  }
  try {
    const wiki = await syncFeishuUserWiki(config, token)
    docs.push(...wiki.docs)
    warnings.push(...wiki.warnings)
  } catch (e) {
    warnings.push(`知识库读取失败：${e.message}`)
  }
  if (!docs.length) warnings.push('「我的空间」和知识库里都没有读到文档；请确认已授权并开通 drive:drive / wiki:wiki:readonly 权限。')
  return { docs, warnings, mode: 'user' }
}

async function syncFeishuUserWiki(config, token) {
  const docs = []
  const warnings = []
  const base = feishuBase(config)
  let spacesData
  try {
    spacesData = await feishuUserGet('https://open.feishu.cn/open-apis/wiki/v2/spaces?page_size=50', token)
  } catch (e) {
    return { docs, warnings: [`知识库列表读取失败：${e.message}`] }
  }
  const filter = String(config.wikiSpace || '').trim().toLowerCase()
  const spaces = (spacesData.items || []).filter((space) => {
    if (!filter) return true
    return String(space.space_id).toLowerCase() === filter || String(space.name || '').toLowerCase().includes(filter)
  })
  if (filter && !spaces.length) warnings.push(`没有匹配「${config.wikiSpace}」的知识库空间`)

  async function walkNodes(space, parentToken, parentPath, depth) {
    if (depth > 4 || docs.length > 300) return
    let data
    try {
      const qs = new URLSearchParams({ page_size: '50' })
      if (parentToken) qs.set('parent_node_token', parentToken)
      data = await feishuUserGet(
        `https://open.feishu.cn/open-apis/wiki/v2/spaces/${encodeURIComponent(space.space_id)}/nodes?${qs}`,
        token,
      )
    } catch (e) {
      warnings.push(`知识库「${space.name}」节点读取失败：${e.message}`)
      return
    }
    for (const node of data.items || []) {
      const type = FEISHU_TYPE[node.obj_type] || node.obj_type || 'docx'
      const info = FEISHU_DOC_TYPE[type] || FEISHU_DOC_TYPE.docx
      const title = node.title || '未命名文档'
      if (['docx', 'doc', 'sheet', 'bitable', 'mindnote', 'slides'].includes(node.obj_type)) {
        docs.push({
          id: `feishu:${node.obj_token}`,
          source: 'feishu',
          title,
          folder: parentPath ? `${space.name} / ${parentPath}` : space.name,
          path: `飞书 / 知识库 / ${space.name}${parentPath ? ' / ' + parentPath : ''}`,
          url: `${base}/wiki/${node.node_token || node.obj_token}`,
          updatedAt: feishuTime(node.obj_edit_time) || feishuTime(node.node_edit_time) || new Date().toISOString(),
          createdAt: feishuTime(node.obj_create_time) || feishuTime(node.node_create_time) || new Date().toISOString(),
          words: 0,
          chars: 0,
          tags: [],
          excerpt: `飞书知识库 · ${space.name}`,
          type,
          typeLabel: info.label,
          links: 0,
          previewable: type === 'docx',
          demo: false,
          _ref: { kind: type, token: node.obj_token },
        })
      }
      if (node.has_child) {
        await walkNodes(space, node.node_token, parentPath ? `${parentPath} / ${title}` : title, depth + 1)
      }
    }
  }

  for (const space of spaces) {
    await walkNodes(space, '', '', 0)
  }
  return { docs, warnings }
}

export async function syncFeishu(config = {}) {
  const userToken = await feishuUserToken(config)
  if (userToken) {
    try {
      return await syncFeishuUserDrive(config, userToken)
    } catch (e) {
      // Fall through to tenant search, but keep the reason visible.
      const fallback = await syncFeishuTenant(config)
      fallback.warnings.unshift(`个人授权读取失败，已回退到租户搜索：${e.message}`)
      return fallback
    }
  }
  if (config.onlyMine !== false) {
    return {
      docs: [],
      warnings: ['尚未完成飞书个人授权，无法读取「我的空间」。请到「设置 → 飞书」点「授权读取我的飞书文档」；授权前不会展示租户模板。'],
      mode: 'unauthorized',
    }
  }
  return syncFeishuTenant(config)
}

async function syncFeishuTenant(config = {}) {
  const token = await feishuToken(config)
  const base = feishuBase(config)
  const docs = []
  const warnings = []
  const seen = new Set()

  // 1) Wiki spaces + nodes (team knowledge bases).
  try {
    const spacesData = await feishuGet('https://open.feishu.cn/open-apis/wiki/v2/spaces?page_size=50', token)
    for (const space of spacesData.items || []) {
      const spaceName = space.name || '知识库'
      let nodesData
      try {
        nodesData = await feishuGet(
          `https://open.feishu.cn/open-apis/wiki/v2/spaces/${encodeURIComponent(space.space_id)}/nodes?page_size=50`,
          token,
        )
      } catch (e) {
        warnings.push(`知识库「${spaceName}」节点读取失败：${e.message}`)
        continue
      }
      for (const node of nodesData.items || []) {
        if (!node.obj_token || seen.has(node.obj_token)) continue
        seen.add(node.obj_token)
        const type = FEISHU_TYPE[node.obj_type] || 'docx'
        docs.push({
          id: `feishu:${node.obj_token}`,
          source: 'feishu',
          title: node.title || '未命名文档',
          folder: `知识库 / ${spaceName}`,
          path: `飞书 / 知识库 / ${spaceName}`,
          url: type === 'docx' ? `${base}/docx/${node.obj_token}` : `${base}/wiki/${node.node_token || node.obj_token}`,
          updatedAt: feishuTime(node.obj_edit_time) || feishuTime(node.node_edit_time) || new Date().toISOString(),
          createdAt: feishuTime(node.obj_create_time) || feishuTime(node.node_create_time) || new Date().toISOString(),
          words: 0,
          chars: 0,
          tags: [],
          excerpt: `飞书知识库节点 · ${spaceName}`,
          type,
          typeLabel: type === 'docx' ? '飞书文档' : `飞书 ${type}`,
          links: 0,
          previewable: type === 'docx',
          demo: false,
          _ref: { kind: type, token: node.obj_token },
        })
      }
    }
  } catch (e) {
    warnings.push(`知识库列表读取失败：${e.message}`)
  }

  // 2) Drive files in the app's root folder.
  try {
    const filesData = await feishuGet('https://open.feishu.cn/open-apis/drive/v1/files?page_size=50', token)
    for (const file of filesData.files || []) {
      if (file.type === 'folder' || seen.has(file.token)) continue
      seen.add(file.token)
      const type = FEISHU_TYPE[file.type] || file.type || 'docx'
      docs.push({
        id: `feishu:${file.token}`,
        source: 'feishu',
        title: file.name || '未命名文档',
        folder: '云文档 / 我的空间',
        path: '飞书 / 云文档 / 我的空间',
        url: file.url || feishuUrl(base, type, file.token),
        updatedAt: feishuTime(file.modified_time) || new Date().toISOString(),
        createdAt: feishuTime(file.created_time) || new Date().toISOString(),
        words: 0,
        chars: 0,
        tags: [],
        excerpt: `飞书云文档 · ${type}`,
        type,
        typeLabel: FEISHU_DOC_TYPE[type]?.label || `飞书 ${type}`,
        links: 0,
        previewable: type === 'docx',
        demo: false,
        _ref: { kind: type, token: file.token },
      })
    }
  } catch (e) {
    warnings.push(`云文档列表读取失败：${e.message}`)
  }

  // 3) Search index — the only way a tenant token can see a user's personal docs.
  try {
    const items = await searchFeishuDocs(base, token)
    for (const item of items) {
      if (!item.token || seen.has(item.token)) continue
      seen.add(item.token)
      const info = FEISHU_DOC_TYPE[item.type] || FEISHU_DOC_TYPE.docx
      docs.push({
        id: `feishu:${item.token}`,
        source: 'feishu',
        title: item.title,
        folder: '云文档 / 搜索收录',
        path: '飞书 / 云文档 / 搜索收录',
        url: item.url || feishuUrl(base, item.type, item.token),
        updatedAt: item.updatedAt || new Date().toISOString(),
        createdAt: item.createdAt || item.updatedAt || new Date().toISOString(),
        words: 0,
        chars: 0,
        tags: [],
        excerpt: `${info.label} · 飞书搜索收录`,
        type: item.type,
        typeLabel: info.label,
        links: 0,
        previewable: item.type === 'docx',
        demo: false,
        _ref: { kind: item.type, token: item.token },
      })
    }
  } catch (e) {
    warnings.push(`文档搜索失败：${e.message}`)
  }

  if (!docs.length) warnings.push('没有拉到文档：请确认应用已开通 drive/wiki 读取权限，且应用可见范围内有文档。')
  return { docs, warnings, mode: 'tenant' }
}

export async function loadFeishuContent(documentId, config = {}) {
  const token = (await feishuUserToken(config)) || (await feishuToken(config))
  const data = await feishuGet(
    `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(documentId)}/raw_content?lang=0`,
    token,
  )
  return String(data.content || '(这个文档还没有正文)')
}

/* ------------------------------------------------------------------ dida */

const DIDA_BASE = 'https://api.dida365.com/open/v1'

function didaHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }
}

export function parseDidaDue(raw) {
  if (!raw) return { dueDay: null, dueTime: '' }
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(String(raw))
  if (!m) return { dueDay: null, dueTime: '' }
  return { dueDay: m[1], dueTime: m[2] || '' }
}

export async function syncDida(config = {}) {
  const token = String(config.token || '').trim()
  if (!token) throw new Error('未配置滴答清单 Access Token')
  const projects = await fetchJson(`${DIDA_BASE}/project`, { headers: didaHeaders(token) })
  const list = Array.isArray(projects) ? projects : []
  const todos = []
  const warnings = []
  for (const project of list.slice(0, 12)) {
    try {
      const data = await fetchJson(`${DIDA_BASE}/project/${encodeURIComponent(project.id)}/data`, {
        headers: didaHeaders(token),
      })
      for (const task of data?.tasks || []) {
        if (task.status === 2 || task.completedTime) {
          // keep completed tasks from the last 7 days for the completion metric
          const completedAt = task.completedTime ? new Date(task.completedTime) : null
          if (!completedAt || Date.now() - completedAt.getTime() > 8 * 864e5) continue
        }
        const { dueDay, dueTime } = parseDidaDue(task.dueDate)
        todos.push({
          id: `dida:${task.id}`,
          title: task.title || '未命名任务',
          projectId: project.id,
          projectName: project.name || '收集箱',
          projectColor: project.color || '#f59e0b',
          dueDay,
          dueTime,
          priority: Number(task.priority || 0),
          completed: task.status === 2 || Boolean(task.completedTime),
          completedTime: task.completedTime ? normalizeIso(task.completedTime, null) : null,
          tags: tagList(task.tags),
          url: `https://dida365.com/webapp/#p/${encodeURIComponent(project.id)}/tasks/${encodeURIComponent(task.id)}`,
          demo: false,
          _ref: { raw: task, projectId: project.id },
        })
      }
    } catch (e) {
      warnings.push(`清单「${project.name}」读取失败：${e.message}`)
    }
  }
  return { todos, projects: list.map((p) => ({ id: p.id, name: p.name, color: p.color || '#f59e0b' })), warnings }
}

export async function completeDidaTask(token, taskId, projectId, completed) {
  const headers = didaHeaders(token)
  const attempts = completed
    ? [
        { method: 'POST', url: `${DIDA_BASE}/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}/complete`, body: undefined },
        { method: 'POST', url: `${DIDA_BASE}/task/${encodeURIComponent(taskId)}/complete`, body: undefined },
        { method: 'POST', url: `${DIDA_BASE}/task/${encodeURIComponent(taskId)}`, body: JSON.stringify({ id: taskId, projectId, status: 2 }) },
      ]
    : [
        { method: 'POST', url: `${DIDA_BASE}/task/${encodeURIComponent(taskId)}`, body: JSON.stringify({ id: taskId, projectId, status: 0 }) },
      ]
  let lastError = null
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: attempt.method,
        headers,
        body: attempt.body,
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) return true
      const text = await res.text()
      lastError = new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('滴答清单接口调用失败')
}

export async function createDidaTask(token, { title, projectId, dueDay, priority }) {
  const body = {
    title,
    projectId,
    ...(dueDay ? { dueDate: `${dueDay}T09:00:00+0800`, isAllDay: true } : {}),
    ...(priority ? { priority } : {}),
  }
  return fetchJson(`${DIDA_BASE}/task`, {
    method: 'POST',
    headers: didaHeaders(token),
    body: JSON.stringify(body),
  })
}

export function didaProjectUrl(projectId) {
  return projectId ? `https://dida365.com/webapp/#p/${encodeURIComponent(projectId)}/tasks` : 'https://dida365.com/webapp/#q/all/tasks'
}
