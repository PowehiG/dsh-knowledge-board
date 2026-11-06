/* ------------------------------------------------------------------- panel */
function isZh(ctx) {
  try {
    return String(ctx.locale.getLocale().active || '').toLowerCase().startsWith('zh')
  } catch {
    return true
  }
}

function themeMode(ctx) {
  try {
    return ctx.theme.getTheme().active.colorScheme || 'dark'
  } catch {
    return 'dark'
  }
}

async function api(path, options = {}) {
  const res = await fetch(`/knowledge-board/api/${path}`, {
    cache: 'no-store',
    ...options,
    headers: { accept: 'application/json', 'content-type': 'application/json', ...(options.headers || {}) },
  })
  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  if (!res.ok || data.ok === false) throw new Error(data.error || `请求失败（HTTP ${res.status}）`)
  return data
}

function KnowledgeIcon({ size = 22, active }) {
  return h(
    'span',
    {
      style: {
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        lineHeight: 0,
        filter: active ? 'drop-shadow(0 0 7px rgba(109,140,255,.6))' : 'none',
        opacity: active ? 1 : 0.9,
      },
    },
    h(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      [
        h('rect', { key: 'a', x: '3.2', y: '3.2', width: '17.6', height: '17.6', rx: '5', stroke: 'currentColor', strokeWidth: '1.4', opacity: active ? 0.9 : 0.55 }),
        h('rect', { key: 'b', x: '6.4', y: '6.6', width: '11.2', height: '3.1', rx: '1.55', fill: 'currentColor', opacity: 0.95 }),
        h('rect', { key: 'c', x: '6.4', y: '11.2', width: '11.2', height: '3.1', rx: '1.55', fill: 'currentColor', opacity: 0.62 }),
        h('rect', { key: 'd', x: '6.4', y: '15.8', width: '7.4', height: '3.1', rx: '1.55', fill: active ? 'var(--dsw-alias-brand-primary, #6d8cff)' : 'currentColor', opacity: active ? 1 : 0.4 }),
      ],
    ),
  )
}

function LoadingSkeleton() {
  return h('div', { className: 'kb-page' }, [
    h('div', { key: 'h', className: 'kb-pagehead' }, [
      h('div', { key: 'l' }, [h('h1', null, '知识总览'), h('p', null, '正在汇总 Obsidian、Notion、飞书与滴答清单…')]),
    ]),
    h('div', { key: 'k', className: 'kb-kpis' }, [0, 1, 2, 3].map((i) =>
      h('div', { key: i, className: 'kb-kpi', style: { '--kaccent': '#6d8cff' } }, [
        h('div', { key: 'a', className: 'kb-skel', style: { gap: 10 } }, [h('i', { style: { width: '42%' } }), h('i', { style: { width: '64%', height: 26 } }), h('i', { style: { width: '76%' } })]),
      ]),
    )),
    h('div', { key: 'g', className: 'kb-grid-2' }, [
      h('div', { key: 'a', className: 'kb-panel', style: { height: 268 } }, h('div', { className: 'kb-skel' }, [h('i', { style: { width: '30%' } }), h('i', { style: { width: '100%', height: 150 } })])),
      h('div', { key: 'b', className: 'kb-panel', style: { height: 268 } }, h('div', { className: 'kb-skel' }, [h('i', { style: { width: '36%' } }), h('i', { style: { width: '82%', height: 100 } })])),
    ]),
  ])
}

