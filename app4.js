const WORKSHEET_BG='header.jpg';
function pdfHours(m){return (Math.max(0,Number(m)||0)/60).toFixed(2).replace('.',',')}
function pdfDateShort(k){const d=fromKey(k);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()}
function worksheetSplitWork(e){
  const raw=String(e?.note||'').trim();
  let client='', body=raw;
  const colon=raw.indexOf(':');
  if(colon>=0){client=raw.slice(0,colon).trim();body=raw.slice(colon+1).trim()}
  if(!client&&e?.name)client=String(e.name).trim();
  let lines=body.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length&&body)lines=[body];
  if(!lines.length)lines=['Arbeit'];
  return {client,lines:lines.slice(0,5)};
}
function worksheetDayData(k,e){
  if(!e)return {client:'',lines:[],hours:[],date:''};
  if(e.type==='work'){
    const p=worksheetSplitWork(e), lines=p.lines.slice(), hours=[];
    const regular=workMins(e);
    if(regular>0)hours.push({line:0,value:pdfHours(regular)});
    const bad=badWeatherMins(e);
    if(bad>0){
      const idx=Math.min(lines.length,4);
      lines.splice(idx,0,'Schlechtwetter');
      hours.push({line:idx,value:pdfHours(bad)});
    }
    return {client:p.client,lines:lines.slice(0,6),hours,date:pdfDateShort(k)};
  }
  const label=e.type==='vacation'?'Urlaub':e.type==='holiday'?'Feiertag':'Krankheit';
  const line=label+(e.name?' - '+e.name:'')+(e.note?' - '+e.note:'');
  return {client:'',lines:[line],hours:[],date:pdfDateShort(k)};
}
function mm(n){return (n/998*210).toFixed(3)+'mm'}
function mmy(n){return (n/1382*297).toFixed(3)+'mm'}
function worksheetHeaderOverlayHtml(){
  let html=''; const start=key(W), end=key(addDays(W,5));
  html+=`<div class="ov field from">${esc(pdfDateShort(start).slice(0,6))}</div>`;
  html+=`<div class="ov field to">${esc(pdfDateShort(end).slice(0,6))}</div>`;
  html+=`<div class="ov field year">${String(fromKey(start).getFullYear()).slice(-2)}</div>`;
  html+=`<div class="ov field employee">Rodenbach</div>`;
  return html;
}
function worksheetVectorRows(){
  const names=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  let html='';
  for(let i=0;i<6;i++){
    const k=key(addDays(W,i)),e=byDate(k),d=worksheetDayData(k,e);
    const lines=(d.lines||[]).slice(0,6), hs={}; (d.hours||[]).forEach(x=>hs[x.line]=x.value);
    html+=`<div class="dayblock"><div class="dayname">${names[i]}</div><div class="datecell">${e?esc(d.date):''}</div><div class="clientcell">${e?esc(d.client||''):''}</div><div class="descgrid">`;
    for(let j=0;j<6;j++){const line=lines[j]||'',bad=line==='Schlechtwetter';html+=`<div class="subrow descrow${bad?' badrow':''}">${esc(line)}</div>`}
    html+=`</div><div class="singlegrid">${Array.from({length:6},()=>'<div class="subrow"></div>').join('')}</div><div class="totalgrid">`;
    for(let j=0;j<6;j++)html+=`<div class="subrow totalrow">${hs[j]?esc(hs[j]):''}</div>`;
    html+='</div></div>';
  }
  return html;
}
function printWorksheetWeek(){
  const win=window.open('','_blank');if(!win){toast('Popup für PDF erlauben');return}
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Arbeitszettel ${key(W)}</title><style>
  @page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;width:210mm;height:297mm;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#111}.page{position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff}.headerbg{position:absolute;left:0;top:0;width:210mm;height:56.7mm;object-fit:fill}.ov{position:absolute;z-index:3;font-size:8.6pt;line-height:1.1;color:#111}.field{font-weight:600}.from{left:${mm(186)};top:${mmy(180)};width:${mm(87)}}.to{left:${mm(312)};top:${mmy(180)};width:${mm(92)}}.year{left:${mm(447)};top:${mmy(180)};width:${mm(25)}}.employee{left:${mm(145)};top:${mmy(224)};width:${mm(330)};font-size:10pt}.sheet{position:absolute;left:18.4mm;top:55.7mm;width:177.4mm;height:216mm;border:0.35mm solid #111;background:#fff}.thead{height:12.5mm;display:grid;grid-template-columns:6.5mm 18mm 24mm 96.5mm 15mm 17.4mm;border-bottom:.3mm solid #111;font-size:7.5pt;font-weight:700;text-align:center;align-items:center}.thead>div{height:100%;display:flex;align-items:center;justify-content:center;border-right:.25mm solid #111}.thead>div:last-child{border-right:0}.body{height:198.5mm}.dayblock{height:33.083mm;display:grid;grid-template-columns:6.5mm 18mm 24mm 96.5mm 15mm 17.4mm;border-bottom:.35mm solid #111;font-size:7.3pt}.dayblock:last-child{border-bottom:0}.dayblock>div{border-right:.25mm solid #111}.dayblock>div:last-child{border-right:0}.dayname{display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700}.datecell,.clientcell{display:flex;align-items:center;justify-content:center;text-align:center;padding:1mm;white-space:pre-wrap;overflow-wrap:anywhere}.descgrid,.singlegrid,.totalgrid{display:grid;grid-template-rows:repeat(6,1fr)}.subrow{border-bottom:.18mm solid #777;display:flex;align-items:center;padding:0 2mm;min-height:0}.subrow:last-child{border-bottom:0}.descrow{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.badrow{justify-content:flex-end;font-weight:700;padding-right:3mm}.singlegrid .subrow,.totalgrid .subrow{justify-content:center;padding:0}.totalrow{font-weight:700}.bottomlabel{position:absolute;right:35mm;bottom:10mm;font-weight:700;font-size:8.5pt}.bottomline{position:absolute;right:15mm;bottom:9.5mm;width:18mm;border-bottom:.3mm solid #111}@media print{.page{break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="page"><img class="headerbg" src="${WORKSHEET_BG}">${worksheetHeaderOverlayHtml()}<div class="sheet"><div class="thead"><div></div><div>Datum</div><div>Bei wem<br>gearbeitet</div><div>Art der Arbeit</div><div>Einzel-<br>Std.</div><div>Gesamt-<br>Std.</div></div><div class="body">${worksheetVectorRows()}</div></div><div class="bottomlabel">Gesamt:</div><div class="bottomline"></div></div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
  win.document.open();win.document.write(html);win.document.close();
}
$('csvWeek').onclick=()=>downloadCsv(false);$('csvAll').onclick=()=>downloadCsv(true);$('printWeek').onclick=printWorksheetWeek;
setInterval(()=>{if(active&&$('runningTimer'))$('runningTimer').textContent=clock(activeElapsed());if(!active){const any=entries.some(e=>e.date===key()&&e.type==='work'&&recentRemaining(e)>0);if(any)renderStart()}},1000);