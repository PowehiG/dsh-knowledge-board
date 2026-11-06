/* ---------------------------------------------------------------- overview */
function Panel({ title, sub, aside, children, style, className }) {
  return h(
    'section',
    { className: cx('kb-panel', className), style },
    title
      ? h('div', { className: 'kb-panelhead' }, [
          h('h3', { key: 't' }, title),
          sub ? h('span', { key: 's', className: 'kb-sub' }, sub) : null,
          h('span', { key: 'g', className: 'kb-grow' }),
          aside || null,
        ])
      : null,
    children,
  )
}

function Kpi({ label, value, unit, foot, accent, spark, delta }) {
  return h(
    'div',
    { className: 'kb-kpi', style: { '--kaccent': accent } },
    [
      h('div', { key: 'l', className: 'kb-kpi-label' }, [
        h('span', { key: 'd', className: 'kb-dot', style: { background: accent, boxShadow: `0 0 8px ${accent}` } }),
        label,
      ]),
      h('div', { key: 'v', className: 'kb-kpi-value' }, [String(value), unit ? h('small', { key: 'u' }, unit) : null]),
      h('div', { key: 'f', className: 'kb-kpi-foot' }, [
        delta
          ? h(
              'span',
              { key: 'dl', className: 'kb-delta', 'data-up': delta.dir === 'up' ? '1' : undefined, 'data-down': delta.dir === 'down' ? '1' : undefined, 'data-flat': delta.dir === 'flat' ? '1' : undefined },
              `${delta.dir === 'up' ? '↑' : delta.dir === 'down' ? '↓' : '·'} ${delta.text}`,
            )
          : null,
        h('span', { key: 'x' }, foot),
        spark ? h('span', { key: 's', className: 'kb-kpi-spark' }, h(Sparkline, { values: spark, color: accent })) : null,
      ]),
    ],
  )
}

