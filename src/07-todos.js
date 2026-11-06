/* ------------------------------------------------------------------ todos */
function TodosView({ snap, toggleTodo, createTodo, notify, openApp, focusProject, setFocusProject }) {
  const stats = snap.stats
  const [quick, setQuick] = useState('')
  const [quickProject, setQuickProject] = useState('')
  const [quickDate, setQuickDate] = useState('')
  const [quickPriority, setQuickPriority] = useState('0')
  const [busy, setBusy] = useState({})
  const [adding, setAdding] = useState(false)
  const [showDone, setShowDone] = useState(true)
  const projects = stats.todo.projects || []
  const activeProject = focusProject || 'all'
  const todos = snap.todos || []
  const today = stats.today
  const weekEnd = stats.weekEnd

  useEffect(() => {
    if (!quickProject && projects.length) setQuickProject(projects[0].id)
  }, [projects, quickProject])

  const scoped = todos.filter((t) => activeProject === 'all' || t.projectId === activeProject)
  const open = scoped.filter((t) => !t.completed)
  const columns = [
    { key: 'overdue', title: '已逾期', color: '#fb7185', items: open.filter((t) => t.dueDay && t.dueDay < today) },
    { key: 'today', title: '今天', color: '#f5a524', items: open.filter((t) => t.dueDay === today) },
    { key: 'week', title: '本周', color: '#6d8cff', items: open.filter((t) => t.dueDay && t.dueDay > today && t.dueDay <= weekEnd) },
    { key: 'later', title: '以后', color: '#8b95a8', items: open.filter((t) => !t.dueDay || t.dueDay > weekEnd) },
  ]
  const done = scoped
    .filter((t) => t.completed)
    .sort((a, b) => String(b.completedTime || '').localeCompare(String(a.completedTime || '')))

  const doToggle = async (todo, completed) => {
    setBusy((b) => ({ ...b, [todo.id]: true }))
    try {
      await toggleTodo(todo, completed)
    } catch (e) {
      notify(e.message || '操作失败', 'err')
    } finally {
      setBusy((b) => ({ ...b, [todo.id]: false }))
    }
  }

  const submit = async () => {
    const title = quick.trim()
    if (!title) {
      notify('先写下要做的事', 'err')
      return
    }
    setAdding(true)
    try {
      await createTodo({ title, projectId: quickProject || projects[0]?.id, dueDay: quickDate || null, priority: Number(quickPriority) || 0 })
      setQuick('')
      setQuickDate('')
      setQuickPriority('0')
    } catch (e) {
      notify(e.message || '添加失败', 'err')
    } finally {
      setAdding(false)
    }
  }

  const taskMeta = (todo) => [
    h('span', { key: 'p', className: 'kb-taskproj', style: { '--pc': todo.projectColor } }, [h('i', { key: 'i' }), todo.projectName]),
    todo.dueDay
      ? h('span', { key: 'd', className: 'kb-taskdue', 'data-overdue': todo.dueDay < today ? '1' : undefined, 'data-today': todo.dueDay === today ? '1' : undefined }, fmtDue(todo.dueDay, todo.dueTime))
      : null,
    todo.priority >= 5 ? h('span', { key: 'f', className: 'kb-flag', 'data-p': '5' }, '高') : todo.priority === 3 ? h('span', { key: 'f', className: 'kb-flag', 'data-p': '3' }, '中') : null,
    todo.demo ? h('span', { key: 'dm', style: { opacity: 0.55 } }, '演示') : null,
    todo.url || snap.apps?.dida?.installed
      ? h('button', {
          key: 'o',
          type: 'button',
          className: 'kb-miniaction kb-tasklink',
          title: '在滴答清单打开',
          onClick: () => {
            if (todo.url) window.open(todo.url, '_blank', 'noopener,noreferrer')
            else openApp('dida')
          },
        }, h(Ico, { name: 'external', size: 11 }))
      : null,
  ]

  return h('div', { className: 'kb-page' }, [
    h('div', { key: 'head', className: 'kb-pagehead' }, [
      h('div', { key: 'l' }, [
        h('h1', { key: 'h' }, '待办规划'),
        h('p', { key: 's' }, `${stats.todo.open} 项进行中 · 今日 ${stats.todo.today} · 逾期 ${stats.todo.overdue} · 与滴答清单同步`),
      ]),
      h('div', { key: 'r', className: 'kb-actions' }, [
        h('button', {
          key: 'dida',
          type: 'button',
          className: 'kb-btn',
          'data-kind': 'ghost',
          onClick: () => {
            if (snap.apps?.dida?.installed) openApp('dida')
            else window.open('https://dida365.com/webapp/#q/all/tasks', '_blank', 'noopener,noreferrer')
          },
        }, [h(SourceGlyph, { key: 'i', source: 'dida', size: 13 }), '打开滴答清单']),
      ]),
    ]),
    h('div', { key: 'stats', className: 'kb-todostats' }, [
      { key: 'today', label: '今天到期', value: stats.todo.today, color: '#f5a524', icon: 'clock' },
      { key: 'overdue', label: '已逾期', value: stats.todo.overdue, color: '#fb7185', icon: 'alert' },
      { key: 'week', label: '本周计划', value: stats.todo.week, color: '#6d8cff', icon: 'calendar' },
      { key: 'done', label: '近 7 天完成', value: stats.todo.done7d, color: '#34d399', icon: 'check' },
    ].map((item) =>
      h('div', { key: item.key, className: 'kb-tstat', style: { '--kb-tc': item.color } }, [
        h('span', { key: 'i', className: 'kb-ticon' }, h(Ico, { name: item.icon, size: 15 })),
        h('div', { key: 't' }, [h('b', { key: 'v' }, String(item.value)), h('span', { key: 'l' }, item.label)]),
      ]),
    )),
    h('div', { key: 'layout', className: 'kb-todolayout' }, [
      h('aside', { key: 'rail', className: 'kb-projectrail' }, [
        h('div', { style: { fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--kb-faint)', padding: '0 9px 6px' }, key: 'l' }, '清单'),
        h('button', { key: 'all', type: 'button', className: 'kb-project', 'data-on': activeProject === 'all' ? '1' : '0', onClick: () => setFocusProject('all') }, [
          h('i', { key: 'i', style: { '--pc': '#8b95a8', background: '#8b95a8' } }),
          h('span', { key: 'n' }, '全部'),
          h('b', { key: 'c' }, stats.todo.open),
        ]),
        ...projects.map((p) =>
          h('button', { key: p.id, type: 'button', className: 'kb-project', 'data-on': activeProject === p.id ? '1' : '0', onClick: () => setFocusProject(p.id) }, [
            h('i', { key: 'i', style: { background: p.color } }),
            h('span', { key: 'n' }, p.name),
            h('b', { key: 'c' }, p.open),
          ]),
        ),
        h('div', { key: 'note', style: { marginTop: 'auto', padding: '12px 9px 0', fontSize: 10, color: 'var(--kb-faint)', lineHeight: 1.6 } }, [
          snap.todoSource?.state === 'live'
            ? '已连接滴答清单 Open API，勾选会直接同步到原应用。'
            : '当前为演示清单。在「设置」里填入滴答 Access Token 后即可同步真实任务。',
        ]),
      ]),
      h('div', { key: 'main', style: { minWidth: 0 } }, [
        h('div', { key: 'quick', className: 'kb-quickadd' }, [
          h('input', {
            key: 't',
            className: 'kb-input',
            placeholder: '添加一个任务，回车即可创建…',
            value: quick,
            onChange: (e) => setQuick(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter') submit() },
            'aria-label': '新任务标题',
          }),
          h('select', { key: 'p', className: 'kb-select', value: quickProject, onChange: (e) => setQuickProject(e.target.value), 'aria-label': '清单' },
            projects.map((p) => h('option', { key: p.id, value: p.id }, p.name)),
          ),
          h('input', { key: 'd', type: 'date', className: 'kb-select', value: quickDate, onChange: (e) => setQuickDate(e.target.value), 'aria-label': '截止日期' }),
          h('select', { key: 'pri', className: 'kb-select', value: quickPriority, onChange: (e) => setQuickPriority(e.target.value), 'aria-label': '优先级' }, [
            h('option', { key: '0', value: '0' }, '普通'),
            h('option', { key: '3', value: '3' }, '中优先级'),
            h('option', { key: '5', value: '5' }, '高优先级'),
          ]),
          h('button', { key: 'add', type: 'button', className: 'kb-btn', onClick: submit, disabled: adding }, [h(Ico, { name: 'plus', size: 12 }), adding ? '添加中…' : '添加']),
        ]),
        h('div', { key: 'cols', className: 'kb-columns' }, columns.map((col) =>
          h('section', { key: col.key, className: 'kb-column', style: { '--cc': col.color } }, [
            h('div', { key: 'h', className: 'kb-columnhead' }, [
              h('span', { key: 'd', className: 'kb-cdot' }),
              h('span', { key: 't' }, col.title),
              h('em', { key: 'c' }, col.items.length),
            ]),
            ...(col.items.length
              ? col.items.sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.dueDay || '').localeCompare(String(b.dueDay || ''))).map((todo) =>
                  h('article', { key: todo.id, className: 'kb-task', 'data-done': '0' }, [
                    h('div', { key: 't', className: 'kb-tasktop' }, [
                      h('button', {
                        key: 'c',
                        type: 'button',
                        className: 'kb-check',
                        'data-done': busy[todo.id] ? '1' : '0',
                        title: '标记完成',
                        onClick: () => doToggle(todo, true),
                      }, h(Ico, { name: 'check', size: 10, stroke: 2.4 })),
                      h('span', { key: 'x', className: 'kb-tasktitle' }, todo.title),
                    ]),
                    h('div', { key: 'm', className: 'kb-taskmeta' }, taskMeta(todo)),
                  ]),
                )
              : [h('div', { key: 'e', className: 'kb-columnempty' }, '这里是空的')]),
          ]),
        )),
        showDone && done.length
          ? h('div', { key: 'done', className: 'kb-donebox' }, [
              h('h4', { key: 'h' }, [h(Ico, { key: 'i', name: 'check', size: 12 }), `最近完成 · ${done.length}`, h('button', { key: 'x', type: 'button', className: 'kb-link', style: { marginLeft: 'auto' }, onClick: () => setShowDone(false) }, '收起')]),
              h('div', { key: 'l', className: 'kb-donelist' }, done.slice(0, 12).map((todo) =>
                h('button', {
                  key: todo.id,
                  type: 'button',
                  className: 'kb-donepill',
                  title: '点击恢复为未完成',
                  onClick: () => doToggle(todo, false),
                }, [h(Ico, { key: 'i', name: 'check', size: 10 }), todo.title, h('span', { key: 'p', style: { opacity: 0.6 } }, `· ${todo.projectName}`)]),
              )),
            ])
          : null,
      ]),
    ]),
  ])
}