function KnowledgePanel({ ctx }) {
  const [theme, setTheme] = useState(() => themeMode(ctx))
  const [, setLocaleTick] = useState(0)
  const [snap, setSnap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState(() => {
    try {
      const saved = window.localStorage.getItem('knowledge-board.tab')
      return ['overview', 'library', 'map', 'todos', 'settings'].includes(saved) ? saved : 'overview'
    } catch {
      return 'overview'
    }
  })
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [tag, setTag] = useState('')
  const [preview, setPreview] = useState(null)
  const [toast, setToast] = useState(null)
  const [focusProject, setFocusProject] = useState('all')
  const [config, setConfig] = useState(null)
  const syncingRef = useRef(false)
  const searchRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    const offTheme = ctx.on('theme/change', (next) => {
      try {
        setTheme(next.active.colorScheme || 'dark')
      } catch {
        setTheme('dark')
      }
    })
    const offLocale = ctx.on('locale/change', () => setLocaleTick((v) => v + 1))
    return () => {
      if (typeof offTheme === 'function') offTheme()
      if (typeof offLocale === 'function') offLocale()
    }
  }, [ctx])

  useEffect(() => {
    try {
      window.localStorage.setItem('knowledge-board.tab', tab)
    } catch {
      /* ignore */
    }
  }, [tab])

  const notify = useCallback((message, kind) => setToast({ message, kind }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const applySnapshot = useCallback((data) => {
    setSnap(data)
    setConfig(data.config)
    setError('')
  }, [])

  const load = useCallback(async (force) => {
    try {
      const data = await api(`overview${force ? '?refresh=1' : ''}`)
      applySnapshot(data)
      if (data.refreshing) {
        if (pollRef.current) clearTimeout(pollRef.current)
        pollRef.current = setTimeout(() => {
          load(false).catch(() => {})
        }, 2600)
      }
      return data
    } catch (e) {
      setError(e.message || String(e))
      throw e
    } finally {
      setLoading(false)
    }
  }, [applySnapshot])

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current)
  }, [])

  useEffect(() => {
    load(false).catch(() => {})
  }, [load])

  const sync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      await load(true)
      notify('已重新同步全部来源', 'ok')
    } catch (e) {
      notify(e.message || '同步失败', 'err')
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [load, notify])

  const openDoc = useCallback(async (doc) => {
    setPreview({ doc, loading: true, data: null, error: '' })
    try {
      const data = await api(`doc?id=${encodeURIComponent(doc.id)}`)
      setPreview({ doc, loading: false, data, error: '' })
    } catch (e) {
      setPreview({ doc, loading: false, data: null, error: e.message || '预览失败' })
    }
  }, [])

  const apps = snap?.apps || {}
  const openApp = useCallback(async (source) => {
    const app = apps[source]
    try {
      await api('open-app', { method: 'POST', body: JSON.stringify({ source }) })
      notify(`已打开 ${app?.name || '本机应用'}`, 'ok')
    } catch (e) {
      notify(e.message || '打开本机应用失败', 'err')
    }
  }, [apps, notify])

  const openUrl = useCallback((doc) => {
    if (doc?.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
      return
    }
    const app = apps[doc?.source]
    if (app?.installed) {
      openApp(doc.source)
      if (doc?.demo) notify('演示文档没有真实页面，已打开应用首页；接入 Token 后直达页面', 'ok')
      return
    }
    notify(doc?.demo ? '演示文档没有真实页面链接，可在设置中接入账号' : '这篇文档没有可跳转的链接', 'err')
  }, [apps, notify, openApp])

  const toggleTodo = useCallback(async (todo, completed = true) => {
    const data = await api('todo/complete', {
      method: 'POST',
      body: JSON.stringify({ id: todo.id, projectId: todo.projectId, completed }),
    })
    await load(false)
    notify(data.message || (completed ? '已完成' : '已恢复为未完成'), 'ok')
  }, [load, notify])

  const createTodo = useCallback(async (input) => {
    const data = await api('todo/create', { method: 'POST', body: JSON.stringify(input) })
    await load(false)
    notify(data.message || '任务已创建', 'ok')
  }, [load, notify])

  const saveConfig = useCallback(async (patch) => {
    const data = await api('config', { method: 'POST', body: JSON.stringify(patch) })
    setConfig(data.config)
    await load(true)
    return data
  }, [load])

  const testSource = useCallback(async (src) => api('source/test', { method: 'POST', body: JSON.stringify({ source: src }) }), [])

  const goTab = useCallback((next, opts = {}) => {
    setTab(next)
    if (opts.source !== undefined) setSource(opts.source)
    if (opts.tag !== undefined) setTag(opts.tag)
    if (opts.focusProject !== undefined) setFocusProject(opts.focusProject)
    if (opts.query !== undefined) setQuery(opts.query)
  }, [])

  const pickSource = useCallback((src) => {
    setSource(src)
    setTab('library')
  }, [])

  const pickTag = useCallback((value) => {
    setTag(value)
    setTab('library')
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && preview) setPreview(null)
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault()
        if (searchRef.current) searchRef.current.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  const navItems = [
    { key: 'overview', label: '总览', icon: 'grid' },
    { key: 'library', label: '文档库', icon: 'book', count: snap?.stats?.totalDocs },
    { key: 'map', label: '知识地图', icon: 'map' },
    { key: 'todos', label: '待办', icon: 'check', count: snap?.stats?.todo?.open },
    { key: 'settings', label: '设置', icon: 'settings' },
  ]

  const mode = snap?.mode || 'demo'
  const statusText = mode === 'live' ? '全部真实数据' : mode === 'demo' ? '演示模式' : '混合模式'

  return h('div', { className: 'kb-root', 'data-kb-theme': theme }, [
    h('style', { key: 'css' }, CSS),
    h('header', { key: 'header', className: 'kb-header' }, [
      h('div', { key: 'brand', className: 'kb-brand' }, [
        h('div', { key: 'logo', className: 'kb-logo' }, h(KnowledgeIcon, { size: 20, active: true })),
        h('div', { key: 'text', className: 'kb-brandtext' }, [h('b', { key: 't' }, 'KNOWLEDGE OS'), h('span', { key: 's' }, '个人知识中枢')]),
      ]),
      h(
        'nav',
        { key: 'nav', className: 'kb-nav' },
        navItems.map((item) =>
          h(
            'button',
            { key: item.key, type: 'button', 'data-on': tab === item.key ? '1' : '0', onClick: () => goTab(item.key) },
            [item.label, item.count !== undefined && item.count !== null ? h('em', { key: 'c' }, item.count) : null],
          ),
        ),
      ),
      h('div', { key: 'spacer', className: 'kb-headspacer' }),
      h('div', { key: 'search', className: 'kb-search' }, [
        h(Ico, { key: 'i', name: 'search', size: 13 }),
        h('input', {
          key: 'in',
          ref: searchRef,
          value: query,
          placeholder: '搜索所有知识库…',
          onChange: (e) => {
            setQuery(e.target.value)
            if (e.target.value && tab !== 'library') setTab('library')
          },
          'aria-label': '全局搜索',
        }),
        h('span', { key: 'k', className: 'kb-kbd' }, '⌘K'),
      ]),
      h('span', { key: 'status', className: 'kb-status', title: snap ? `上次同步 ${fmtFull(snap.generatedAt)}` : '' }, [
        h('span', { key: 'd', className: 'kb-dot', 'data-live': mode === 'live' ? '1' : undefined, 'data-demo': mode !== 'live' ? '1' : undefined }),
        statusText,
      ]),
      h('button', {
        key: 'sync',
        type: 'button',
        className: 'kb-iconbtn',
        title: '立即同步',
        'data-spin': syncing ? '1' : '0',
        disabled: syncing,
        onClick: sync,
      }, h(Ico, { name: 'sync', size: 14 })),
      h('button', {
        key: 'settings',
        type: 'button',
        className: 'kb-iconbtn',
        title: '连接与设置',
        onClick: () => goTab('settings'),
      }, h(Ico, { name: 'settings', size: 14 })),
    ]),
    h('div', { key: 'body', className: 'kb-body' },
      loading && !snap
        ? h(LoadingSkeleton, { key: 'loading' })
        : error && !snap
          ? h('div', { key: 'err', className: 'kb-empty', style: { height: '70%' } }, [
              h(Ico, { key: 'i', name: 'warn', size: 24 }),
              h('div', { key: 't', style: { fontSize: 14, color: 'var(--kb-text)' } }, '看板加载失败'),
              h('div', { key: 'm' }, error),
              h('div', { key: 'a', style: { display: 'flex', gap: 8 } }, [
                h('button', { key: 'r', type: 'button', className: 'kb-btn', onClick: () => { setLoading(true); load(false).catch(() => {}) } }, ['重试', h(Ico, { key: 'i', name: 'refresh', size: 12 })]),
                h('button', { key: 's', type: 'button', className: 'kb-btn', 'data-kind': 'ghost', onClick: () => goTab('settings') }, '检查设置'),
              ]),
            ])
          : snap
            ? h('div', { key: 'view', style: { minHeight: '100%' } }, [
                tab === 'overview'
                  ? h(OverviewView, {
                      key: 'overview',
                      snap,
                      apps,
                      openDoc,
                      openApp,
                      openUrl,
                      toggleTodo,
                      goTab,
                      pickSource,
                      pickTag,
                      sync,
                      syncing,
                      notify,
                    })
                  : null,
                tab === 'library'
                  ? h(LibraryView, {
                      key: 'library',
                      snap,
                      apps,
                      openDoc,
                      openApp,
                      query,
                      setQuery,
                      source,
                      setSource,
                      tag,
                      setTag,
                      openDoc,
                      openUrl,
                      notify,
                      sync,
                      syncing,
                    })
                  : null,
                tab === 'map' ? h(MapView, { key: 'map', snap, apps, openDoc, openApp, openUrl, goTab, pickSource }) : null,
                tab === 'todos'
                  ? h(TodosView, {
                      key: 'todos',
                      snap,
                      openApp,
                      toggleTodo,
                      createTodo,
                      notify,
                      focusProject,
                      setFocusProject,
                    })
                  : null,
                tab === 'settings'
                  ? h(SettingsView, {
                      key: 'settings',
                      snap,
                      apps,
                      openApp,
                      config,
                      saveConfig,
                      testSource,
                      notify,
                      syncing,
                    })
                  : null,
              ])
            : null,
    ),
    preview ? h(PreviewDrawer, { key: 'preview', preview, apps, onClose: () => setPreview(null), onOpen: openUrl, onOpenApp: openApp, notify, goSettings: () => { setPreview(null); goTab('settings') } }) : null,
    toast ? h('div', { key: 'toast', className: 'kb-toast', 'data-kind': toast.kind === 'err' ? 'err' : toast.kind === 'ok' ? 'ok' : undefined }, [
      h(Ico, { key: 'i', name: toast.kind === 'err' ? 'warn' : 'check', size: 13 }),
      h('span', { key: 't' }, toast.message),
    ]) : null,
  ])
}