function OverviewView({ snap, apps, openDoc, openApp, openUrl, toggleTodo, goTab, pickSource, pickTag, sync, syncing, notify }) {
  const stats = snap.stats
  const sources = snap.sources || []
  const weekly = stats.weekly || []
  const docSpark = weekly.map((w) => w.count)
  const liveCount = sources.filter((s) => s.state === 'live').length
  const demoCount = sources.filter((s) => s.state === 'demo').length
  const focusTodos = (snap.todos || [])
    .filter((t) => !t.completed && t.dueDay && t.dueDay <= stats.today)
    .sort((a, b) => String(a.dueDay).localeCompare(String(b.dueDay)) || (b.priority || 0) - (a.priority || 0))
    .slice(0, 6)
  const recent = (snap.documents || []).slice(0, 7)
  const peak = weekly.reduce((acc, w) => (w.count > (acc?.count || 0) ? w : acc), null)
  const delta = deltaLabel(stats.weekUpdates, stats.prevWeekUpdates)

  return h('div', { className: 'kb-page' }, [
    h('div', { key: 'head', className: 'kb-pagehead' }, [
      h('div', { key: 'l' }, [
        h('h1', { key: 'h' }, '知识总览'),
        h('p', { key: 's' }, `共 ${stats.totalDocs} 篇文档 · ${stats.sources.length} 个来源 · 上次同步 ${fmtRelative(snap.generatedAt)}`),
      ]),
      h('div', { key: 'r', className: 'kb-actions' }, [
        snap.mode === 'demo'
          ? h('span', { className: 'kb-status' }, [h('span', { key: 'd', className: 'kb-dot', 'data-demo': '1' }), '演示数据'])
          : null,
        h(
          'button',
          { key: 'sync', className: 'kb-btn', 'data-kind': 'ghost', onClick: sync, disabled: syncing, type: 'button' },
          [h(Ico, { key: 'i', name: 'refresh', size: 13 }), syncing ? '同步中…' : '刷新数据'],
        ),
        h(
          'button',
          { key: 'lib', className: 'kb-btn', onClick: () => goTab('library'), type: 'button' },
          ['打开文档库', h(Ico, { key: 'i', name: 'arrow', size: 13 })],
        ),
      ]),
    ]),

    h('div', { key: 'kpis', className: 'kb-kpis' }, [
      h(Kpi, {
        key: 'docs',
        label: '文档总数',
        value: stats.totalDocs,
        unit: '篇',
        foot: `近 7 天更新 ${stats.weekUpdates} 篇`,
        accent: '#6d8cff',
        spark: docSpark,
      }),
      h(Kpi, {
        key: 'words',
        label: '知识总量',
        value: fmtNum(stats.totalWords),
        unit: '字',
        foot: `平均 ${fmtNum(stats.avgWords)} 字 / 篇`,
        accent: '#22d3ee',
        spark: weekly.map((w) => w.bySource?.obsidian || 0),
      }),
      h(Kpi, {
        key: 'week',
        label: '本周更新',
        value: stats.weekUpdates,
        unit: '篇',
        foot: `近 30 天 ${stats.monthUpdates} 篇`,
        accent: '#a78bfa',
        delta,
        spark: docSpark,
      }),
      h(Kpi, {
        key: 'todo',
        label: '待办进行中',
        value: stats.todo.open,
        unit: '项',
        foot: `今日 ${stats.todo.today} · 逾期 ${stats.todo.overdue} · 本周完成 ${stats.todo.done7d}`,
        accent: '#f5a524',
        spark: [stats.todo.done7d, stats.todo.week, stats.todo.today, stats.todo.overdue, stats.todo.open],
      }),
    ]),

    h('div', { key: 'row1', className: 'kb-grid-2' }, [
      h(
        Panel,
        {
          key: 'trend',
          title: '更新节奏',
          sub: '近 12 周',
          aside: h('div', { className: 'kb-legend' }, sources.map((s) => h('span', { key: s.id }, [h('i', { style: { background: s.color } }), s.name]))),
        },
        [
          h(AreaChart, { key: 'chart', data: weekly, height: 178, color: '#6d8cff' }),
          h('div', { key: 'foot', style: { display: 'flex', gap: 22, marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--kb-line)' } }, [
            h('div', { key: 'a' }, [h('div', { style: { fontSize: 10, color: 'var(--kb-faint)' } }, '本周'), h('b', { style: { fontSize: 14 } }, `${stats.weekUpdates} 篇`)]),
            h('div', { key: 'b' }, [h('div', { style: { fontSize: 10, color: 'var(--kb-faint)' } }, '上周'), h('b', { style: { fontSize: 14 } }, `${stats.prevWeekUpdates} 篇`)]),
            h('div', { key: 'c' }, [h('div', { style: { fontSize: 10, color: 'var(--kb-faint)' } }, '峰值周'), h('b', { style: { fontSize: 14 } }, peak ? `${peak.count} 篇` : '—')]),
            h('div', { key: 'd', style: { marginLeft: 'auto', textAlign: 'right' } }, [h('div', { style: { fontSize: 10, color: 'var(--kb-faint)' } }, '90 天未更新'), h('b', { style: { fontSize: 14, color: stats.stale ? 'var(--kb-amber)' : undefined } }, `${stats.stale} 篇`)]),
          ]),
        ],
      ),
      h(
        Panel,
        {
          key: 'sources',
          title: '来源分布',
          sub: `${liveCount} 已连接${demoCount ? ` · ${demoCount} 演示` : ''}`,
        },
        [
          h('div', { key: 'd', className: 'kb-donut-wrap', style: { marginTop: 4 } }, [
            h(Donut, {
              key: 'donut',
              segments: sources.map((s) => ({ value: s.count, color: s.color, label: s.name })),
              size: 138,
              thickness: 14,
              centerValue: stats.totalDocs,
              centerLabel: '文档',
            }),
            h(
              'div',
              { key: 'legend', className: 'kb-srclegend' },
              sources.map((s) =>
                h(
                  'button',
                  { key: s.id, type: 'button', className: 'kb-srcrow', onClick: () => pickSource(s.id), title: `查看 ${s.name} 文档` },
                  [
                    h('i', { key: 'i', style: { background: s.color } }),
                    h('span', { key: 'n' }, s.name),
                    h('b', { key: 'c' }, s.count),
                    h('em', { key: 'w' }, `${fmtShort(s.words)} 字`),
                  ],
                ),
              ),
            ),
          ]),
          h('div', { key: 'state', style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--kb-line)' } }, [
            ...sources.map((s) =>
              h('span', { key: s.id, className: 'kb-tag', style: { color: s.state === 'error' ? 'var(--kb-red)' : undefined } }, [
                h('span', { key: 'd', className: 'kb-dot', 'data-live': s.state === 'live' ? '1' : undefined, 'data-demo': s.state === 'demo' ? '1' : undefined, 'data-err': s.state === 'error' ? '1' : undefined }),
                s.state === 'live' ? '已连接' : s.state === 'demo' ? '演示' : s.state === 'error' ? '连接异常' : '未启用',
              ]),
            ),
            h('button', { key: 'set', type: 'button', className: 'kb-link', style: { marginLeft: 'auto' }, onClick: () => goTab('settings') }, ['接入真实账号', h(Ico, { key: 'i', name: 'arrow', size: 11 })]),
          ]),
        ],
      ),
    ]),

    h('div', { key: 'row2', className: 'kb-grid-2b' }, [
      h(
        Panel,
        {
          key: 'recent',
          title: '最近更新',
          sub: '按编辑时间排序',
          aside: h('button', { className: 'kb-link', type: 'button', onClick: () => goTab('library') }, ['全部文档', h(Ico, { name: 'arrow', size: 11 })]),
        },
        recent.length
          ? h(
              'div',
              { className: 'kb-recent' },
              recent.map((doc) => {
                const info = sourceInfo(doc.source)
                return h(
                  'div',
                  { key: doc.id, className: 'kb-recentrow', style: { '--kb-src': info.color }, onClick: () => openDoc(doc), role: 'button', tabIndex: 0 },
                  [
                    h('span', { key: 'ic', className: 'kb-fileicon' }, h(SourceGlyph, { source: doc.source, size: 14 })),
                    h('div', { key: 'm', className: 'kb-rmain' }, [
                      h('div', { key: 't', className: 'kb-rtitle' }, doc.title),
                      h('div', { key: 'p', className: 'kb-rpath' }, [
                        h('span', { key: 's', className: 'kb-srcdot', style: { background: info.color } }),
                        h('span', { key: 'x' }, doc.path),
                        ...(doc.tags || []).slice(0, 2).map((tag) => h('span', { key: tag, className: 'kb-tag' }, '#' + tag)),
                      ]),
                    ]),
                    h('span', { key: 'd', className: 'kb-rtime' }, fmtRelative(doc.updatedAt)),
                    h('div', { key: 'a', className: 'kb-ractions' }, [
                      h('button', {
                        key: 'eye',
                        type: 'button',
                        className: 'kb-miniaction',
                        title: '预览',
                        onClick: (e) => {
                          e.stopPropagation()
                          openDoc(doc)
                        },
                      }, h(Ico, { name: 'eye', size: 13 })),
                      h('button', {
                        key: 'open',
                        type: 'button',
                        className: 'kb-miniaction',
                        title: doc.url ? '在原应用中打开' : (apps?.[doc.source]?.installed ? `打开 ${apps[doc.source].name}` : '演示数据无链接'),
                        disabled: !doc.url && !apps?.[doc.source]?.installed,
                        onClick: (e) => {
                          e.stopPropagation()
                          if (doc.url) openUrl(doc)
                          else openApp(doc.source)
                        },
                      }, h(Ico, { name: 'external', size: 13 })),
                    ]),
                  ],
                )
              }),
            )
          : h('div', { className: 'kb-empty' }, ['还没有文档。', h('button', { className: 'kb-link', onClick: () => goTab('settings'), type: 'button' }, '去接入数据源 →')]),
      ),
      h('div', { key: 'rightcol', className: 'kb-stack' }, [
        h(
          Panel,
          {
            key: 'focus',
            title: '今日焦点',
            sub: `逾期 ${stats.todo.overdue} · 今日 ${stats.todo.today}`,
            aside: h('button', { className: 'kb-link', type: 'button', onClick: () => goTab('todos') }, ['全部待办', h(Ico, { name: 'arrow', size: 11 })]),
          },
          [
            focusTodos.length
              ? h(
                  'div',
                  { key: 'l', className: 'kb-focuslist' },
                  focusTodos.map((todo) =>
                    h(
                      'div',
                      { key: todo.id, className: 'kb-focusrow' },
                      [
                        h('button', {
                          key: 'c',
                          type: 'button',
                          className: 'kb-check',
                          'data-done': '0',
                          title: '标记完成',
                          onClick: () => toggleTodo(todo),
                        }, h(Ico, { name: 'check', size: 10, stroke: 2.4 })),
                        h('div', { key: 't', className: 'kb-ft' }, [
                          h('div', { key: 'x', className: 'kb-ftitle' }, todo.title),
                          h('div', { key: 'm', className: 'kb-fmeta' }, [
                            h('span', { key: 'p', className: 'kb-taskproj', style: { '--pc': todo.projectColor } }, [h('i', { key: 'i' }), todo.projectName]),
                            h('span', { key: 'd', className: 'kb-taskdue', 'data-overdue': todo.dueDay < stats.today ? '1' : undefined, 'data-today': todo.dueDay === stats.today ? '1' : undefined }, fmtDue(todo.dueDay, todo.dueTime)),
                            todo.priority >= 5 ? h('span', { key: 'f', className: 'kb-flag', 'data-p': '5' }, '高') : null,
                          ]),
                        ]),
                        todo.url || apps?.dida?.installed
                          ? h('button', {
                              key: 'o',
                              type: 'button',
                              className: 'kb-miniaction',
                              title: '在滴答清单打开',
                              onClick: () => {
                                if (todo.url) window.open(todo.url, '_blank', 'noopener,noreferrer')
                                else openApp('dida')
                              },
                            }, h(Ico, { name: 'external', size: 12 }))
                          : null,
                      ],
                    ),
                  ),
                )
              : h('div', { key: 'e', className: 'kb-empty', style: { minHeight: 110 } }, [
                  h(Ico, { key: 'i', name: 'check', size: 20 }),
                  '今天没有到期的任务，保持节奏。',
                ]),
            h('div', { key: 'f', className: 'kb-focusfoot' }, [
              h('span', { key: 's', className: 'kb-muted' }, `本周完成 ${stats.todo.done7d} 项`),
              h('span', { key: 'g', style: { flex: 1 } }),
              h('button', {
                key: 'o',
                type: 'button',
                className: 'kb-link',
                onClick: () => {
                  if (apps?.dida?.installed) openApp('dida')
                  else window.open('https://dida365.com/webapp/#q/all/tasks', '_blank', 'noopener,noreferrer')
                },
              }, ['打开滴答清单', h(Ico, { key: 'i', name: 'external', size: 11 })]),
            ]),
          ],
        ),
        h(
          Panel,
          {
            key: 'tags',
            title: '标签分布',
            sub: `${(stats.tags || []).length} 个活跃标签`,
            aside: h('button', { className: 'kb-link', type: 'button', onClick: () => goTab('map') }, ['知识地图', h(Ico, { name: 'arrow', size: 11 })]),
          },
          h('div', { key: 'c', style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
            (stats.tags || []).slice(0, 14).map((tag) =>
              h(
                'button',
                {
                  key: tag.name,
                  type: 'button',
                  className: 'kb-tag',
                  'data-click': '1',
                  style: {
                    fontSize: 10 + Math.min(3, tag.count / 4) + 'px',
                    padding: '3px 9px',
                    color: tag.count >= 4 ? 'var(--kb-text)' : undefined,
                    background: tag.count >= 4 ? 'color-mix(in srgb, var(--kb-indigo) 12%, transparent)' : undefined,
                    borderColor: tag.count >= 4 ? 'color-mix(in srgb, var(--kb-indigo) 30%, transparent)' : undefined,
                  },
                  onClick: () => pickTag(tag.name),
                  title: `${tag.count} 篇文档`,
                },
                [`#${tag.name}`, h('span', { key: 'c', style: { opacity: 0.5, marginLeft: 3 } }, tag.count)],
              ),
            ),
          ),
        ),
      ]),
    ]),
  ])
}
