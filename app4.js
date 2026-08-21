function pdfHours(m){return (Math.max(0,Number(m)||0)/60).toFixed(2).replace('.',',')}
function pdfDateShort(k){const d=fromKey(k);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()}
function worksheetSplitWork(e){const raw=String(e?.note||'').trim();let client='',body=raw;const colon=raw.indexOf(':');if(colon>=0){client=raw.slice(0,colon).trim();body=raw.slice(colon+1).trim()}if(!client&&e?.name)client=String(e.name).trim();let lines=body.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!lines.length&&body)lines=[body];if(!lines.length)lines=['Arbeit'];return {client,lines:lines.slice(0,5)}}
function worksheetDayData(k,e){if(!e)return {client:'',lines:[],hours:[],date:''};if(e.type==='work'){const p=worksheetSplitWork(e),lines=p.lines.slice(),hours=[];const regular=workMins(e);if(regular>0)hours.push({line:0,value:pdfHours(regular)});const bad=badWeatherMins(e);if(bad>0){const idx=Math.min(lines.length,4);lines.splice(idx,0,'Schlechtwetter');hours.push({line:idx,value:pdfHours(bad)})}return {client:p.client,lines:lines.slice(0,6),hours,date:pdfDateShort(k)}}const label=e.type==='vacation'?'Urlaub':e.type==='holiday'?'Feiertag':'Krankheit';return {client:'',lines:[[label,e.name,e.note].filter(Boolean).join(' - ')],hours:[],date:pdfDateShort(k)}}
function worksheetTableRows(){const names=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];let out='';for(let i=0;i<6;i++){const k=key(addDays(W,i)),e=byDate(k),d=worksheetDayData(k,e),hs={};(d.hours||[]).forEach(x=>hs[x.line]=x.value);let detail='';for(let j=0;j<6;j++){const line=(d.lines||[])[j]||'',bad=line==='Schlechtwetter';detail+=`<div class="workline${bad?' bad':''}">${esc(line)}</div>`}let totals='';for(let j=0;j<6;j++)totals+=`<div class="workline total">${hs[j]?esc(hs[j]):''}</div>`;out+=`<div class="dayrow"><div class="weekday">${names[i]}</div><div class="datecell">${e?esc(d.date):''}</div><div class="clientcell">${e?esc(d.client||''):''}</div><div class="workcell">${detail}</div><div class="singlecell">${'<div class="workline"></div>'.repeat(6)}</div><div class="totalcell">${totals}</div></div>`}return out}
function printWorksheetWeek(){const win=window.open('','_blank');if(!win){toast('Popup für PDF erlauben');return}const start=key(W),end=key(addDays(W,5)),from=pdfDateShort(start).slice(0,6),to=pdfDateShort(end).slice(0,6),yr=String(fromKey(start).getFullYear()).slice(-2);const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arbeitszettel ${key(W)}</title><style>
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#e7e9ed;font-family:Arial,Helvetica,sans-serif;color:#111}
body{display:flex;justify-content:center}
.wrap{width:210mm;height:297mm;transform-origin:top center}
.page{width:210mm;height:297mm;background:#fff;padding:12mm 13mm 10mm;position:relative;overflow:hidden}
.header{height:48mm}
.title{font-size:22pt;font-weight:800;margin:0 0 12mm}
.meta{font-size:10pt;line-height:1.7}
.metaRow{display:flex;align-items:flex-end;gap:2mm;margin-bottom:2mm}
.metaLine{display:inline-block;border-bottom:.3mm solid #333;min-width:28mm;text-align:center;font-weight:700;line-height:1.1;padding-bottom:1mm}
.metaLine.name{min-width:78mm;text-align:left;padding-left:2mm}
.sheet{border:.35mm solid #222;height:222mm}
.headrow{height:11mm;display:grid;grid-template-columns:8mm 18mm 22mm 1fr 14mm 14mm;border-bottom:.35mm solid #222;font-size:7.4pt;font-weight:700;text-align:center}
.headrow>div{display:flex;align-items:center;justify-content:center;border-right:.25mm solid #222}
.headrow>div:last-child{border-right:0}
.dayrow{height:35.16mm;display:grid;grid-template-columns:8mm 18mm 22mm 1fr 14mm 14mm;border-bottom:.35mm solid #222;font-size:6.9pt}
.dayrow:last-child{border-bottom:0}
.dayrow>div{border-right:.25mm solid #222}
.dayrow>div:last-child{border-right:0}
.weekday{display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:7.5pt}
.datecell,.clientcell{display:flex;align-items:center;justify-content:center;text-align:center;padding:1mm}
.workcell,.singlecell,.totalcell{display:grid;grid-template-rows:repeat(6,1fr)}
.workline{display:flex;align-items:center;border-bottom:.15mm solid #aaa;padding:0 1.5mm;min-height:0}
.workline:last-child{border-bottom:0}
.workcell .workline{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workline.bad{justify-content:flex-end;font-weight:700;padding-right:2mm}
.singlecell .workline,.totalcell .workline{justify-content:center;padding:0}
.workline.total{font-weight:700}
.bottomTotal{position:absolute;right:13mm;bottom:4.5mm;font-size:8pt;font-weight:700}
.bottomTotal span{display:inline-block;width:28mm;border-bottom:.3mm solid #222;margin-left:3mm;transform:translateY(-1mm)}
@media screen{body{padding:8px 0 20px}.wrap{box-shadow:0 4px 22px rgba(0,0,0,.18)}}
@media print{html,body{width:210mm;height:297mm;background:#fff;overflow:hidden}body{display:block}.wrap{transform:none!important;width:210mm!important;height:297mm!important}.page{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="wrap"><div class="page"><div class="header"><div class="title">Arbeitszettel</div><div class="meta"><div class="metaRow">vom <span class="metaLine">${esc(from)}</span> bis <span class="metaLine">${esc(to)}</span> 20 <span class="metaLine" style="min-width:9mm">${esc(yr)}</span></div><div class="metaRow">für <span class="metaLine name">Rodenbach</span></div></div></div><div class="sheet"><div class="headrow"><div></div><div>Datum</div><div>Bei wem<br>gearbeitet</div><div>Art der Arbeit</div><div>Einzel-<br>Std.</div><div>Gesamt-<br>Std.</div></div>${worksheetTableRows()}</div><div class="bottomTotal">Gesamt:<span></span></div></div></div><script>(function(){const wrap=document.querySelector('.wrap');function fit(){if(matchMedia('print').matches)return;const s=Math.min(1,(innerWidth-16)/wrap.offsetWidth);wrap.style.transform='scale('+s+')';wrap.style.height=(297*s)+'mm'}addEventListener('resize',fit);fit();setTimeout(()=>window.print(),250)})()<\/script></body></html>`;win.document.open();win.document.write(html);win.document.close()}
$('csvWeek').onclick=()=>downloadCsv(false);$('csvAll').onclick=()=>downloadCsv(true);$('printWeek').onclick=printWorksheetWeek;if($('viewMore')&&!$('appVersion'))$('viewMore').insertAdjacentHTML('beforeend','<div class="moreCard" id="appVersion"><div class="moreRow"><span>Version</span><b>1.3.1 Beta</b></div></div>');setInterval(()=>{if(active&&$('runningTimer'))$('runningTimer').textContent=clock(activeElapsed());if(!active){const any=entries.some(e=>e.date===key()&&e.type==='work'&&recentRemaining(e)>0);if(any)renderStart()}},1000);