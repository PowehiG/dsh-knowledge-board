/* ------------------------------------------------------------------- map */
function MapView({ snap, apps, openDoc, openApp, openUrl, goTab, pickSource }) {
  const stats = snap.stats
  const sources = snap.sources || []
  const todo = snap.todoSource || {}
  const [selected, setSelected] = useState(null)
  const folderGroups = useMemo(() => {
    const groups = new Map()
    for (const folder of stats.folders || []) {
      if (!groups.has(folder.source)) groups.set(folder.source, [])
      groups.get(folder.source).push(folder)
    }
    return groups
  }, [stats.folders])
  const maxFolder = Math.max(1, ...(stats.folders || []).map((f) => f.count))
  const selectedDocs = useMemo(() => {
    if (!selected) return []
    return (snap.documents || []).filter((d) => d.source === selected.source && d.folder === selected.path).slice(0, 40)
  }, [selected, snap.documents])
  const typeCounts = useMemo(() => {
    const map = new Map()
    for (const doc of snap.documents || []) {
      const label = doc.typeLabel || doc.type || '其他'
      map.set(label, (map.get(label) || 0) + 1)
    }
    return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
  }, [snap.documents])
  const stale = useMemo(
    () => [...(snap.documents || [])].sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt))).slice(0, 4),
    [snap.documents],
  )
  const weekCount = (stats.weekly || []).slice(-1)[0]?.count || 0

  const cards = [
    ...sources.map((s) => ({
      key: s.id,
      source: s.id,
      name: s.name,
      color: s.color,
      state: s.state,
      count: s.count,
      unit: '篇文档',
      home: s.home || '—',
      foot: `${fmtShort(s.words)} 字 · ${s.folders} 个目录`,
      last: s.lastUpdated,
      appUrl: apps?.[s.id]?.installed ? apps[s.id].url : '',
      onClick: () => pickSource(s.id),
    })),
    {
      key: 'dida',
      source: 'dida',
      name: '滴答清单',
      color: '#f5a524',
      state: todo.state || 'demo',
      count: stats.todo.open,
      unit: '项未完成',
      home: 'dida365.com',
      foot: `今日 ${stats.todo.today} · 逾期 ${stats.todo.overdue}`,
      last: null,
      appUrl: apps?.dida?.installed ? apps.dida.url : '',
      onClick: () => goTab('todos'),
    },
  ]

  return h('div', { className: 'kb-page' }, [
    h('div', { key: 'head', className: 'kb-pagehead' }, [
      h('div', { key: 'l' }, [
        h('h1', { key: 'h' }, '知识地图'),
        h('p', { key: 's' }, '文档到底存在哪里：来源、目录、更新热度与格式分布'),
      ]),
      h('div', { key: 'r', className: 'kb-actions' }, [
        h('button', { key: 'b', type: 'button', className: 'kb-btn', 'data-kind': 'ghost', onClick: () => goTab('library') }, ['浏览全部文档', h(Ico, { key: 'i', name: 'arrow', size: 12 })]),
      ]),
    ]),
    h('div', { key: 'cards', className: 'kb-sourcegrid' }, cards.map((card) =>
      h(
        'div',
        {
          key: card.key,
          className: 'kb-sourcecard',
          style: { '--kb-src': card.color },
          role: 'button',
          tabIndex: 0,
          onClick: card.onClick,
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') card.onClick() },
        },
        [
          h('div', { key: 'top', className: 'kb-sc-top' }, [
            h('span', { key: 'l', className: 'kb-sclogo' }, h(SourceGlyph, { source: card.key, size: 17 })),
            h('div', { key: 'n', style: { minWidth: 0, flex: 1 } }, [
              h('div', { key: 'nm', className: 'kb-sc-name' }, card.name),
              h('div', { key: 'st', className: 'kb-sc-state' }, [
                h('span', { key: 'd', className: 'kb-dot', 'data-live': card.state === 'live' ? '1' : undefined, 'data-demo': card.state === 'demo' ? '1' : undefined, 'data-err': card.state === 'error' ? '1' : undefined }),
                card.state === 'live' ? 'LIVE' : card.state === 'demo' ? 'DEMO' : card.state === 'error' ? 'ERROR' : 'OFF',
              ]),
            ]),
            card.appUrl
              ? h('button', {
                  key: 'open',
                  type: 'button',
                  className: 'kb-sc-open',
                  title: `打开 ${card.name}`,
                  onClick: (e) => {
                    e.stopPropagation()
                    openApp(card.key)
                  },
                }, h(Ico, { name: 'external', size: 11 }))
              : null,
          ]),
          h('div', { key: 'num', className: 'kb-sc-num' }, [String(card.count), h('small', { key: 'u' }, card.unit)]),
          h('div', { key: 'home', className: 'kb-sc-home', title: card.home }, card.home),
          h('div', { key: 'foot', className: 'kb-sc-foot' }, [
            h('span', { key: 'f' }, card.foot),
            card.last ? h('span', { key: 't', style: { marginLeft: 'auto' } }, fmtRelative(card.last)) : null,
          ]),
        ],
      ),
    )),
    h('div', { key: 'body', className: 'kb-grid-2b' }, [
      h('div', { key: 'left', className: 'kb-stack' }, [
        h(
          Panel,
          {
            key: 'tree',
            title: '目录结构',
            sub: `${(stats.folders || []).length} 个目录`,
            aside: h('span', { className: 'kb-muted' }, '点击目录查看文档'),
          },
          h(
            'div',
            { key: 't', className: 'kb-tree' },
            sources.map((s) => {
              const groups = folderGroups.get(s.id) || []
              if (!groups.length) return null
              return h('div', { key: s.id }, [
                h('div', { key: 'h', className: 'kb-tree-src' }, [
                  h('span', { key: 'd', className: 'kb-srcdot', style: { background: s.color } }),
                  s.name,
                  h('span', { key: 'c', style: { marginLeft: 'auto', fontSize: 9 } }, `${groups.length} 个目录`),
                ]),
                ...groups.map((folder) =>
                  h(
                    'button',
                    {
                      key: s.id + folder.path,
                      type: 'button',
                      className: 'kb-treerow',
                      'data-active': selected && selected.source === s.id && selected.path === folder.path ? '1' : '0',
                      onClick: () => setSelected({ source: s.id, path: folder.path }),
                      title: folder.path,
                    },
                    [
                      h('span', { key: 'c', className: 'kb-trcaret' }, h(Ico, { name: 'chevron', size: 9 })),
                      h('span', { key: 'f', className: 'kb-trfolder' }, folder.path),
                      h('span', { key: 'b', className: 'kb-trbar' }, h('span', { className: 'kb-bar' }, h('i', { style: { width: Math.max(4, (folder.count / maxFolder) * 100) + '%', background: s.color } }))),
                      h('b', { key: 'n' }, folder.count),
                      h('span', { key: 'w', className: 'kb-trwords' }, fmtShort(folder.words) + ' 字'),
                    ],
                  ),
                ),
              ])
            }),
          ),
        ),
        selected
          ? h(
              Panel,
              {
                key: 'folder',
                title: selected.path,
                sub: `${selectedDocs.length} 篇`,
                aside: h('button', { key: 'x', type: 'button', className: 'kb-link', onClick: () => setSelected(null) }, ['收起', h(Ico, { name: 'close', size: 10 })]),
              },
              selectedDocs.length
                ? h('div', { className: 'kb-recent' }, selectedDocs.map((doc) =>
                    h('div', { key: doc.id, className: 'kb-recentrow', style: { '--kb-src': sourceInfo(doc.source).color }, onClick: () => openDoc(doc) }, [
                      h('span', { key: 'i', className: 'kb-fileicon' }, h(SourceGlyph, { source: doc.source, size: 13 })),
                      h('div', { key: 'm', className: 'kb-rmain' }, [
                        h('div', { key: 't', className: 'kb-rtitle' }, doc.title),
                        h('div', { key: 'p', className: 'kb-rpath' }, `${fmtFull(doc.updatedAt)} · ${doc.words ? fmtNum(doc.words) + ' 字' : doc.typeLabel}`),
                      ]),
                      h('span', { key: 'd', className: 'kb-rtime' }, fmtRelative(doc.updatedAt)),
                    ]),
                  ))
                : h('div', { className: 'kb-empty', style: { minHeight: 90 } }, '这个目录下暂无文档。'),
            )
          : null,
      ]),
      h('div', { key: 'right', className: 'kb-stack' }, [
        h(
          Panel,
          { key: 'heat', title: '更新热力', sub: `本周 ${weekCount} 篇 · 近 12 周` },
          h(Heatmap, { daily: stats.daily, weeks: 12 }),
        ),
        h(
          Panel,
          { key: 'type', title: '格式分布', sub: `${typeCounts.length} 种` },
          h(BarList, {
            items: typeCounts.slice(0, 6),
            max: Math.max(1, ...typeCounts.map((t) => t.count)),
            color: '#22d3ee',
            onClick: null,
          }),
        ),
        h(
          Panel,
          { key: 'stale', title: '需要回访', sub: '90 天未更新' },
          h('div', { className: 'kb-recent' }, stale.map((doc) =>
            h('div', { key: doc.id, className: 'kb-recentrow', style: { '--kb-src': sourceInfo(doc.source).color }, onClick: () => openDoc(doc) }, [
              h('span', { key: 'i', className: 'kb-fileicon' }, h(Ico, { name: 'clock', size: 12 })),
              h('div', { key: 'm', className: 'kb-rmain' }, [
                h('div', { key: 't', className: 'kb-rtitle' }, doc.title),
                h('div', { key: 'p', className: 'kb-rpath' }, `${doc.path} · ${fmtRelative(doc.updatedAt)}`),
              ]),
              doc.url ? h('button', { key: 'o', type: 'button', className: 'kb-miniaction', title: '打开', onClick: (e) => { e.stopPropagation(); openUrl(doc) } }, h(Ico, { name: 'external', size: 12 })) : null,
            ]),
          )),
        ),
      ]),
    ]),
  ])
}