/* ------------------------------------------------------------- error guard */
class KBErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    try {
      console.error('[knowledge-board]', error)
    } catch {
      /* ignore */
    }
  }

  render() {
    if (this.state.error) {
      return h('div', { className: 'kb-root', 'data-kb-theme': 'dark' }, [
        h('style', { key: 'css' }, CSS),
        h('div', { key: 'f', className: 'kb-empty', style: { height: '100%' } }, [
          h(Ico, { key: 'i', name: 'warn', size: 24 }),
          h('div', { key: 't', style: { fontSize: 14, color: 'var(--kb-text)' } }, '看板渲染出错'),
          h('div', { key: 'm', style: { maxWidth: 560, lineHeight: 1.6 } }, String(this.state.error?.message || this.state.error)),
          h('button', {
            key: 'r',
            type: 'button',
            className: 'kb-btn',
            onClick: () => this.setState({ error: null }),
          }, ['重新加载面板', h(Ico, { key: 'i', name: 'refresh', size: 12 })]),
        ]),
      ])
    }
    return this.props.children
  }
}

/* ---------------------------------------------------------------- register */
return {
  inject: ['slots', 'theme', 'locale'],
  apply(ctx) {
    const label = () => (isZh(ctx) ? '知识看板' : 'Knowledge Board')
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register(
        { name: 'sidebar.panellist', id: 'knowledge-board', order: 13, label },
        (props) => h(KnowledgeIcon, { size: props && props.size ? props.size : 22, active: props && props.active }),
      ),
    )
    ctx.slots.inject('main', () =>
      ctx.slots.register({ name: 'main', key: 'knowledge-board' }, () => h(KBErrorBoundary, null, h(KnowledgePanel, { ctx }))),
    )
  },
}
