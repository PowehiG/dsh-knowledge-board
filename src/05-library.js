/* ----------------------------------------------------------------- library */
function LibraryView({ snap, apps, query, setQuery, source, setSource, tag, setTag, openDoc, openApp, openUrl, notify, syncing, sync }) {
  const [sort, setSort] = useState('updated')
  const [page, setPage] = useState(0)
  const [type, setType] = useState('all')
  const debounced = useDebounced(query, 140)
  const docs = snap.documents || []
  const sourceCounts = useMemo(() => {
    const map = {}
    for (const d of docs) map[d.source] = (map[d.source] || 0) + 1
    return map
  }, [docs])

  useEffect(() => {
    setPage(0)
  }, [debounced, source, tag, sort, type])

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    const list = docs.filter((doc) => {
      if (source !== 'all' && doc.source !== source) return false
      if (tag && !(doc.tags || []).includes(tag)) return false
      if (type !== 'all') {
        const group = doc.type === 'database' || doc.type === 'bitable' || doc.type === 'sheet' ? 'table' : doc.type === 'mindnote' ? 'note' : 'doc'
        if (group !== type) return false
      }
      if (q) {
        const hay = `${doc.title} ${(doc.tags || []).join(' ')} ${doc.folder} ${doc.excerpt}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const sorted = [...list].sort((a, b) => {
      if (sort === 'words') return (b.words || 0) - (a.words || 0)
      if (sort === 'title') return a.title.localeCompare(b.title, 'zh-CN')
      if (sort === 'oldest') return String(a.updatedAt).localeCompare(String(b.updatedAt))
      return String(b.updatedAt).localeCompare(String(a.updatedAt))
    })
    return sorted
  }, [docs, debounced, source, tag, sort, type])

  const pageSize = 12
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages - 1)
  const rows = filtered.slice(current * pageSize, current * pageSize + pageSize)
  const tags = (snap.stats.tags || []).map((t) => t.name)

  return h('div', { className: 'kb-page' }, [
    h('div', { key: 'head', className: 'kb-pagehead' }, [
      h('div', { key: 'l' }, [
        h('h1', { key: 'h' }, '文档库'),
        h('p', { key: 's' }, `${filtered.length} / ${docs.length} 篇 · 点击任意行可在看板内预览`),
      ]),
      h('div', { key: 'r', className: 'kb-actions' }, [
        h('button', { key: 'sync', className: 'kb-btn', 'data-kind': 'ghost', type: 'button', onClick: sync, disabled: syncing }, [h(Ico, { name: 'refresh', size: 13 }), syncing ? '同步中…' : '同步']),
      ]),
    ]),
    h('div', { key: 'tool', className: 'kb-toolbar' }, [
      h('div', { key: 's', className: 'kb-search', style: { flex: '0 1 240px', height: 27 } }, [
        h(Ico, { key: 'i', name: 'search', size: 12 }),
        h('input', {
          key: 'in',
          value: query,
          placeholder: '搜索标题、标签、目录…',
          onChange: (e) => setQuery(e.target.value),
          'aria-label': '搜索文档',
        }),
        query ? h('button', { key: 'x', type: 'button', className: 'kb-miniaction', style: { width: 18, height: 18 }, onClick: () => setQuery('') }, h(Ico, { name: 'close', size: 10 })) : null,
      ]),
      h('button', { key: 'all', type: 'button', className: 'kb-chip', 'data-on': source === 'all' ? '1' : '0', onClick: () => setSource('all') }, ['全部', h('em', { key: 'c' }, docs.length)]),
      ...(snap.sources || []).map((s) =>
        h('button', { key: s.id, type: 'button', className: 'kb-chip', 'data-on': source === s.id ? '1' : '0', onClick: () => setSource(s.id) }, [
          h('span', { key: 'd', className: 'kb-dot', style: { background: s.color } }),
          s.name,
          h('em', { key: 'c' }, sourceCounts[s.id] || 0),
        ]),
      ),
      h('span', { key: 'g', style: { flex: 1 } }),
      h('select', { key: 'tag', className: 'kb-select', value: tag || '', onChange: (e) => setTag(e.target.value || ''), 'aria-label': '标签筛选' }, [
        h('option', { key: 'all', value: '' }, '全部标签'),
        ...tags.map((t) => h('option', { key: t, value: t }, `#${t}`)),
      ]),
      h('select', { key: 'type', className: 'kb-select', value: type, onChange: (e) => setType(e.target.value), 'aria-label': '类型筛选' }, [
        h('option', { key: 'all', value: 'all' }, '全部类型'),
        h('option', { key: 'doc', value: 'doc' }, '文档'),
        h('option', { key: 'table', value: 'table' }, '表格 / 数据库'),
        h('option', { key: 'note', value: 'note' }, '思维笔记'),
      ]),
      h('select', { key: 'sort', className: 'kb-select', value: sort, onChange: (e) => setSort(e.target.value), 'aria-label': '排序' }, [
        h('option', { key: 'u', value: 'updated' }, '最近更新'),
        h('option', { key: 'o', value: 'oldest' }, '最早更新'),
        h('option', { key: 'w', value: 'words' }, '字数最多'),
        h('option', { key: 't', value: 'title' }, '标题排序'),
      ]),
      source !== 'all' || tag || query || type !== 'all'
        ? h('button', { key: 'clear', type: 'button', className: 'kb-link', onClick: () => { setSource('all'); setTag(''); setQuery(''); setType('all') } }, ['清除筛选', h(Ico, { name: 'close', size: 10 })])
        : null,
    ]),
    h('div', { key: 'table', className: 'kb-panel', style: { padding: '13px 14px 8px' } }, [
      h('table', { key: 't', className: 'kb-table' }, [
        h('thead', { key: 'h' }, h('tr', null, [
          h('th', { key: 'd', style: { width: '36%' } }, '文档'),
          h('th', { key: 's', style: { width: '9%' } }, '来源'),
          h('th', { key: 'p', style: { width: '21%' } }, '存在哪里'),
          h('th', { key: 'g', style: { width: '15%' } }, '标签'),
          h('th', { key: 'w', style: { width: '7%', textAlign: 'right' } }, '字数'),
          h('th', { key: 't', style: { width: '9%' } }, '更新'),
          h('th', { key: 'a', style: { width: 58, textAlign: 'right' } }, ''),
        ])),
        h(
          'tbody',
          { key: 'b' },
          rows.map((doc) => {
            const info = sourceInfo(doc.source)
            return h(
              'tr',
              { key: doc.id, style: { '--kb-src': info.color }, onClick: () => openDoc(doc) },
              [
                h('td', { key: 'd' }, h('div', { className: 'kb-doccell' }, [
                  h('span', { key: 'i', className: 'kb-fileicon' }, h(SourceGlyph, { source: doc.source, size: 14 })),
                  h('div', { key: 'm', className: 'kb-docmain' }, [
                    h('div', { key: 'n', className: 'kb-docname', title: doc.title }, doc.title),
                    h('div', { key: 'e', className: 'kb-docex', title: doc.excerpt }, doc.excerpt || doc.typeLabel || ''),
                  ]),
                ])),
                h('td', { key: 's' }, h('span', { className: 'kb-srcpill', style: { '--kb-src': info.color } }, [h('i', { key: 'i', className: 'kb-srcdot', style: { background: info.color } }), info.short])),
                h('td', { key: 'p' }, h('div', { className: 'kb-path', title: doc.path }, doc.path)),
                h('td', { key: 'g' }, h('div', { style: { display: 'flex', gap: 3, flexWrap: 'wrap' } },
                  (doc.tags || []).slice(0, 2).map((t) => h('span', { key: t, className: 'kb-tag' }, '#' + t)),
                )),
                h('td', { key: 'w', style: { textAlign: 'right' } }, h('span', { className: 'kb-num' }, doc.words ? fmtShort(doc.words) : '—')),
                h('td', { key: 't' }, h('span', { className: 'kb-num', title: fmtFull(doc.updatedAt) }, fmtRelative(doc.updatedAt))),
                h('td', { key: 'a' }, h('div', { className: 'kb-actionscell' }, [
                  h('button', { key: 'e', type: 'button', className: 'kb-miniaction', title: '预览', onClick: (ev) => { ev.stopPropagation(); openDoc(doc) } }, h(Ico, { name: 'eye', size: 13 })),
                  h('button', { key: 'o', type: 'button', className: 'kb-miniaction', title: doc.url ? '在原应用中打开' : (apps?.[doc.source]?.installed ? `打开 ${apps[doc.source].name}` : '演示数据无链接'), disabled: !doc.url && !apps?.[doc.source]?.installed, onClick: (ev) => { ev.stopPropagation(); if (doc.url) openUrl(doc); else openApp(doc.source) } }, h(Ico, { name: 'external', size: 13 })),
                ])),
              ],
            )
          }),
        ),
      ]),
      rows.length === 0
        ? h('div', { className: 'kb-empty' }, [h(Ico, { key: 'i', name: 'search', size: 20 }), '没有匹配的文档，试试清除筛选。'])
        : null,
      h('div', { key: 'pager', className: 'kb-pager' }, [
        h('span', { key: 'c' }, `${filtered.length === 0 ? 0 : current * pageSize + 1}–${Math.min(filtered.length, (current + 1) * pageSize)} / ${filtered.length}`),
        h('span', { key: 'g', className: 'kb-grow' }),
        h('button', { key: 'p', type: 'button', disabled: current === 0, onClick: () => setPage(Math.max(0, current - 1)) }, '上一页'),
        h('span', { key: 'n' }, `${current + 1} / ${pages}`),
        h('button', { key: 'n2', type: 'button', disabled: current >= pages - 1, onClick: () => setPage(Math.min(pages - 1, current + 1)) }, '下一页'),
      ]),
    ]),
  ])
}

