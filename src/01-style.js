/* ------------------------------------------------------------------ styles */
const CSS = `
.kb-root{
  --kb-cyan:#22d3ee; --kb-indigo:#6d8cff; --kb-violet:#a78bfa; --kb-pink:#f472b6;
  --kb-amber:#f5a524; --kb-green:#34d399; --kb-red:#fb7185;
  --kb-obsidian:#a78bfa; --kb-notion:#c7cbd4; --kb-feishu:#3370ff; --kb-dida:#f5a524;
  --kb-bg:var(--dsw-alias-bg-base);
  --kb-panel:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 88%, transparent);
  --kb-panel-2:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 72%, transparent);
  --kb-line:var(--dsw-alias-border-l1);
  --kb-line-2:var(--dsw-alias-border-l2);
  --kb-text:var(--dsw-alias-label-primary);
  --kb-dim:var(--dsw-alias-label-secondary);
  --kb-faint:color-mix(in srgb, var(--kb-dim) 62%, transparent);
  --kb-shadow:0 18px 50px rgba(4,8,20,.28);
  --kb-radius:16px;
  position:relative; height:100%; width:100%; min-height:0; display:flex; flex-direction:column;
  overflow:hidden; color:var(--kb-text); font-size:13px; line-height:1.5;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  background:
    radial-gradient(1100px 560px at 14% -14%, rgba(109,140,255,.20), transparent 62%),
    radial-gradient(880px 520px at 98% 108%, rgba(34,211,238,.13), transparent 60%),
    radial-gradient(680px 420px at 54% 38%, rgba(167,139,250,.07), transparent 68%),
    var(--kb-bg);
  -webkit-font-smoothing:antialiased;
}
.kb-root[data-kb-theme="light"]{
  --kb-notion:#4b5563;
  --kb-panel:color-mix(in srgb, #ffffff 88%, transparent);
  --kb-panel-2:color-mix(in srgb, #ffffff 70%, transparent);
  --kb-shadow:0 18px 44px rgba(28,40,80,.10);
  background:
    radial-gradient(1100px 560px at 14% -14%, rgba(109,140,255,.15), transparent 62%),
    radial-gradient(880px 520px at 98% 108%, rgba(34,211,238,.11), transparent 60%),
    radial-gradient(680px 420px at 54% 38%, rgba(167,139,250,.07), transparent 68%),
    var(--kb-bg);
}
.kb-root *{box-sizing:border-box}
.kb-root button{font-family:inherit;color:inherit}
.kb-root ::selection{background:rgba(109,140,255,.28)}
.kb-root ::-webkit-scrollbar{width:9px;height:9px}
.kb-root ::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--kb-dim) 26%,transparent);border-radius:9px;border:2px solid transparent;background-clip:content-box}
.kb-root ::-webkit-scrollbar-track{background:transparent}
.kb-root::before{
  content:""; position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.34;
  background-image:
    linear-gradient(color-mix(in srgb,var(--kb-dim) 12%,transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb,var(--kb-dim) 12%,transparent) 1px, transparent 1px);
  background-size:48px 48px;
  mask-image:radial-gradient(ellipse at 52% 26%, #000 0%, transparent 76%);
}
.kb-root[data-kb-theme="light"]::before{opacity:.28}

/* ------------------------------------------------------------------ header */
.kb-header{
  position:relative; z-index:5; flex:0 0 62px; display:flex; align-items:center; gap:16px;
  padding:0 18px; border-bottom:1px solid var(--kb-line);
  background:color-mix(in srgb,var(--kb-bg) 76%, transparent);
  backdrop-filter:blur(18px) saturate(1.2);
}
.kb-brand{display:flex; align-items:center; gap:10px; flex:0 0 auto; user-select:none}
.kb-logo{
  width:34px; height:34px; display:grid; place-items:center; border-radius:11px;
  background:linear-gradient(145deg, rgba(34,211,238,.20), rgba(129,140,248,.20));
  border:1px solid color-mix(in srgb,var(--kb-indigo) 36%, transparent);
  box-shadow:0 0 24px rgba(109,140,255,.22), inset 0 0 14px rgba(34,211,238,.10);
}
.kb-brandtext{display:flex; flex-direction:column; line-height:1.08}
.kb-brandtext b{font-size:13px; letter-spacing:.16em; font-weight:700}
.kb-brandtext span{font-size:9.5px; letter-spacing:.22em; color:var(--kb-faint); font-weight:600; margin-top:3px}
.kb-nav{display:flex; align-items:center; gap:2px; padding:3px; border-radius:11px;
  background:color-mix(in srgb,var(--kb-panel-2) 80%, transparent); border:1px solid var(--kb-line)}
.kb-nav button{
  appearance:none; border:0; background:transparent; cursor:pointer; padding:6px 12px; border-radius:8px;
  font-size:12px; color:var(--kb-dim); transition:all .16s ease; white-space:nowrap; display:flex; align-items:center; gap:6px;
}
.kb-nav button:hover{color:var(--kb-text); background:color-mix(in srgb,var(--kb-text) 6%, transparent)}
.kb-nav button[data-on="1"]{
  color:var(--kb-text); font-weight:600;
  background:linear-gradient(180deg, color-mix(in srgb,var(--kb-indigo) 20%, transparent), color-mix(in srgb,var(--kb-indigo) 8%, transparent));
  box-shadow:0 0 0 1px color-mix(in srgb,var(--kb-indigo) 32%, transparent), 0 6px 16px -8px rgba(109,140,255,.7);
}
.kb-nav em{font-style:normal; font-size:10px; color:var(--kb-faint); font-variant-numeric:tabular-nums}
.kb-headspacer{flex:1}
.kb-search{
  flex:0 1 280px; display:flex; align-items:center; gap:7px; height:32px; padding:0 10px;
  border-radius:9px; border:1px solid var(--kb-line);
  background:color-mix(in srgb,var(--kb-bg) 60%, transparent); color:var(--kb-dim);
  transition:border-color .16s ease, box-shadow .16s ease;
}
.kb-search:focus-within{border-color:color-mix(in srgb,var(--kb-indigo) 55%, transparent); box-shadow:0 0 0 3px rgba(109,140,255,.13)}
.kb-search input{flex:1; min-width:0; border:0; outline:0; background:transparent; color:var(--kb-text); font-size:12px}
.kb-search input::placeholder{color:var(--kb-faint)}
.kb-kbd{font-size:9.5px; color:var(--kb-faint); border:1px solid var(--kb-line); border-radius:5px; padding:1px 5px}
.kb-status{display:flex; align-items:center; gap:6px; height:26px; padding:0 9px; border-radius:7px;
  font-size:10.5px; letter-spacing:.04em; color:var(--kb-dim); border:1px solid var(--kb-line);
  background:color-mix(in srgb,var(--kb-panel-2) 70%, transparent); white-space:nowrap}
.kb-dot{width:6px; height:6px; border-radius:50%; background:var(--kb-dim); flex:0 0 auto}
.kb-dot[data-live="1"]{background:var(--kb-green); box-shadow:0 0 8px rgba(52,211,153,.8)}
.kb-dot[data-demo="1"]{background:var(--kb-amber); box-shadow:0 0 8px rgba(245,165,36,.7)}
.kb-dot[data-err="1"]{background:var(--kb-red); box-shadow:0 0 8px rgba(251,113,133,.7)}
.kb-iconbtn{
  appearance:none; border:1px solid var(--kb-line); background:color-mix(in srgb,var(--kb-panel-2) 60%, transparent);
  width:30px; height:30px; border-radius:8px; display:grid; place-items:center; cursor:pointer; color:var(--kb-dim);
  transition:all .15s ease;
}
.kb-iconbtn:hover{color:var(--kb-text); border-color:var(--kb-line-2); background:color-mix(in srgb,var(--kb-text) 6%, transparent)}
.kb-iconbtn:disabled{opacity:.4; cursor:default}
.kb-iconbtn[data-spin="1"] svg{animation:kb-spin 1s linear infinite}
@keyframes kb-spin{to{transform:rotate(360deg)}}

/* -------------------------------------------------------------------- body */
.kb-body{position:relative; z-index:1; flex:1; min-height:0; overflow:auto; scroll-behavior:smooth}
.kb-page{max-width:1460px; margin:0 auto; padding:18px 20px 34px; animation:kb-in .26s ease both}
@keyframes kb-in{from{opacity:0; transform:translateY(6px)}to{opacity:1; transform:none}}
.kb-pagehead{display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin:2px 2px 14px}
.kb-pagehead h1{font-size:19px; font-weight:650; letter-spacing:-.01em; margin:0}
.kb-pagehead p{margin:3px 0 0; font-size:11.5px; color:var(--kb-faint)}
.kb-pagehead .kb-actions{display:flex; align-items:center; gap:8px}

.kb-panel{
  position:relative; border:1px solid var(--kb-line); border-radius:var(--kb-radius);
  background:linear-gradient(180deg, color-mix(in srgb,var(--kb-panel) 96%, transparent), color-mix(in srgb,var(--kb-panel) 76%, transparent));
  padding:15px 16px; box-shadow:0 1px 0 rgba(255,255,255,.03) inset;
  overflow:hidden; min-width:0;
}
.kb-panel::after{
  content:""; position:absolute; inset:0 0 auto; height:1px; pointer-events:none;
  background:linear-gradient(90deg, transparent, color-mix(in srgb,var(--kb-text) 12%, transparent), transparent);
}
.kb-panelhead{display:flex; align-items:center; gap:8px; margin-bottom:12px; min-width:0}
.kb-panelhead h3{font-size:12.5px; font-weight:600; letter-spacing:.01em; margin:0; white-space:nowrap}
.kb-panelhead .kb-sub{font-size:10.5px; color:var(--kb-faint); white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
.kb-panelhead .kb-grow{flex:1}
.kb-link{
  appearance:none; border:0; background:transparent; cursor:pointer; color:var(--kb-dim); font-size:11px;
  display:inline-flex; align-items:center; gap:3px; padding:2px 4px; border-radius:5px;
}
.kb-link:hover{color:var(--kb-indigo); background:color-mix(in srgb,var(--kb-indigo) 10%, transparent)}

/* --------------------------------------------------------------------- kpi */
.kb-kpis{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:12px; margin-bottom:12px}
.kb-kpi{
  position:relative; overflow:hidden; border:1px solid var(--kb-line); border-radius:14px; padding:13px 15px 11px;
  background:linear-gradient(180deg, color-mix(in srgb,var(--kb-panel) 96%, transparent), color-mix(in srgb,var(--kb-panel) 70%, transparent));
  display:flex; flex-direction:column; gap:2px; min-height:104px;
}
.kb-kpi::before{content:""; position:absolute; inset:0 0 auto; height:2px; background:var(--kaccent, var(--kb-indigo)); opacity:.7}
.kb-kpi::after{content:""; position:absolute; right:-30px; top:-42px; width:130px; height:130px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb,var(--kaccent, var(--kb-indigo)) 26%, transparent), transparent 66%); opacity:.55; pointer-events:none}
.kb-kpi-label{font-size:10.5px; letter-spacing:.09em; text-transform:uppercase; color:var(--kb-faint); display:flex; align-items:center; gap:6px}
.kb-kpi-value{font-size:27px; line-height:1.16; font-weight:650; letter-spacing:-.02em; font-variant-numeric:tabular-nums; display:flex; align-items:baseline; gap:4px; margin-top:3px}
.kb-kpi-value small{font-size:12px; font-weight:500; color:var(--kb-dim); letter-spacing:0}
.kb-kpi-foot{display:flex; align-items:center; gap:6px; font-size:10.5px; color:var(--kb-faint); margin-top:auto; padding-top:5px; min-height:17px}
.kb-kpi-spark{margin-left:auto; opacity:.9; flex:0 0 auto}
.kb-delta{display:inline-flex; align-items:center; gap:2px; padding:1px 5px; border-radius:5px; font-size:10px; font-variant-numeric:tabular-nums}
.kb-delta[data-up="1"]{color:var(--kb-green); background:color-mix(in srgb,var(--kb-green) 13%, transparent)}
.kb-delta[data-down="1"]{color:var(--kb-red); background:color-mix(in srgb,var(--kb-red) 12%, transparent)}
.kb-delta[data-flat="1"]{color:var(--kb-dim); background:color-mix(in srgb,var(--kb-dim) 12%, transparent)}

/* ------------------------------------------------------------------- grids */
.kb-grid-2{display:grid; grid-template-columns:minmax(0,1.62fr) minmax(300px,.88fr); gap:12px; margin-bottom:12px}
.kb-grid-2b{display:grid; grid-template-columns:minmax(0,1.62fr) minmax(300px,.88fr); gap:12px; align-items:start}
.kb-stack{display:flex; flex-direction:column; gap:12px; min-width:0}
.kb-muted{color:var(--kb-faint); font-size:11px}
.kb-empty{display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:150px; color:var(--kb-faint); font-size:11.5px; text-align:center; padding:18px}

/* ------------------------------------------------------------------ charts */
.kb-chart{position:relative; width:100%; min-width:0}
.kb-chart svg{display:block; width:100%; overflow:visible}
.kb-legend{display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:10.5px; color:var(--kb-dim)}
.kb-legend span{display:inline-flex; align-items:center; gap:5px}
.kb-legend i{width:7px; height:7px; border-radius:2px; display:inline-block}
.kb-tip{
  position:absolute; z-index:3; pointer-events:none; transform:translate(-50%,-118%);
  background:color-mix(in srgb,var(--kb-bg) 94%, transparent); border:1px solid var(--kb-line-2);
  border-radius:8px; padding:6px 8px; font-size:10.5px; box-shadow:0 10px 26px rgba(0,0,0,.32); white-space:nowrap;
}
.kb-tip b{font-variant-numeric:tabular-nums}
.kb-donut-wrap{display:flex; align-items:center; gap:16px}
.kb-donut-center{position:absolute; inset:0; display:grid; place-content:center; text-align:center; pointer-events:none}
.kb-donut-center b{font-size:22px; font-weight:650; font-variant-numeric:tabular-nums; display:block; line-height:1.1}
.kb-donut-center span{font-size:9.5px; letter-spacing:.12em; color:var(--kb-faint); text-transform:uppercase}
.kb-srclegend{display:flex; flex-direction:column; gap:9px; flex:1; min-width:0}
.kb-srcrow{display:flex; align-items:center; gap:8px; font-size:11.5px; cursor:pointer; border:0; background:transparent; padding:3px 5px; border-radius:7px; text-align:left; min-width:0}
.kb-srcrow:hover{background:color-mix(in srgb,var(--kb-text) 5%, transparent)}
.kb-srcrow i{width:8px; height:8px; border-radius:3px; flex:0 0 auto}
.kb-srcrow b{font-variant-numeric:tabular-nums; font-weight:600}
.kb-srcrow em{font-style:normal; color:var(--kb-faint); font-size:10px; margin-left:auto; white-space:nowrap}
.kb-heat{display:grid; grid-auto-flow:column; gap:3px}
.kb-heat i{width:100%; aspect-ratio:1; border-radius:2.5px; background:color-mix(in srgb,var(--kb-dim) 12%, transparent); min-width:8px}
.kb-heatlabels{display:grid; grid-auto-flow:column; gap:3px; margin-top:4px; font-size:8px; color:var(--kb-faint); text-align:center}
.kb-bar{height:6px; border-radius:4px; background:color-mix(in srgb,var(--kb-dim) 14%, transparent); overflow:hidden; flex:1; min-width:30px}
.kb-bar i{display:block; height:100%; border-radius:4px; background:linear-gradient(90deg, var(--kb-indigo), var(--kb-cyan)); opacity:.85}
.kb-barlist{display:flex; flex-direction:column; gap:9px}
.kb-barrow{display:flex; align-items:center; gap:9px; font-size:11.5px; min-width:0}
.kb-barrow span:first-child{flex:0 0 84px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--kb-dim)}
.kb-barrow b{font-variant-numeric:tabular-nums; font-weight:600; width:30px; text-align:right; flex:0 0 auto}
.kb-barrow[data-click="1"]{cursor:pointer}
.kb-barrow[data-click="1"]:hover span:first-child{color:var(--kb-text)}

/* ------------------------------------------------------------------ recent */
.kb-recent{display:flex; flex-direction:column}
.kb-recentrow{
  display:flex; align-items:center; gap:10px; padding:8px 6px; border-radius:8px; cursor:pointer;
  border-bottom:1px dashed color-mix(in srgb,var(--kb-line) 70%, transparent); min-width:0;
}
.kb-recentrow:last-child{border-bottom:0}
.kb-recentrow:hover{background:color-mix(in srgb,var(--kb-text) 4.5%, transparent)}
.kb-recentrow .kb-fileicon{width:25px; height:25px; border-radius:7px; flex:0 0 auto; display:grid; place-items:center;
  background:color-mix(in srgb,var(--kb-src) 15%, transparent); color:var(--kb-src); border:1px solid color-mix(in srgb,var(--kb-src) 26%, transparent)}
.kb-recentrow .kb-rmain{flex:1; min-width:0}
.kb-recentrow .kb-rtitle{font-size:12px; font-weight:530; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.kb-recentrow .kb-rpath{font-size:10px; color:var(--kb-faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px; display:flex; align-items:center; gap:5px}
.kb-recentrow .kb-rtime{font-size:10px; color:var(--kb-faint); white-space:nowrap; flex:0 0 auto}
.kb-recentrow .kb-ractions{display:flex; gap:2px; opacity:0; transition:opacity .14s ease; flex:0 0 auto}
.kb-recentrow:hover .kb-ractions{opacity:1}
.kb-miniaction{
  appearance:none; border:1px solid transparent; background:transparent; color:var(--kb-dim); width:24px; height:24px;
  border-radius:6px; display:grid; place-items:center; cursor:pointer;
}
.kb-miniaction:hover{color:var(--kb-text); background:color-mix(in srgb,var(--kb-text) 8%, transparent); border-color:var(--kb-line)}
.kb-miniaction:disabled{opacity:.28; cursor:default}
.kb-srcdot{width:6px; height:6px; border-radius:50%; display:inline-block; flex:0 0 auto}
.kb-tag{
  display:inline-flex; align-items:center; gap:2px; font-size:9.5px; padding:1.5px 6px; border-radius:999px;
  color:var(--kb-dim); background:color-mix(in srgb,var(--kb-dim) 9%, transparent);
  border:1px solid color-mix(in srgb,var(--kb-dim) 15%, transparent); white-space:nowrap;
}
.kb-tag[data-click="1"]{cursor:pointer}
.kb-tag[data-click="1"]:hover{color:var(--kb-text); border-color:color-mix(in srgb,var(--kb-indigo) 40%, transparent)}

/* ------------------------------------------------------------------- focus */
.kb-focuslist{display:flex; flex-direction:column; gap:2px}
.kb-focusrow{display:flex; align-items:flex-start; gap:8px; padding:7px 5px; border-radius:7px}
.kb-focusrow:hover{background:color-mix(in srgb,var(--kb-text) 4%, transparent)}
.kb-check{
  appearance:none; width:15px; height:15px; border-radius:4.5px; border:1.5px solid color-mix(in srgb,var(--kb-dim) 46%, transparent);
  background:transparent; cursor:pointer; flex:0 0 auto; margin-top:1.5px; display:grid; place-items:center; color:transparent;
  transition:all .14s ease;
}
.kb-check:hover{border-color:var(--kb-indigo)}
.kb-check[data-done="1"]{background:linear-gradient(140deg,var(--kb-indigo),var(--kb-cyan)); border-color:transparent; color:#fff}
.kb-focusrow .kb-ft{flex:1; min-width:0}
.kb-focusrow .kb-ftitle{font-size:11.5px; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.kb-focusrow[data-done="1"] .kb-ftitle{text-decoration:line-through; color:var(--kb-faint)}
.kb-focusrow .kb-fmeta{display:flex; align-items:center; gap:6px; margin-top:3px; font-size:9.5px; color:var(--kb-faint); flex-wrap:wrap}
.kb-flag{display:inline-flex; align-items:center; gap:3px; font-size:9.5px; padding:1px 5px; border-radius:4px}
.kb-flag[data-p="5"]{color:var(--kb-red); background:color-mix(in srgb,var(--kb-red) 11%, transparent)}
.kb-flag[data-p="3"]{color:var(--kb-amber); background:color-mix(in srgb,var(--kb-amber) 11%, transparent)}
.kb-flag[data-p="1"]{color:var(--kb-dim); background:color-mix(in srgb,var(--kb-dim) 10%, transparent)}
.kb-focusfoot{display:flex; align-items:center; gap:8px; padding-top:10px; margin-top:6px; border-top:1px solid var(--kb-line)}

/* ------------------------------------------------------------------- table */
.kb-toolbar{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:11px}
.kb-chip{
  appearance:none; border:1px solid var(--kb-line); background:color-mix(in srgb,var(--kb-panel-2) 55%, transparent);
  height:27px; padding:0 10px; border-radius:7px; font-size:11px; cursor:pointer; color:var(--kb-dim);
  display:inline-flex; align-items:center; gap:6px; white-space:nowrap; transition:all .14s ease;
}
.kb-chip:hover{color:var(--kb-text); border-color:var(--kb-line-2)}
.kb-chip[data-on="1"]{color:var(--kb-text); border-color:color-mix(in srgb,var(--kb-indigo) 45%, transparent);
  background:color-mix(in srgb,var(--kb-indigo) 14%, transparent)}
.kb-chip em{font-style:normal; font-size:9.5px; color:var(--kb-faint); font-variant-numeric:tabular-nums}
.kb-chip:disabled{opacity:.45; cursor:default}
.kb-select, .kb-input{
  height:27px; border-radius:7px; border:1px solid var(--kb-line); background:color-mix(in srgb,var(--kb-bg) 55%, transparent);
  color:var(--kb-text); font-size:11px; padding:0 8px; outline:0; font-family:inherit;
}
.kb-select:focus, .kb-input:focus{border-color:color-mix(in srgb,var(--kb-indigo) 55%, transparent); box-shadow:0 0 0 3px rgba(109,140,255,.12)}
.kb-input::placeholder{color:var(--kb-faint)}
.kb-table{width:100%; border-collapse:separate; border-spacing:0; table-layout:fixed}
.kb-table th{
  font-size:9.5px; text-transform:uppercase; letter-spacing:.1em; color:var(--kb-faint); font-weight:600;
  text-align:left; padding:0 8px 8px; border-bottom:1px solid var(--kb-line); white-space:nowrap;
}
.kb-table td{padding:9px 8px; border-bottom:1px solid color-mix(in srgb,var(--kb-line) 62%, transparent); vertical-align:middle; font-size:11.5px}
.kb-table tbody tr{cursor:pointer}
.kb-table tbody tr:hover td{background:color-mix(in srgb,var(--kb-text) 4%, transparent)}
.kb-table tbody tr:last-child td{border-bottom:0}
.kb-doccell{display:flex; align-items:center; gap:9px; min-width:0}
.kb-doccell .kb-fileicon{width:26px; height:26px; border-radius:7px; flex:0 0 auto; display:grid; place-items:center;
  background:color-mix(in srgb,var(--kb-src) 14%, transparent); color:var(--kb-src); border:1px solid color-mix(in srgb,var(--kb-src) 25%, transparent)}
.kb-doccell .kb-docmain{min-width:0}
.kb-doccell .kb-docname{font-size:12px; font-weight:540; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.kb-doccell .kb-docex{font-size:9.5px; color:var(--kb-faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px}
.kb-srcpill{display:inline-flex; align-items:center; gap:5px; font-size:10px; padding:2px 7px; border-radius:999px;
  background:color-mix(in srgb,var(--kb-src) 12%, transparent); color:var(--kb-src);
  border:1px solid color-mix(in srgb,var(--kb-src) 24%, transparent); white-space:nowrap}
.kb-path{font-size:10px; color:var(--kb-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.kb-num{font-variant-numeric:tabular-nums; font-size:11px; color:var(--kb-dim)}
.kb-actionscell{display:flex; gap:2px; justify-content:flex-end}
.kb-pager{display:flex; align-items:center; gap:8px; margin-top:11px; font-size:10.5px; color:var(--kb-faint)}
.kb-pager .kb-grow{flex:1}
.kb-pager button{appearance:none; border:1px solid var(--kb-line); background:transparent; color:var(--kb-dim);
  height:25px; min-width:25px; border-radius:6px; cursor:pointer; font-size:10.5px; padding:0 8px}
.kb-pager button:hover:not(:disabled){color:var(--kb-text); border-color:var(--kb-line-2)}
.kb-pager button:disabled{opacity:.35; cursor:default}

/* ------------------------------------------------------------------- map */
.kb-sourcegrid{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:11px; margin-bottom:12px}
.kb-sourcecard{
  font:inherit; color:inherit; text-align:left;
  position:relative; overflow:hidden; border:1px solid var(--kb-line); border-radius:14px; padding:13px 14px;
  background:linear-gradient(180deg, color-mix(in srgb,var(--kb-panel) 94%, transparent), color-mix(in srgb,var(--kb-panel) 66%, transparent));
  display:flex; flex-direction:column; gap:8px; min-height:146px; cursor:pointer; transition:all .16s ease; text-align:left;
}
.kb-sourcecard:hover{transform:translateY(-1px); border-color:color-mix(in srgb,var(--kb-src) 40%, var(--kb-line)); box-shadow:0 12px 30px -18px color-mix(in srgb,var(--kb-src) 60%, transparent)}
.kb-sourcecard::before{content:""; position:absolute; inset:0 0 auto; height:2px; background:var(--kb-src); opacity:.75}
.kb-sourcecard .kb-sc-top{display:flex; align-items:center; gap:8px}
.kb-sourcecard .kb-sclogo{width:30px; height:30px; border-radius:9px; display:grid; place-items:center;
  background:color-mix(in srgb,var(--kb-src) 16%, transparent); color:var(--kb-src); border:1px solid color-mix(in srgb,var(--kb-src) 30%, transparent)}
.kb-sourcecard .kb-sc-name{font-size:12.5px; font-weight:600; padding-right:22px}
.kb-sc-open{
  position:absolute; top:9px; right:9px; width:22px; height:22px; border-radius:6px;
  display:grid; place-items:center; cursor:pointer; color:var(--kb-src);
  border:1px solid color-mix(in srgb,var(--kb-src) 28%, transparent);
  background:color-mix(in srgb,var(--kb-src) 10%, transparent);
}
.kb-sc-open:hover{background:color-mix(in srgb,var(--kb-src) 22%, transparent)}
.kb-sourcecard .kb-sc-state{font-size:9px; letter-spacing:.08em; text-transform:uppercase; color:var(--kb-faint); margin-top:2px; display:flex; align-items:center; gap:4px}
.kb-sourcecard .kb-sc-num{font-size:25px; font-weight:650; letter-spacing:-.02em; font-variant-numeric:tabular-nums; line-height:1.1}
.kb-sourcecard .kb-sc-num small{font-size:10.5px; font-weight:500; color:var(--kb-faint); margin-left:3px}
.kb-sourcecard .kb-sc-home{font-size:9.5px; color:var(--kb-faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:auto}
.kb-sourcecard .kb-sc-foot{display:flex; align-items:center; gap:6px; font-size:9.5px; color:var(--kb-faint)}
.kb-tree{display:flex; flex-direction:column; gap:1px; max-height:420px; overflow:auto; padding-right:2px}
.kb-tree-src{font-size:9.5px; letter-spacing:.13em; text-transform:uppercase; color:var(--kb-faint); padding:9px 4px 5px; display:flex; align-items:center; gap:6px}
.kb-tree-src:first-child{padding-top:0}
.kb-treerow{display:flex; align-items:center; gap:8px; padding:5px 6px; border-radius:6px; cursor:pointer; font-size:11px; border:0; background:transparent; text-align:left; width:100%}
.kb-treerow:hover{background:color-mix(in srgb,var(--kb-text) 5%, transparent)}
.kb-treerow[data-active="1"]{background:color-mix(in srgb,var(--kb-indigo) 12%, transparent); color:var(--kb-text)}
.kb-treerow .kb-trcaret{color:var(--kb-faint); display:grid; place-items:center; width:10px; flex:0 0 auto}
.kb-treerow .kb-trfolder{overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0}
.kb-treerow .kb-trbar{width:70px; flex:0 0 auto}
.kb-treerow b{font-variant-numeric:tabular-nums; font-weight:600; width:26px; text-align:right; flex:0 0 auto; font-size:10.5px}
.kb-treerow .kb-trwords{width:46px; text-align:right; font-size:9.5px; color:var(--kb-faint); flex:0 0 auto}
.kb-typelist{display:flex; flex-direction:column; gap:7px}

/* ----------------------------------------------------------------- todos */
.kb-todostats{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:10px; margin-bottom:12px}
.kb-tstat{border:1px solid var(--kb-line); border-radius:12px; padding:10px 13px; background:color-mix(in srgb,var(--kb-panel) 82%, transparent); display:flex; align-items:center; gap:10px}
.kb-tstat .kb-ticon{width:30px; height:30px; border-radius:9px; display:grid; place-items:center; background:color-mix(in srgb,var(--kb-tc) 14%, transparent); color:var(--kb-tc); border:1px solid color-mix(in srgb,var(--kb-tc) 26%, transparent)}
.kb-tstat b{display:block; font-size:19px; line-height:1.1; font-variant-numeric:tabular-nums; font-weight:650}
.kb-tstat span{font-size:10px; color:var(--kb-faint)}
.kb-todolayout{display:grid; grid-template-columns:190px minmax(0,1fr); gap:12px; align-items:start}
.kb-projectrail{display:flex; flex-direction:column; gap:2px; position:sticky; top:0}
.kb-project{
  display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:8px; border:0; background:transparent;
  cursor:pointer; font-size:11.5px; color:var(--kb-dim); text-align:left; width:100%;
}
.kb-project:hover{background:color-mix(in srgb,var(--kb-text) 5%, transparent); color:var(--kb-text)}
.kb-project[data-on="1"]{background:color-mix(in srgb,var(--kb-indigo) 12%, transparent); color:var(--kb-text); font-weight:550}
.kb-project i{width:8px; height:8px; border-radius:3px; background:var(--pc); flex:0 0 auto}
.kb-project b{margin-left:auto; font-size:10px; font-weight:600; color:var(--kb-faint); font-variant-numeric:tabular-nums}
.kb-quickadd{display:flex; gap:7px; margin-bottom:11px; flex-wrap:wrap}
.kb-quickadd .kb-input{height:31px; flex:1; min-width:180px}
.kb-btn{
  appearance:none; border:1px solid color-mix(in srgb,var(--kb-indigo) 42%, transparent); height:31px; padding:0 13px;
  border-radius:8px; background:linear-gradient(180deg, color-mix(in srgb,var(--kb-indigo) 26%, transparent), color-mix(in srgb,var(--kb-indigo) 13%, transparent));
  color:var(--kb-text); font-size:11.5px; font-weight:550; cursor:pointer; display:inline-flex; align-items:center; gap:6px; white-space:nowrap;
}
.kb-btn:hover{border-color:color-mix(in srgb,var(--kb-indigo) 68%, transparent); box-shadow:0 6px 18px -10px rgba(109,140,255,.9)}
.kb-btn:disabled{opacity:.5; cursor:default}
.kb-btn[data-kind="ghost"]{background:transparent; border-color:var(--kb-line); color:var(--kb-dim); font-weight:500}
.kb-btn[data-kind="ghost"]:hover{color:var(--kb-text); border-color:var(--kb-line-2); box-shadow:none}
.kb-btn[data-kind="danger"]{border-color:color-mix(in srgb,var(--kb-red) 40%, transparent); background:color-mix(in srgb,var(--kb-red) 10%, transparent); color:var(--kb-red)}
.kb-columns{display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:10px; align-items:start}
.kb-column{border:1px solid var(--kb-line); border-radius:12px; background:color-mix(in srgb,var(--kb-panel) 62%, transparent); padding:10px; min-height:180px; min-width:0}
.kb-columnhead{display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; margin-bottom:9px}
.kb-columnhead .kb-cdot{width:6px; height:6px; border-radius:50%; background:var(--cc)}
.kb-columnhead em{font-style:normal; margin-left:auto; font-size:10px; color:var(--kb-faint); font-variant-numeric:tabular-nums}
.kb-task{
  position:relative; border:1px solid var(--kb-line); border-radius:9px; padding:8px 9px; margin-bottom:7px;
  background:color-mix(in srgb,var(--kb-bg) 52%, transparent); display:flex; flex-direction:column; gap:5px;
}
.kb-task:hover{border-color:var(--kb-line-2)}
.kb-task .kb-tasktop{display:flex; align-items:flex-start; gap:7px}
.kb-task .kb-tasktitle{font-size:11.5px; line-height:1.4; flex:1; min-width:0; word-break:break-word}
.kb-task[data-done="1"] .kb-tasktitle{text-decoration:line-through; color:var(--kb-faint)}
.kb-task .kb-taskmeta{display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:9.5px; color:var(--kb-faint)}
.kb-task .kb-taskproj{display:inline-flex; align-items:center; gap:4px}
.kb-task .kb-taskproj i{width:5px; height:5px; border-radius:2px; background:var(--pc)}
.kb-task .kb-taskdue[data-overdue="1"]{color:var(--kb-red)}
.kb-task .kb-taskdue[data-today="1"]{color:var(--kb-amber)}
.kb-task .kb-tasklink{margin-left:auto; opacity:0; transition:opacity .14s ease}
.kb-task:hover .kb-tasklink{opacity:1}
.kb-columnempty{font-size:10.5px; color:var(--kb-faint); text-align:center; padding:18px 6px; border:1px dashed var(--kb-line); border-radius:8px}
.kb-donebox{margin-top:12px; border:1px solid var(--kb-line); border-radius:12px; padding:11px 13px; background:color-mix(in srgb,var(--kb-panel) 58%, transparent)}
.kb-donebox h4{font-size:11px; margin:0 0 8px; color:var(--kb-dim); font-weight:550; display:flex; align-items:center; gap:6px}
.kb-donelist{display:flex; flex-wrap:wrap; gap:6px}
.kb-donepill{display:inline-flex; align-items:center; gap:5px; font-size:10.5px; color:var(--kb-faint); border:1px solid var(--kb-line); border-radius:999px; padding:3px 8px}
.kb-donepill svg{color:var(--kb-green)}

/* --------------------------------------------------------------- settings */
.kb-settings{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; align-items:start}
.kb-setcard{border:1px solid var(--kb-line); border-radius:14px; padding:15px 16px; background:color-mix(in srgb,var(--kb-panel) 82%, transparent); min-width:0}
.kb-setcard[data-wide="1"]{grid-column:1 / -1}
.kb-settop{display:flex; align-items:center; gap:9px; margin-bottom:4px}
.kb-setlogo{width:30px; height:30px; border-radius:9px; display:grid; place-items:center; background:color-mix(in srgb,var(--kb-src) 15%, transparent); color:var(--kb-src); border:1px solid color-mix(in srgb,var(--kb-src) 28%, transparent)}
.kb-settop h3{font-size:12.5px; margin:0; font-weight:600}
.kb-settop .kb-setstate{margin-left:auto; font-size:9.5px; display:flex; align-items:center; gap:5px; color:var(--kb-faint); padding:2px 7px; border:1px solid var(--kb-line); border-radius:999px}
.kb-setdesc{font-size:10.5px; color:var(--kb-faint); line-height:1.6; margin:4px 0 11px}
.kb-field{display:flex; flex-direction:column; gap:5px; margin-bottom:9px}
.kb-field label{font-size:10px; color:var(--kb-faint); letter-spacing:.05em; text-transform:uppercase}
.kb-field .kb-input{height:30px; font-size:11.5px}
.kb-field textarea.kb-input{height:auto; min-height:60px; padding:7px 9px; resize:vertical; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10.5px; line-height:1.55}
.kb-fieldrow{display:grid; grid-template-columns:1fr 1fr; gap:9px}
.kb-setactions{display:flex; align-items:center; gap:8px; margin-top:4px}
.kb-hint{font-size:10px; color:var(--kb-faint); margin-top:8px; line-height:1.5}
.kb-hint a{color:var(--kb-indigo); text-decoration:none}
.kb-hint a:hover{text-decoration:underline}
.kb-testout{font-size:10.5px; margin-top:8px; padding:7px 9px; border-radius:7px; border:1px solid var(--kb-line); white-space:pre-wrap; word-break:break-word; line-height:1.5}
.kb-testout[data-ok="1"]{color:var(--kb-green); background:color-mix(in srgb,var(--kb-green) 8%, transparent); border-color:color-mix(in srgb,var(--kb-green) 26%, transparent)}
.kb-testout[data-err="1"]{color:var(--kb-red); background:color-mix(in srgb,var(--kb-red) 8%, transparent); border-color:color-mix(in srgb,var(--kb-red) 26%, transparent)}
.kb-switch{position:relative; width:34px; height:19px; border-radius:999px; background:color-mix(in srgb,var(--kb-dim) 22%, transparent); border:1px solid var(--kb-line); cursor:pointer; flex:0 0 auto; transition:background .16s ease}
.kb-switch::after{content:""; position:absolute; top:2px; left:2px; width:13px; height:13px; border-radius:50%; background:var(--kb-dim); transition:all .16s ease}
.kb-switch[data-on="1"]{background:color-mix(in srgb,var(--kb-indigo) 40%, transparent); border-color:color-mix(in srgb,var(--kb-indigo) 50%, transparent)}
.kb-switch[data-on="1"]::after{left:17px; background:#fff}
.kb-settingrow{display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px dashed color-mix(in srgb,var(--kb-line) 70%, transparent)}
.kb-settingrow:last-child{border-bottom:0}
.kb-settingrow .kb-sr1{font-size:11.5px}
.kb-settingrow .kb-sr2{font-size:10px; color:var(--kb-faint); margin-top:2px}
.kb-settingrow .kb-grow{flex:1}
.kb-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; color:var(--kb-dim); word-break:break-all}

/* ----------------------------------------------------------------- drawer */
.kb-drawer-layer{position:absolute; inset:0; z-index:20; pointer-events:none}
.kb-overlay{position:absolute; inset:0; z-index:20; background:rgba(4,7,16,.34); backdrop-filter:blur(2px); animation:kb-fade .18s ease}
@keyframes kb-fade{from{opacity:0}to{opacity:1}}
.kb-drawer{
  position:absolute; z-index:21; top:0; right:0; bottom:0; width:min(560px, 92%); display:flex; flex-direction:column;
  pointer-events:auto;
  background:color-mix(in srgb,var(--kb-bg) 96%, #0b1120); border-left:1px solid var(--kb-line-2);
  box-shadow:-24px 0 70px rgba(0,0,0,.36); animation:kb-slide .22s cubic-bezier(.22,.8,.3,1) both;
}
@keyframes kb-slide{from{transform:translateX(30px); opacity:.6}to{transform:none; opacity:1}}
.kb-drawerhead{padding:15px 17px 12px; border-bottom:1px solid var(--kb-line); flex:0 0 auto}
.kb-drawerhead .kb-dh-top{display:flex; align-items:flex-start; gap:9px}
.kb-drawerhead .kb-dh-title{font-size:14.5px; font-weight:600; line-height:1.35; flex:1; word-break:break-word}
.kb-drawerhead .kb-dh-meta{display:flex; align-items:center; gap:7px; flex-wrap:wrap; font-size:10px; color:var(--kb-faint); margin-top:7px}
.kb-drawerhead .kb-dh-actions{display:flex; gap:6px; margin-top:11px; flex-wrap:wrap}
.kb-drawerbody{flex:1; min-height:0; overflow:auto; padding:16px 18px 28px}
.kb-md{font-size:12.5px; line-height:1.78; color:var(--kb-text); word-break:break-word}
.kb-md h1{font-size:19px; margin:4px 0 12px; line-height:1.4}
.kb-md h2{font-size:15px; margin:20px 0 8px; line-height:1.4; padding-bottom:5px; border-bottom:1px solid var(--kb-line)}
.kb-md h3{font-size:13px; margin:15px 0 6px}
.kb-md p{margin:7px 0}
.kb-md ul, .kb-md ol{margin:6px 0; padding-left:20px}
.kb-md li{margin:3px 0}
.kb-md blockquote{margin:9px 0; padding:7px 11px; border-left:2px solid var(--kb-indigo); background:color-mix(in srgb,var(--kb-indigo) 7%, transparent); border-radius:0 7px 7px 0; color:var(--kb-dim)}
.kb-md code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; padding:1px 4px; border-radius:4px; background:color-mix(in srgb,var(--kb-dim) 13%, transparent)}
.kb-md pre{margin:9px 0; padding:10px 12px; border-radius:9px; border:1px solid var(--kb-line); background:color-mix(in srgb,var(--kb-bg) 70%, #000); overflow:auto; line-height:1.55}
.kb-md pre code{background:transparent; padding:0; font-size:10.5px}
.kb-md table{border-collapse:collapse; margin:10px 0; font-size:11px; width:100%}
.kb-md th, .kb-md td{border:1px solid var(--kb-line); padding:5px 8px; text-align:left}
.kb-md th{background:color-mix(in srgb,var(--kb-dim) 9%, transparent); font-weight:600}
.kb-md hr{border:0; border-top:1px solid var(--kb-line); margin:16px 0}
.kb-md a{color:var(--kb-indigo); text-decoration:none}
.kb-md a:hover{text-decoration:underline}
.kb-md strong{font-weight:650}
.kb-md .kb-md-task{list-style:none; margin-left:-16px; display:flex; gap:6px; align-items:flex-start}
.kb-md .kb-md-task[data-done="1"]{color:var(--kb-faint); text-decoration:line-through}
.kb-md .kb-wikilink{color:var(--kb-violet); border-bottom:1px dashed color-mix(in srgb,var(--kb-violet) 50%, transparent)}
.kb-md .kb-md-tag{color:var(--kb-cyan); font-size:11px; background:color-mix(in srgb,var(--kb-cyan) 9%, transparent); padding:0 4px; border-radius:4px}
.kb-md img{max-width:100%; height:auto; border-radius:8px; border:1px solid var(--kb-line); margin:6px 0}
.kb-md mark{background:color-mix(in srgb,var(--kb-amber) 28%, transparent); color:inherit; padding:0 3px; border-radius:3px}
.kb-md del{opacity:.65}
.kb-md .kb-math{font-family:"STIX Two Math","Latin Modern Math",Georgia,serif; color:var(--kb-cyan); background:color-mix(in srgb,var(--kb-cyan) 7%, transparent); padding:0 3px; border-radius:3px; white-space:nowrap}
.kb-md .kb-math-block{display:block; overflow:auto; margin:10px 0; padding:10px 12px; border-radius:8px; border:1px solid var(--kb-line); background:color-mix(in srgb,var(--kb-bg) 55%, transparent); font-family:"STIX Two Math","Latin Modern Math",Georgia,serif; color:var(--kb-cyan); white-space:pre-wrap; line-height:1.6}
.kb-md .kb-embed{display:inline-flex; align-items:center; gap:4px; color:var(--kb-violet); border:1px dashed color-mix(in srgb,var(--kb-violet) 40%, transparent); border-radius:5px; padding:0 5px; font-size:11px}
.kb-md hr{margin:18px 0}
.kb-md em{color:var(--kb-dim)}
.kb-demobanner{display:flex; align-items:center; gap:7px; font-size:10.5px; padding:7px 9px; border-radius:8px; margin-bottom:12px;
  color:var(--kb-amber); background:color-mix(in srgb,var(--kb-amber) 9%, transparent); border:1px solid color-mix(in srgb,var(--kb-amber) 24%, transparent)}
.kb-previewfail{display:flex; flex-direction:column; align-items:flex-start; gap:11px; border:1px dashed var(--kb-line-2); border-radius:11px; padding:18px; margin-top:8px}
.kb-previewfail h4{margin:0; font-size:13px}
.kb-previewfail p{margin:0; font-size:11px; color:var(--kb-faint); line-height:1.6}
.kb-skel{display:flex; flex-direction:column; gap:9px; padding-top:4px}
.kb-skel i{display:block; height:11px; border-radius:5px; background:linear-gradient(90deg, color-mix(in srgb,var(--kb-dim) 10%, transparent), color-mix(in srgb,var(--kb-dim) 20%, transparent), color-mix(in srgb,var(--kb-dim) 10%, transparent)); background-size:220% 100%; animation:kb-shimmer 1.2s linear infinite}
@keyframes kb-shimmer{from{background-position:120% 0}to{background-position:-120% 0}}

/* ------------------------------------------------------------------ toast */
.kb-toast{
  position:absolute; z-index:30; left:50%; bottom:22px; transform:translateX(-50%);
  display:flex; align-items:center; gap:7px; padding:8px 13px; border-radius:9px; font-size:11.5px;
  border:1px solid var(--kb-line-2); background:color-mix(in srgb,var(--kb-bg) 94%, transparent);
  box-shadow:0 12px 34px rgba(0,0,0,.3); animation:kb-toastin .2s ease both; max-width:80%;
}
@keyframes kb-toastin{from{opacity:0; transform:translate(-50%, 8px)}to{opacity:1; transform:translate(-50%,0)}}
.kb-toast[data-kind="err"]{color:var(--kb-red); border-color:color-mix(in srgb,var(--kb-red) 34%, transparent)}
.kb-toast[data-kind="ok"]{color:var(--kb-green); border-color:color-mix(in srgb,var(--kb-green) 30%, transparent)}

/* -------------------------------------------------------------- responsive */
@media (max-width: 1220px){
  .kb-kpis{grid-template-columns:repeat(2, minmax(0,1fr))}
  .kb-grid-2, .kb-grid-2b{grid-template-columns:1fr}
  .kb-sourcegrid{grid-template-columns:repeat(2, minmax(0,1fr))}
  .kb-columns{grid-template-columns:repeat(2, minmax(0,1fr))}
  .kb-settings{grid-template-columns:1fr}
  .kb-search{flex-basis:190px}
}
@media (max-width: 980px){
  .kb-brandtext span{display:none}
  .kb-nav button em{display:none}
  .kb-status{display:none}
  .kb-search{flex-basis:150px}
  .kb-todolayout{grid-template-columns:1fr}
  .kb-projectrail{flex-direction:row; flex-wrap:wrap; position:static}
}
@media (max-width: 760px){
  .kb-kpis, .kb-sourcegrid, .kb-todostats{grid-template-columns:1fr 1fr}
  .kb-columns{grid-template-columns:1fr}
  .kb-page{padding:14px 12px 28px}
  .kb-nav{display:none}
}
`
