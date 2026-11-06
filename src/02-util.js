/* ------------------------------------------------------------------- utils */
function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

function fmtNum(n) {
  const v = Number(n) || 0
  if (v >= 100000000) return (v / 100000000).toFixed(1) + ' 亿'
  if (v >= 10000) return (v / 10000).toFixed(1) + ' 万'
  return v.toLocaleString('en-US')
}

function fmtShort(n) {
  const v = Number(n) || 0
  if (v >= 10000) return (v / 10000).toFixed(1) + 'w'
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k'
  return String(Math.round(v))
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function todayKey() {
  return dayKey(new Date())
}

function fmtRelative(iso) {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return '—'
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  const d = new Date(t)
  if (days < 365) return `${d.getMonth() + 1}月${d.getDate()}日`
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`
}

function fmtFull(iso) {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function fmtDue(day, time) {
  if (!day) return '无日期'
  const today = todayKey()
  const t = new Date(day + 'T00:00:00')
  const base = new Date(today + 'T00:00:00')
  const diff = Math.round((t.getTime() - base.getTime()) / 864e5)
  let label
  if (diff === 0) label = '今天'
  else if (diff === 1) label = '明天'
  else if (diff === -1) label = '昨天'
  else if (diff < 0) label = `${Math.abs(diff)} 天前`
  else if (diff < 7) label = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][t.getDay()]
  else label = `${t.getMonth() + 1}/${t.getDate()}`
  return time ? `${label} ${time}` : label
}

const SOURCE_INFO = {
  obsidian: { key: 'obsidian', name: 'Obsidian', short: 'Obsidian', color: '#a78bfa', glyph: 'obsidian' },
  notion: { key: 'notion', name: 'Notion', short: 'Notion', color: '#c7cbd4', glyph: 'notion' },
  feishu: { key: 'feishu', name: '飞书文档', short: '飞书', color: '#3370ff', glyph: 'feishu' },
  dida: { key: 'dida', name: '滴答清单', short: '滴答', color: '#f5a524', glyph: 'dida' },
}

function sourceInfo(key) {
  return SOURCE_INFO[key] || { key, name: key, short: key, color: '#8b95a8', glyph: 'file' }
}

function typeGlyph(type) {
  if (type === 'database' || type === 'bitable' || type === 'sheet') return 'table'
  if (type === 'mindnote') return 'spark'
  if (type === 'markdown') return 'file'
  return 'doc'
}

/* -------------------------------------------------------------------- icons */
const ICON_PATHS = {
  search: ['M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z', 'm16.2 16.2 4 4'],
  sync: ['M20 11a8 8 0 0 0-13.7-5.6L4 7.7', 'M4 4v4h4', 'M4 13a8 8 0 0 0 13.7 5.6L20 16.3', 'M20 20v-4h-4'],
  external: ['M14 4h6v6', 'M20 4 11 13', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  eye: ['M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z', 'M12 9.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Z'],
  copy: ['M9 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z', 'M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1'],
  close: ['m5 5 14 14', 'm19 5-14 14'],
  layers: ['M12 3 21 8l-9 5-9-5 9-5Z', 'M3 12l9 5 9-5', 'M3 16l9 5 9-5'],
  grid: ['M4 4h7v7H4Z', 'M13 4h7v7h-7Z', 'M4 13h7v7H4Z', 'M13 13h7v7h-7Z'],
  map: ['M9 4 3 6.5v14L9 18l6 2 6-2.5v-14L15 6 9 4Z', 'M9 4v14', 'M15 6v14'],
  check: ['m4.5 12.5 5 5 10-11'],
  plus: ['M12 5v14', 'M5 12h14'],
  settings: ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z', 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.88.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  folder: ['M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z'],
  file: ['M6 3.5h7l5 5v12H6Z', 'M13 3.5v5h5'],
  doc: ['M6 3.5h8l4 4v13H6Z', 'M9 11h6', 'M9 14.5h6', 'M9 18h4'],
  spark: ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'm5.6 5.6 2.8 2.8', 'm15.6 15.6 2.8 2.8', 'm18.4 5.6-2.8 2.8', 'm8.4 15.6-2.8 2.8'],
  chevron: ['m9 6 6 6-6 6'],
  down: ['m6 9 6 6 6-6'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  table: ['M4 5h16v14H4Z', 'M4 10h16', 'M10 10v9'],
  inbox: ['M4 13h4l2 3h4l2-3h4', 'M4 13 6 5h12l2 8v6H4Z'],
  alert: ['M12 4 2.5 20h19L12 4Z', 'M12 10v4', 'M12 17.2v.1'],
  book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z', 'M4 5.5V21.5'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  flag: ['M5 21V4', 'M5 4h11l-2 4 2 4H5'],
  calendar: ['M4 6h16v15H4Z', 'M8 3v5', 'M16 3v5', 'M4 11h16'],
  dots: ['M6 12h.1', 'M12 12h.1', 'M18 12h.1'],
  filter: ['M3 5h18l-7 8v6l-4 2v-8Z'],
  lock: ['M6 11h12v10H6Z', 'M9 11V8a3 3 0 0 1 6 0v3'],
  bolt: ['M13 2 4 14h6l-1 8 9-12h-6l1-8Z'],
  refresh: ['M20 11a8 8 0 0 0-14.1-5.2L4 7.7', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.1 5.2L20 16.3', 'M20 20v-4h-4'],
  warn: ['M12 8v5', 'M12 16.5v.1', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z'],
}

function Ico({ name, size = 14, stroke = 1.6, style }) {
  const paths = ICON_PATHS[name] || ICON_PATHS.file
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: String(stroke),
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      style,
    },
    paths.map((d, i) => h('path', { key: i, d })),
  )
}

function SourceGlyph({ source, size = 15 }) {
  const info = sourceInfo(source)
  if (info.glyph === 'obsidian') {
    return h(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      [
        h('path', { key: 'a', d: 'M12 2.5 20 12l-8 9.5L4 12 12 2.5Z', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round' }),
        h('path', { key: 'b', d: 'M12 6.2 8.6 12l3.4 6.2 3.4-6.2L12 6.2Z', stroke: 'currentColor', strokeWidth: '1.2', opacity: '.65' }),
      ],
    )
  }
  if (info.glyph === 'notion') {
    return h(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      [
        h('rect', { key: 'r', x: '3.5', y: '3.5', width: '17', height: '17', rx: '3', stroke: 'currentColor', strokeWidth: '1.5' }),
        h('path', { key: 'n', d: 'M8 16.5V8l8 8.5V8', stroke: 'currentColor', strokeWidth: '1.6', strokeLinejoin: 'round' }),
      ],
    )
  }
  if (info.glyph === 'feishu') {
    return h(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      [
        h('path', { key: 'a', d: 'M3.5 13.2 20.5 4l-5.1 16-4.1-5.4-7.8-1.4Z', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round' }),
        h('path', { key: 'b', d: 'm11.3 14.6 9.2-10.3', stroke: 'currentColor', strokeWidth: '1.2', opacity: '.7' }),
      ],
    )
  }
  if (info.glyph === 'dida') {
    return h(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      [
        h('circle', { key: 'c', cx: '12', cy: '12', r: '8.5', stroke: 'currentColor', strokeWidth: '1.5' }),
        h('path', { key: 'k', d: 'm8 12.2 2.6 2.7L16 9.5', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      ],
    )
  }
  return h(SourceGlyph, { source: 'notion', size })
}

/* ------------------------------------------------------------------ markdown */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineMd(text) {
  let out = escapeHtml(text)
  // images (remote only — local Obsidian attachments are not served by the panel)
  out = out.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
  // markdown links; Obsidian URIs are valid targets here
  out = out.replace(/\[([^\]]+)\]\(((?:https?:|obsidian:|mailto:|#)[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  // Obsidian embeds / wikilinks
  out = out.replace(/!\[\[([^\]]+)\]\]/g, '<span class="kb-embed">🖼 $1</span>')
  out = out.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, label) => `<span class="kb-wikilink">${label || target}</span>`)
  // emphasis — CJK friendly, and don't consume list markers
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_\w])_([^_\n]+)_(?=[^_\w]|$)/g, '$1<em>$2</em>')
  out = out.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
  out = out.replace(/==([^=\n]+)==/g, '<mark>$1</mark>')
  // inline math ($...$)
  out = out.replace(/\$([^$\n]+)\$/g, '<span class="kb-math">$1</span>')
  // tags
  out = out.replace(/(^|[\s(（])(#[\u4e00-\u9fa5A-Za-z0-9_/-]{1,32})/g, '$1<span class="kb-md-tag">$2</span>')
  return out
}

function renderMarkdown(md) {
  if (!md) return ''
  const src = String(md).replace(/\r\n/g, '\n')
  const blocks = []
  const stash = (html) => {
    blocks.push(html)
    return `\u0000C${blocks.length - 1}\u0000`
  }
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g
  let text = src.replace(fence, (_m, lang, code) => stash(
    `<pre><code data-lang="${escapeHtml(String(lang || '').trim())}">${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`,
  ))
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, expr) => stash(`<div class="kb-math-block">${escapeHtml(expr.trim())}</div>`))

  const lines = text.split('\n')
  const out = []
  let i = 0
  const isTableLine = (l) => /^\s*\|.+\|\s*$/.test(l)
  const isPlaceholder = (l) => /^\u0000C\d+\u0000$/.test(l.trim())

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) { i += 1; continue }

    if (isPlaceholder(line)) { out.push(line); i += 1; continue }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = Math.min(6, heading[1].length)
      out.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`)
      i += 1
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { out.push('<hr />'); i += 1; continue }

    if (/^>\s?/.test(line)) {
      const quote = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(inlineMd(lines[i].trim().replace(/^>\s?/, '')))
        i += 1
      }
      out.push(`<blockquote>${quote.join('<br />')}</blockquote>`)
      continue
    }

    if (isTableLine(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      const head = cells(line)
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inlineMd(c)}</th>`).join('')}</tr></thead>`)
      i += 2
      const rows = []
      while (i < lines.length && isTableLine(lines[i].trim())) {
        rows.push(`<tr>${cells(lines[i]).map((c) => `<td>${inlineMd(c)}</td>`).join('')}</tr>`)
        i += 1
      }
      out.push(`<tbody>${rows.join('')}</tbody></table>`)
      continue
    }

    if (/^[-*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      const ordered = /^\d+[.)]\s+/.test(line)
      const items = []
      while (i < lines.length && (/^[-*+]\s+/.test(lines[i].trim()) || /^\d+[.)]\s+/.test(lines[i].trim()))) {
        const body = lines[i].trim().replace(/^([-*+]|\d+[.)])\s+/, '')
        const task = /^\[([ xX])\]\s+/.exec(body)
        if (task) {
          items.push(`<li class="kb-md-task" data-done="${task[1].toLowerCase() === 'x' ? '1' : '0'}">${task[1].toLowerCase() === 'x' ? '✓' : ''} ${inlineMd(body.replace(/^\[[ xX]\]\s+/, ''))}</li>`)
        } else {
          items.push(`<li>${inlineMd(body)}</li>`)
        }
        i += 1
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`)
      continue
    }

    const para = [line]
    i += 1
    while (i < lines.length) {
      const nxt = lines[i].trim()
      if (!nxt || /^(#{1,6})\s|^>\s?|^[-*+]\s+|^\d+[.)]\s+|^\|/.test(nxt) || /^(-{3,}|\*{3,}|_{3,})$/.test(nxt) || isPlaceholder(nxt)) break
      para.push(nxt)
      i += 1
    }
    out.push(`<p>${inlineMd(para.join('\n')).replace(/\n/g, '<br />')}</p>`)
  }

  return out.join('\n').replace(/\u0000C(\d+)\u0000/g, (_m, idx) => blocks[Number(idx)] || '')
}

/* -------------------------------------------------------------------- misc */
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function deltaLabel(current, previous) {
  const diff = (Number(current) || 0) - (Number(previous) || 0)
  if (diff === 0) return { text: '持平', dir: 'flat' }
  return { text: `${diff > 0 ? '+' : ''}${diff}`, dir: diff > 0 ? 'up' : 'down' }
}
