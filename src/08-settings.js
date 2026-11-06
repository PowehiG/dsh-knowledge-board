/* --------------------------------------------------------------- settings */
function SettingsView({ snap, apps, openApp, config, saveConfig, testSource, notify, syncing }) {
  const cfg = config || snap.config || {}
  const [vaults, setVaults] = useState((cfg.obsidian?.vaults || []).join('\n'))
  const [notionToken, setNotionToken] = useState('')
  const [appId, setAppId] = useState(cfg.feishu?.appId || '')
  const [appSecret, setAppSecret] = useState('')
  const [baseUrl, setBaseUrl] = useState(cfg.feishu?.baseUrl || 'https://feishu.cn')
  const [didaToken, setDidaToken] = useState('')
  const [refreshMinutes, setRefreshMinutes] = useState(String(cfg.refreshMinutes || 5))
  const [demoFill, setDemoFill] = useState(cfg.demoFill !== false)
  const [onlyMine, setOnlyMine] = useState(cfg.feishu?.onlyMine !== false)
  const [wikiSpace, setWikiSpace] = useState(cfg.feishu?.wikiSpace || '')
  const [authCheck, setAuthCheck] = useState(null)
  const [tests, setTests] = useState({})
  const [saving, setSaving] = useState(false)

  const sourceState = (id) => {
    if (id === 'dida') return snap.todoSource || {}
    return (snap.sources || []).find((s) => s.id === id) || {}
  }

  const runTest = async (source) => {
    setTests((t) => ({ ...t, [source]: { busy: true, text: '正在连接…' } }))
    try {
      const res = await testSource(source)
      const warnings = (res.warnings || []).filter(Boolean).join('\n')
      setTests((t) => ({ ...t, [source]: { ok: true, text: `连接成功 · ${res.count} 条${warnings ? '\n' + warnings : ''}` } }))
    } catch (e) {
      setTests((t) => ({ ...t, [source]: { ok: false, text: e.message || '连接失败' } }))
    }
  }

  const persist = async (patch, message) => {
    setSaving(true)
    try {
      await saveConfig(patch)
      notify(message || '设置已保存，正在同步…', 'ok')
      setNotionToken('')
      setAppSecret('')
      setDidaToken('')
    } catch (e) {
      notify(e.message || '保存失败', 'err')
    } finally {
      setSaving(false)
    }
  }

  const saveAll = () => {
    const patch = {
      obsidian: { vaults: vaults.split('\n').map((v) => v.trim()).filter(Boolean) },
      feishu: { appId: appId.trim(), baseUrl: baseUrl.trim() || 'https://feishu.cn', onlyMine, wikiSpace: wikiSpace.trim() },
      refreshMinutes: Number(refreshMinutes) || 5,
      demoFill,
      notion: notionToken.trim() ? { token: notionToken.trim() } : {},
      dida: didaToken.trim() ? { token: didaToken.trim() } : {},
    }
    if (appSecret.trim()) patch.feishu.appSecret = appSecret.trim()
    persist(patch, '设置已保存，已按新配置同步')
  }

  const statePill = (source) => {
    const src = sourceState(source)
    const state = src.state || 'off'
    return h('span', { key: 's', className: 'kb-setstate' }, [
      h('span', { key: 'd', className: 'kb-dot', 'data-live': state === 'live' ? '1' : undefined, 'data-demo': state === 'demo' ? '1' : undefined, 'data-err': state === 'error' ? '1' : undefined }),
      state === 'live' ? `已连接 · ${src.count ?? src.projects?.length ?? 0}` : state === 'demo' ? '演示数据' : state === 'error' ? '连接异常' : '未启用',
    ])
  }

  const card = (opts) =>
    h('section', { key: opts.key, className: 'kb-setcard', style: { '--kb-src': opts.color } }, [
      h('div', { key: 'top', className: 'kb-settop' }, [
        h('span', { key: 'l', className: 'kb-setlogo' }, h(SourceGlyph, { source: opts.key, size: 16 })),
        h('h3', { key: 't' }, opts.name),
        statePill(opts.key),
      ]),
      h('p', { key: 'd', className: 'kb-setdesc' }, opts.desc),
      ...(opts.fields || []),
      opts.extra || null,
      h('div', { key: 'a', className: 'kb-setactions' }, [
        h('button', { key: 'test', type: 'button', className: 'kb-btn', 'data-kind': 'ghost', onClick: () => runTest(opts.key), disabled: tests[opts.key]?.busy }, [
          h(Ico, { key: 'i', name: 'bolt', size: 12 }),
          tests[opts.key]?.busy ? '测试中…' : '测试连接',
        ]),
        opts.configured
          ? h('button', {
              key: 'clear',
              type: 'button',
              className: 'kb-btn',
              'data-kind': 'danger',
              onClick: () => persist(opts.clearPatch, `${opts.name} 凭证已清除`),
            }, '清除凭证')
          : null,
        h('span', { key: 'g', style: { flex: 1 } }),
        h('span', {
          key: 'st',
          style: { fontSize: '9.5px', color: 'var(--kb-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '46%' },
          title: sourceState(opts.key).error || '',
        }, sourceState(opts.key).error ? '有错误信息' : sourceState(opts.key).home || ''),
      ]),
      tests[opts.key]?.text
        ? h('div', { key: 'tr', className: 'kb-testout', 'data-ok': tests[opts.key].ok ? '1' : undefined, 'data-err': tests[opts.key].ok === false ? '1' : undefined }, tests[opts.key].text)
        : null,
      sourceState(opts.key).error
        ? h('div', { key: 'er', className: 'kb-testout', 'data-err': '1' }, sourceState(opts.key).error + ((sourceState(opts.key).warnings || []).length ? '\n' + sourceState(opts.key).warnings.join('\n') : ''))
        : (sourceState(opts.key).warnings || []).length
          ? h('div', { key: 'wn', className: 'kb-testout', 'data-err': '1' }, sourceState(opts.key).warnings.join('\n'))
          : null,
      opts.hint ? h('div', { key: 'h', className: 'kb-hint' }, opts.hint) : null,
    ])

  const field = (label, control, key) => h('div', { key: key || label, className: 'kb-field' }, [h('label', { key: 'l' }, label), control])

  return h('div', { className: 'kb-page' }, [
    h('div', { key: 'head', className: 'kb-pagehead' }, [
      h('div', { key: 'l' }, [
        h('h1', { key: 'h' }, '连接与设置'),
        h('p', { key: 's' }, 'Token 只保存在本机；未配置的来源会用演示数据填充，随时可替换为真实账号。'),
      ]),
      h('div', { key: 'r', className: 'kb-actions' }, [
        h('button', { key: 'save', type: 'button', className: 'kb-btn', onClick: saveAll, disabled: saving || syncing }, [
          h(Ico, { key: 'i', name: saving ? 'refresh' : 'check', size: 13 }),
          saving ? '保存中…' : syncing ? '同步中…' : '保存全部设置',
        ]),
      ]),
    ]),
    h('div', { key: 'grid', className: 'kb-settings' }, [
      card({
        key: 'obsidian',
        name: 'Obsidian',
        color: '#a78bfa',
        desc: '直接扫描本机 Vault 里的 Markdown：标题、标签、双链、字数和目录全部离线计算，预览就是原文。',
        configured: Boolean(cfg.obsidian?.vaults?.length),
        clearPatch: { obsidian: { vaults: [] } },
        fields: [
          field('Vault 路径（一行一个，支持多个库）', h('textarea', {
            key: 'v',
            className: 'kb-input',
            value: vaults,
            placeholder: '/Users/you/Documents/Obsidian Vault',
            onChange: (e) => setVaults(e.target.value),
            spellCheck: false,
          })),
        ],
        hint: h('span', null, '默认会自动探测 ~/Documents/Obsidian Vault。修改后点右上角「保存全部设置」。'),
      }),
      card({
        key: 'notion',
        name: 'Notion',
        color: '#c7cbd4',
        desc: '通过 Notion Integration 搜索页面与数据库，读取标题、标签、更新时间与正文块。',
        configured: Boolean(cfg.notion?.configured),
        clearPatch: { notion: { token: null } },
        fields: [
          field('Integration Token', h('input', {
            key: 't',
            type: 'password',
            className: 'kb-input',
            value: notionToken,
            placeholder: cfg.notion?.configured ? `已保存 ${cfg.notion.token}（留空不修改）` : 'secret_… 或 ntn_…',
            onChange: (e) => setNotionToken(e.target.value),
            autoComplete: 'off',
          })),
        ],
        hint: h('span', null, [
          '在 ',
          h('a', { key: 'a', href: 'https://www.notion.so/my-integrations', target: '_blank', rel: 'noopener noreferrer' }, 'Notion Integrations'),
          ' 创建内部集成，拿到 Token 后，别忘了在目标页面右上角 ··· → 连接 里把集成加进去。',
        ]),
      }),
      card({
        key: 'feishu',
        name: '飞书文档',
        color: '#3370ff',
        desc: '用企业自建应用的 tenant_access_token 读取知识库节点与云文档列表；docx 支持正文预览。',
        configured: Boolean(cfg.feishu?.configured),
        clearPatch: { feishu: { appId: '', appSecret: null } },
        fields: [
          h('div', { key: 'row', className: 'kb-fieldrow' }, [
            field('App ID', h('input', { key: 'id', className: 'kb-input', value: appId, placeholder: 'cli_…', onChange: (e) => setAppId(e.target.value), spellCheck: false })),
            field('App Secret', h('input', { key: 'sec', type: 'password', className: 'kb-input', value: appSecret, placeholder: cfg.feishu?.configured ? `已保存 ${cfg.feishu.appSecret}` : 'App Secret', onChange: (e) => setAppSecret(e.target.value), autoComplete: 'off' })),
          ]),
          field('租户域名', h('input', { key: 'url', className: 'kb-input', value: baseUrl, placeholder: 'https://xxx.feishu.cn 或 https://feishu.cn', onChange: (e) => setBaseUrl(e.target.value), spellCheck: false })),
          field('知识库空间（可选）', h('input', { key: 'wiki', className: 'kb-input', value: wikiSpace, placeholder: '留空=全部知识库；也可填空间名称或 space_id', onChange: (e) => setWikiSpace(e.target.value), spellCheck: false })),
        ],
        extra: h('div', { key: 'authwrap' }, [
          h('div', { key: 'only', className: 'kb-settingrow', style: { alignItems: 'flex-start', gap: 10 } }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, '只显示我的飞书文档'),
              h('div', { key: 'd', className: 'kb-sr2' }, '开启时只同步「我的空间」；未授权或关闭时回退到租户搜索（会混入模板）。'),
            ]),
            h('button', {
              key: 'sw',
              type: 'button',
              className: 'kb-switch',
              'data-on': onlyMine ? '1' : '0',
              'aria-pressed': onlyMine,
              title: onlyMine ? '已开启' : '已关闭',
              onClick: () => setOnlyMine((v) => !v),
            }),
          ]),
          h('div', { key: 'auth', className: 'kb-settingrow', style: { alignItems: 'flex-start', gap: 10 } }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, cfg.feishu?.authorized ? `个人授权：${cfg.feishu.userName || '已授权'}` : '读取「我的空间」'),
              h('div', { key: 'd', className: 'kb-sr2' }, cfg.feishu?.authorized
                ? '当前只同步你个人「我的空间」里的文档，不再混入模板库。'
                : '租户 token 看不到个人空间，只能搜索到模板；授权后只同步你自己的文档。'),
              !cfg.feishu?.authorized
                ? h('div', { key: 'u', className: 'kb-mono', style: { marginTop: 5 } }, `回调地址：${cfg.feishu?.redirectUri || 'http://127.0.0.1:17890/knowledge-board/oauth/callback'}`)
                : null,
            ]),
            h('div', { key: 'b', style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' } }, [
              h('button', {
                key: 'go',
                type: 'button',
                className: 'kb-btn',
                onClick: () => window.open('http://127.0.0.1:17890/knowledge-board/oauth/start', '_blank', 'noopener,noreferrer'),
              }, [h(Ico, { key: 'i', name: 'lock', size: 12 }), cfg.feishu?.authorized ? '重新授权' : '授权读取我的飞书文档']),
              h('button', {
                key: 'check',
                type: 'button',
                className: 'kb-btn',
                'data-kind': 'ghost',
                onClick: async () => {
                  setAuthCheck({ busy: true, text: '正在检查飞书回调地址…' })
                  try {
                    const r = await api('feishu/oauth/check')
                    setAuthCheck({ ok: r.ok, text: r.message || (r.ok ? '回调地址可用' : '回调地址未登记') })
                  } catch (e) {
                    setAuthCheck({ ok: false, text: e.message || '检查失败' })
                  }
                },
              }, [h(Ico, { key: 'i', name: 'warn', size: 12 }), authCheck?.busy ? '检查中…' : '检测回调地址']),
              cfg.feishu?.authorized
                ? h('button', {
                    key: 'out',
                    type: 'button',
                    className: 'kb-btn',
                    'data-kind': 'danger',
                    onClick: () => persist({ feishu: { userAuth: null } }, '已取消飞书个人授权'),
                  }, '取消授权')
                : null,
            ]),
          ]),
          authCheck?.text
            ? h('div', { key: 'chk', className: 'kb-testout', 'data-ok': authCheck.ok ? '1' : undefined, 'data-err': authCheck.ok === false ? '1' : undefined, style: { marginTop: 8 } }, authCheck.text)
            : null,
        ]),
        hint: h('span', null, [
          '在 ',
          h('a', { key: 'a', href: 'https://open.feishu.cn/app', target: '_blank', rel: 'noopener noreferrer' }, '飞书开放平台'),
          ' 创建企业自建应用，开通「云文档 / 知识库」读取权限并发布版本。域名填飞书文档地址的 origin（例如 https://abc.feishu.cn）；个人版没有独立前缀时填 https://feishu.cn，也可以直接粘贴任意一篇文档链接。',
          h('br', { key: 'b' }),
          '个人授权前还需在「安全设置 → 重定向 URL」添加上面的回调地址，并在「权限管理」开通 drive:drive、docx:document:readonly、wiki:wiki:readonly、offline_access。',
          h('br', { key: 'c' }),
          '如果知识库看不到，先开通 wiki:wiki:readonly 并发布，再点「重新授权」补上该权限；授权后这里可以填空间名称，只同步那一个知识库。',
        ]),
      }),
      card({
        key: 'dida',
        name: '滴答清单',
        color: '#f5a524',
        desc: '读取清单与任务，支持在看板里勾选完成、快速添加；数据来自滴答开放平台。',
        configured: Boolean(cfg.dida?.configured),
        clearPatch: { dida: { token: null } },
        fields: [
          field('个人 API Token', h('input', {
            key: 't',
            type: 'password',
            className: 'kb-input',
            value: didaToken,
            placeholder: cfg.dida?.configured ? `已保存 ${cfg.dida.token}（留空不修改）` : 'Open API Access Token',
            onChange: (e) => setDidaToken(e.target.value),
            autoComplete: 'off',
          })),
        ],
        hint: h('span', null, [
          '打开 ',
          h('a', { key: 'a', href: 'https://dida365.com/webapp/', target: '_blank', rel: 'noopener noreferrer' }, '滴答网页版'),
          ' → 左上角头像 → 设置 → 账户 → API Token，创建并复制后填在这里。',
          h('br', { key: 'b' }),
          '开发者后台（developer.dida365.com/manage）里的 Client ID / Client Secret 是给 OAuth 应用用的，不是这个 Token。',
        ]),
      }),
      h('section', { key: 'general', className: 'kb-setcard', 'data-wide': '1', style: { '--kb-src': '#6d8cff' } }, [
        h('div', { key: 'top', className: 'kb-settop' }, [
          h('span', { key: 'l', className: 'kb-setlogo' }, h(Ico, { name: 'settings', size: 16 })),
          h('h3', { key: 't' }, '通用'),
          h('span', { key: 's', className: 'kb-setstate' }, [
            h('span', { key: 'd', className: 'kb-dot', 'data-live': snap.mode === 'live' ? '1' : undefined, 'data-demo': snap.mode === 'demo' ? '1' : undefined }),
            snap.mode === 'live' ? '全部真实数据' : snap.mode === 'demo' ? '演示模式' : '混合模式',
          ]),
        ]),
        h('div', { key: 'rows' }, [
          h('div', { key: 'r1', className: 'kb-settingrow' }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, '自动刷新间隔'),
              h('div', { key: 'd', className: 'kb-sr2' }, '打开看板时，超过这个时间会重新同步一次；也可随时点右上角刷新。'),
            ]),
            h('select', { key: 's', className: 'kb-select', value: refreshMinutes, onChange: (e) => setRefreshMinutes(e.target.value), 'aria-label': '刷新间隔' }, [
              h('option', { key: '1', value: '1' }, '1 分钟'),
              h('option', { key: '5', value: '5' }, '5 分钟'),
              h('option', { key: '15', value: '15' }, '15 分钟'),
              h('option', { key: '30', value: '30' }, '30 分钟'),
              h('option', { key: '120', value: '120' }, '2 小时'),
            ]),
          ]),
          h('div', { key: 'r2', className: 'kb-settingrow' }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, '未接入的来源使用演示数据'),
              h('div', { key: 'd', className: 'kb-sr2' }, '关闭后，未配置的来源会显示为空，而不是示例文档。'),
            ]),
            h('button', {
              key: 'sw',
              type: 'button',
              className: 'kb-switch',
              'data-on': demoFill ? '1' : '0',
              'aria-pressed': demoFill,
              onClick: () => setDemoFill((v) => !v),
              title: demoFill ? '已开启' : '已关闭',
            }),
          ]),
          h('div', { key: 'r-apps', className: 'kb-settingrow' }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, '本机应用'),
              h('div', { key: 'd', className: 'kb-sr2' }, '已自动识别并配置深链；演示文档也会跳到对应应用。'),
            ]),
            h('div', { key: 'b', style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' } },
              ['obsidian', 'notion', 'feishu', 'dida'].map((id) => {
                const app = apps?.[id]
                return h('button', {
                  key: id,
                  type: 'button',
                  className: 'kb-chip',
                  title: app?.installed ? `打开 ${app.name}` : `${SOURCE_INFO[id]?.name || id} 未安装`,
                  disabled: !app?.installed,
                  onClick: () => { if (app?.installed) openApp(id) },
                }, [
                  h(SourceGlyph, { key: 'g', source: id, size: 11 }),
                  app?.installed ? app.name : `${SOURCE_INFO[id]?.short || id} · 未安装`,
                ])
              }),
            ),
          ]),
          h('div', { key: 'r3', className: 'kb-settingrow' }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, '数据目录'),
              h('div', { key: 'd', className: 'kb-sr2' }, '配置文件（含 Token）与本机缓存都放在这里，权限 600。'),
            ]),
            h('span', { key: 'v', className: 'kb-mono' }, cfg.dataDir || '~/.dsh/storages/knowledge-board'),
          ]),
          h('div', { key: 'r4', className: 'kb-settingrow' }, [
            h('div', { key: 'l', className: 'kb-grow' }, [
              h('div', { key: 't', className: 'kb-sr1' }, '最近同步'),
              h('div', { key: 'd', className: 'kb-sr2' }, `${fmtFull(snap.generatedAt)} · ${snap.documents.length} 篇文档 · ${snap.todos.length} 条任务`),
            ]),
            h('button', { key: 'sync', type: 'button', className: 'kb-btn', 'data-kind': 'ghost', onClick: () => persist({}, '已触发同步'), disabled: syncing }, [h(Ico, { key: 'i', name: 'sync', size: 12 }), '立即同步']),
          ]),
        ]),
        h('div', { key: 'sec', className: 'kb-hint', style: { marginTop: 10, display: 'flex', gap: 6, alignItems: 'flex-start' } }, [
          h(Ico, { key: 'i', name: 'lock', size: 12, style: { marginTop: 2, flex: '0 0 auto' } }),
          h('span', { key: 't' }, '所有请求都从本机直接发往官方 API；Token 不会写入日志，也不会发给模型。但请注意：本插件注册的 Agent 工具可以让模型读取文档统计与标题，不会读取 Token。'),
        ]),
      ]),
    ]),
  ])
}