/* ----------------------------------------------------------------- preview */
function PreviewDrawer({ preview, apps, onClose, onOpen, onOpenApp, notify, goSettings }) {
  if (!preview) return null
  const doc = preview.doc
  const info = sourceInfo(doc.source)
  const data = preview.data
  const loading = preview.loading
  const error = preview.error || data?.error || ''

  const copy = async (text, label) => {
    if (!text) {
      notify('演示数据没有可复制的链接', 'err')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      notify(label || '已复制', 'ok')
    } catch {
      notify('复制失败，请手动选择', 'err')
    }
  }

  return h('div', { key: 'pv', className: 'kb-drawer-layer' }, [
    h('div', { key: 'ov', className: 'kb-overlay', style: { pointerEvents: 'auto' }, onClick: onClose }),
    h('aside', { key: 'dr', className: 'kb-drawer', role: 'dialog', 'aria-label': doc.title }, [
      h('div', { key: 'h', className: 'kb-drawerhead' }, [
        h('div', { key: 't', className: 'kb-dh-top' }, [
          h('div', { key: 'l', style: { minWidth: 0, flex: 1 } }, [
            h('div', { key: 'src', style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 } }, [
              h('span', { key: 'p', className: 'kb-srcpill', style: { '--kb-src': info.color } }, [h(SourceGlyph, { key: 'g', source: doc.source, size: 11 }), info.name]),
              doc.demo ? h('span', { key: 'd', className: 'kb-tag', style: { color: 'var(--kb-amber)' } }, '演示') : null,
              doc.typeLabel ? h('span', { key: 't', className: 'kb-tag' }, doc.typeLabel) : null,
            ]),
            h('div', { key: 'ti', className: 'kb-dh-title' }, doc.title),
          ]),
          h('button', { key: 'x', type: 'button', className: 'kb-iconbtn', onClick: onClose, title: '关闭' }, h(Ico, { name: 'close', size: 13 })),
        ]),
        h('div', { key: 'm', className: 'kb-dh-meta' }, [
          h('span', { key: 'p' }, doc.path),
          h('span', { key: 's' }, '·'),
          h('span', { key: 'u', title: fmtFull(doc.updatedAt) }, `更新于 ${fmtRelative(doc.updatedAt)}`),
          doc.words ? h('span', { key: 'w' }, `· ${fmtNum(doc.words)} 字`) : null,
        ]),
        (doc.tags || []).length
          ? h('div', { key: 'tags', style: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 } }, doc.tags.map((t) => h('span', { key: t, className: 'kb-tag' }, '#' + t)))
          : null,
        h('div', { key: 'a', className: 'kb-dh-actions' }, [
          h('button', {
            key: 'o',
            type: 'button',
            className: 'kb-btn',
            disabled: !doc.url && !apps?.[doc.source]?.installed,
            onClick: () => { if (doc.url) onOpen(doc); else onOpenApp(doc.source) },
          }, [h(Ico, { key: 'i', name: 'external', size: 12 }), doc.url ? '在原应用中打开' : `打开 ${apps?.[doc.source]?.name || '应用'}`]),
          h('button', { key: 'c', type: 'button', className: 'kb-btn', 'data-kind': 'ghost', onClick: () => copy(doc.url, '链接已复制') }, [h(Ico, { key: 'i', name: 'link', size: 12 }), '复制链接']),
          h('button', { key: 'p', type: 'button', className: 'kb-btn', 'data-kind': 'ghost', onClick: () => copy(doc.path, '路径已复制') }, [h(Ico, { key: 'i', name: 'copy', size: 12 }), '复制路径']),
        ]),
      ]),
      h('div', { key: 'b', className: 'kb-drawerbody' }, loading
        ? h('div', { className: 'kb-skel' }, [h('i', { key: '1', style: { width: '46%', height: 20 } }), h('i', { key: '2', style: { width: '92%' } }), h('i', { key: '3', style: { width: '86%' } }), h('i', { key: '4', style: { width: '64%' } }), h('i', { key: '5', style: { width: '90%', height: 80 } })])
        : h('div', null, [
            doc.demo
              ? h('div', { key: 'demo', className: 'kb-demobanner' }, [h(Ico, { key: 'i', name: 'spark', size: 12 }), '这是演示内容。接入真实账号后，这里会显示原文。'])
              : null,
            error && !data?.content
              ? h('div', { key: 'err', className: 'kb-previewfail' }, [
                  h('h4', { key: 'h' }, '无法在内置预览中打开'),
                  h('p', { key: 'p' }, error),
                  h('div', { key: 'a', style: { display: 'flex', gap: 7 } }, [
                    doc.url || apps?.[doc.source]?.installed ? h('button', { key: 'o', className: 'kb-btn', type: 'button', onClick: () => { if (doc.url) onOpen(doc); else onOpenApp(doc.source) } }, [doc.url ? '在原应用中打开' : `打开 ${apps?.[doc.source]?.name || '应用'}`, h(Ico, { key: 'i', name: 'external', size: 12 })]) : null,
                    h('button', { key: 's', className: 'kb-btn', 'data-kind': 'ghost', type: 'button', onClick: goSettings }, ['检查连接设置']),
                  ]),
                ])
              : h('div', { key: 'md', className: 'kb-md', dangerouslySetInnerHTML: { __html: renderMarkdown(data?.content || '（空文档）') } }),
          ])),
    ]),
  ])
}
