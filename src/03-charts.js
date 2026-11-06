/* ------------------------------------------------------------------ charts */
function useMeasureRef() {
  const ref = useRef(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(Math.max(220, el.clientWidth))
    update()
    let ro
    try {
      ro = new ResizeObserver(update)
      ro.observe(el)
    } catch {
      /* older browsers */
    }
    return () => {
      if (ro) ro.disconnect()
    }
  }, [])
  return [ref, width]
}

function Sparkline({ values, color = '#6d8cff', width = 72, height = 22 }) {
  const vals = (values || []).map((v) => Number(v) || 0)
  if (!vals.length) return null
  const max = Math.max(1, ...vals)
  const step = vals.length > 1 ? width / (vals.length - 1) : width
  const pts = vals.map((v, i) => [i * step, height - 3 - (v / max) * (height - 6)])
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`
  return h(
    'svg',
    { width, height, viewBox: `0 0 ${width} ${height}`, fill: 'none', 'aria-hidden': true },
    [
      h('polygon', { key: 'a', points: area, fill: color, opacity: '0.14' }),
      h('polyline', { key: 'l', points: line, stroke: color, strokeWidth: '1.4', strokeLinejoin: 'round', strokeLinecap: 'round' }),
      h('circle', { key: 'd', cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: '1.8', fill: color }),
    ],
  )
}

function AreaChart({ data, height = 176, color = '#6d8cff' }) {
  const [ref, width] = useMeasureRef()
  const [hover, setHover] = useState(-1)
  const items = data || []
  const padL = 26
  const padR = 8
  const padT = 12
  const padB = 22
  const innerW = Math.max(10, width - padL - padR)
  const innerH = height - padT - padB
  const max = Math.max(1, ...items.map((d) => Number(d.count) || 0))
  const yMax = max <= 4 ? max : Math.ceil(max / 5) * 5
  const x = (i) => padL + (items.length <= 1 ? innerW / 2 : (i / (items.length - 1)) * innerW)
  const y = (v) => padT + innerH - (Number(v) || 0) / yMax * innerH
  const line = items.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ')
  const area = `${line} L${x(items.length - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`
  const gridVals = [0, 0.5, 1].map((f) => Math.round(yMax * f))
  const labelsEvery = items.length > 8 ? 2 : 1

  const onMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const ratio = Math.min(1, Math.max(0, (px - padL) / innerW))
    const idx = Math.round(ratio * (items.length - 1))
    setHover(idx)
  }

  const hovered = hover >= 0 && hover < items.length ? items[hover] : null

  return h(
    'div',
    { className: 'kb-chart', ref, style: { height } },
    h(
      'svg',
      {
        width: '100%',
        height,
        viewBox: `0 0 ${width} ${height}`,
        onMouseMove: onMove,
        onMouseLeave: () => setHover(-1),
        role: 'img',
        'aria-label': '文档更新趋势',
      },
      [
        h('defs', { key: 'def' }, [
          h(
            'linearGradient',
            { key: 'g', id: 'kb-area-fill', x1: '0', y1: '0', x2: '0', y2: '1' },
            [
              h('stop', { key: 's1', offset: '0%', stopColor: color, stopOpacity: '.34' }),
              h('stop', { key: 's2', offset: '100%', stopColor: color, stopOpacity: '0' }),
            ],
          ),
        ]),
        ...gridVals.map((v, gi) =>
          h('g', { key: 'g' + gi }, [
            h('line', {
              key: 'l',
              x1: padL,
              x2: width - padR,
              y1: y(v),
              y2: y(v),
              stroke: 'currentColor',
              strokeOpacity: gi === 0 ? '.20' : '.09',
              strokeDasharray: gi === 0 ? '' : '3 4',
            }),
            h(
              'text',
              {
                key: 't',
                x: padL - 7,
                y: y(v) + 3,
                textAnchor: 'end',
                fontSize: '8.5',
                fill: 'currentColor',
                opacity: '.45',
              },
              String(v),
            ),
          ]),
        ),
        h('path', { key: 'area', d: area, fill: 'url(#kb-area-fill)' }),
        h('path', { key: 'line', d: line, fill: 'none', stroke: color, strokeWidth: '1.8', strokeLinejoin: 'round', strokeLinecap: 'round' }),
        ...items.map((d, i) =>
          i % labelsEvery === 0
            ? h(
                'text',
                {
                  key: 'x' + i,
                  x: x(i),
                  y: height - 6,
                  textAnchor: 'middle',
                  fontSize: '8.5',
                  fill: 'currentColor',
                  opacity: '.42',
                },
                d.label,
              )
            : null,
        ),
        hovered
          ? h('g', { key: 'h' }, [
              h('line', {
                key: 'v',
                x1: x(hover),
                x2: x(hover),
                y1: padT,
                y2: padT + innerH,
                stroke: color,
                strokeOpacity: '.45',
                strokeDasharray: '3 3',
              }),
              h('circle', { key: 'c', cx: x(hover), cy: y(hovered.count), r: '3.6', fill: color, stroke: 'var(--kb-bg)', strokeWidth: '1.6' }),
            ])
          : null,
      ],
    ),
    hovered
      ? h(
          'div',
          {
            className: 'kb-tip',
            style: { left: Math.min(width - 60, Math.max(60, x(hover))), top: y(hovered.count) - 2 },
          },
          [
            h('div', { key: 'w', style: { opacity: 0.6, fontSize: '9.5px', marginBottom: 2 } }, `周 ${hovered.start}`),
            h('b', { key: 'v' }, `${hovered.count} 篇更新`),
          ],
        )
      : null,
  )
}

function Donut({ segments, size = 150, thickness = 15, centerLabel = '文档', centerValue = 0 }) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return h(
    'div',
    { style: { position: 'relative', width: size, height: size, flex: '0 0 auto' } },
    h(
      'svg',
      { width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': true },
      [
        h('circle', { key: 'bg', cx: size / 2, cy: size / 2, r, fill: 'none', stroke: 'currentColor', strokeOpacity: '.08', strokeWidth: thickness }),
        ...segments.map((seg, i) => {
          const value = Number(seg.value) || 0
          const frac = total > 0 ? value / total : 0
          const dash = Math.max(0, frac * circ - 2.5)
          const el = h('circle', {
            key: i,
            cx: size / 2,
            cy: size / 2,
            r,
            fill: 'none',
            stroke: seg.color,
            strokeWidth: thickness,
            strokeDasharray: `${dash} ${circ - dash}`,
            strokeDashoffset: -offset,
            strokeLinecap: 'round',
            transform: `rotate(-90 ${size / 2} ${size / 2})`,
            opacity: value ? 1 : 0,
            style: { transition: 'stroke-dasharray .4s ease' },
          })
          offset += frac * circ
          return el
        }),
      ],
    ),
    h('div', { className: 'kb-donut-center' }, [
      h('b', { key: 'v' }, fmtNum(centerValue)),
      h('span', { key: 'l' }, centerLabel),
    ]),
  )
}

function Heatmap({ daily, weeks = 12 }) {
  const map = new Map((daily || []).map((d) => [d.day, d.count]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mondayOffset = (today.getDay() + 6) % 7
  const currentMonday = new Date(today.getTime() - mondayOffset * 864e5)
  const start = new Date(currentMonday.getTime() - (weeks - 1) * 7 * 864e5)
  const cells = []
  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start.getTime() + (w * 7 + d) * 864e5)
      const key = dayKey(date)
      const future = date.getTime() > today.getTime()
      const count = map.get(key) || 0
      const alpha = future ? 0 : count === 0 ? 0.08 : Math.min(1, 0.22 + count * 0.18)
      cells.push(
        h('i', {
          key: key + w + d,
          title: `${key} · ${count} 篇`,
          style: { background: future ? 'transparent' : `rgba(109,140,255,${alpha})`, border: future ? '1px dashed color-mix(in srgb, var(--kb-dim) 12%, transparent)' : 'none' },
        }),
      )
    }
  }
  return h(
    'div',
    null,
    h('div', { className: 'kb-heat', style: { gridTemplateRows: 'repeat(7, 1fr)' } }, cells),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, fontSize: 9.5, color: 'var(--kb-faint)' } },
      [
        h('span', { key: 'a' }, `${weeks} 周前`),
        h('span', { key: 'b', style: { display: 'flex', alignItems: 'center', gap: 4 } }, [
          h('span', { key: 'l' }, '少'),
          [0.10, 0.30, 0.50, 0.72, 1].map((a) => h('i', { key: a, style: { width: 8, height: 8, borderRadius: 2, background: `rgba(109,140,255,${a})`, display: 'inline-block' } })),
          h('span', { key: 'm' }, '多'),
        ]),
        h('span', { key: 'c' }, '今天'),
      ],
    ),
  )
}

function BarList({ items, max, color = '#6d8cff', onClick, valueLabel }) {
  const top = Math.max(1, Number(max) || Math.max(1, ...items.map((i) => Number(i.count) || 0)))
  return h(
    'div',
    { className: 'kb-barlist' },
    items.map((item) =>
      h(
        'div',
        {
          key: item.key || item.label,
          className: 'kb-barrow',
          'data-click': onClick ? '1' : '0',
          onClick: onClick ? () => onClick(item) : undefined,
          title: item.title || item.label,
        },
        [
          h('span', { key: 'l' }, item.label),
          h('span', { key: 'b', className: 'kb-bar' }, h('i', { style: { width: Math.max(3, ((Number(item.count) || 0) / top) * 100) + '%', background: color } })),
          h('b', { key: 'c' }, valueLabel ? valueLabel(item) : fmtNum(item.count)),
        ],
      ),
    ),
  )
}
