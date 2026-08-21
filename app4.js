const WORKSHEET_BG='header.jpg';
function pdfHours(m){return (Math.max(0,Number(m)||0)/60).toFixed(2).replace('.',',')}
function pdfDateShort(k){const d=fromKey(k);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()}
function worksheetSplitWork(e){
  const raw=String(e?.note||'').trim();
  let client='',body=raw;
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
    const p=worksheetSplitWork(e),lines=p.lines.slice(),hours=[];
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
  const detail=[label,e.name,e.note].filter(Boolean).join(' - ');
  return {client:'',lines:[detail],hours:[],date:pdfDateShort(k)};
}
function worksheetHeaderOverlayHtml(){
  const start=key(W),end=key(addDays(W,5));
  return `<div class="ov field from">${esc(pdfDateShort(start).slice(0,6))}</div>`+
         `<div class="ov field to">${esc(pdfDateShort(end).slice(0,6))}</div>`+
         `<div class="ov field year">${String(fromKey(start).getFullYear()).slice(-2)}</div>`+
         `<div class="ov field employee">Rodenbach</div>`;
}
function worksheetVectorRows(){
  const names=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  let html='';
  for(let i=0;i<6;i++){
    const k=key(addDays(W,i)),e=byDate(k),d=worksheetDayData(k,e);
    const lines=(d.lines||[]).slice(0,6),hs={};
    (d.hours||[]).forEach(x=>hs[x.line]=x.value);
    html+=`<div class="dayblock"><div class="dayname">${names[i]}</div><div class="datecell">${e?esc(d.date):''}</div><div class="clientcell">${e?esc(d.client||''):''}</div><div class="descgrid">`;
    for(let j=0;j<6;j++){
      const line=lines[j]||'',bad=line==='Schlechtwetter';
      html+=`<div class="subrow descrow${bad?' badrow':''}">${esc(line)}</div>`;
    }
    html+=`</div><div class="singlegrid">${Array.from({length:6},()=>'<div class="subrow"></div>').join('')}</div><div class="totalgrid">`;
    for(let j=0;j<6;j++)html+=`<div class="subrow totalrow">${hs[j]?esc(hs[j]):''}</div>`;
    html+='</div></div>';
  }
  return html;
}
function printWorksheetWeek(){
  const win=window.open('','_blank');
  if(!win){toast('Popup für PDF erlauben');return}
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arbeitszettel ${key(W)}</title><style>
  @page{size:A4 portrait;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0;width:210mm;height:297mm;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#111}
  .page{position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff}
  .headerbg{position:absolute;left:0;top:0;width:210mm;height:56.7mm;object-fit:fill}
  .pretableLine{position:absolute;left:22.34mm;top:63.0mm;width:173.18mm;border-top:.22mm solid #222}
  .ov{position:absolute;z-index:3;font-size:8.2pt;line-height:1.05;color:#111;font-weight:600;white-space:nowrap}
  .from{left:34.0mm;top:39.7mm;width:20mm;text-align:center}
  .to{left:66.0mm;top:39.7mm;width:20mm;text-align:center}
  .year{left:92.0mm;top:39.7mm;width:8mm;text-align:center}
  .employee{left:34.5mm;top:50.1mm;width:55mm;font-size:9.1pt;text-align:left}
  .sheet{position:absolute;left:22.34mm;top:67.56mm;width:173.18mm;height:209.84mm;border:.30mm solid #222;background:#fff}
  .thead{height:11.60mm;display:grid;grid-template-columns:7.70mm 17.67mm 21.46mm 97.98mm 14.09mm 14.28mm;border-bottom:.30mm solid #222;font-size:7.2pt;font-weight:600;text-align:center;align-items:center}
  .thead>div{height:100%;display:flex;align-items:center;justify-content:center;border-right:.22mm solid #222;line-height:1.05}
  .thead>div:last-child{border-right:0}
  .body{height:198.24mm}
  .dayblock{height:33.04mm;display:grid;grid-template-columns:7.70mm 17.67mm 21.46mm 97.98mm 14.09mm 14.28mm;border-bottom:.30mm solid #222;font-size:7.0pt}
  .dayblock:last-child{border-bottom:0}
  .dayblock>div{border-right:.22mm solid #222}
  .dayblock>div:last-child{border-right:0}
  .dayname{display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:7.5pt}
  .datecell,.clientcell{display:flex;align-items:center;justify-content:center;text-align:center;padding:.7mm;white-space:pre-wrap;overflow-wrap:anywhere;font-size:6.7pt}
  .descgrid,.singlegrid,.totalgrid{display:grid;grid-template-rows:repeat(6,1fr)}
  .subrow{border-bottom:.16mm solid #888;display:flex;align-items:center;padding:0 1.6mm;min-height:0}
  .subrow:last-child{border-bottom:0}
  .descrow{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:6.9pt}
  .badrow{justify-content:flex-end;font-weight:700;padding-right:2.4mm}
  .singlegrid .subrow,.totalgrid .subrow{justify-content:center;padding:0;font-size:6.9pt}
  .totalrow{font-weight:700}
  .bottomlabel{position:absolute;left:146.8mm;top:281.0mm;font-weight:700;font-size:7.6pt}
  .bottomline{position:absolute;left:166.6mm;top:285.0mm;width:28.8mm;border-bottom:.22mm solid #222}
  @media print{html,body,.page{width:210mm;height:297mm}.page{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="page"><img class="headerbg" src="${WORKSHEET_BG}"><div class="pretableLine"></div>${worksheetHeaderOverlayHtml()}<div class="sheet"><div class="thead"><div></div><div>Datum</div><div>Bei wem<br>gearbeitet</div><div>Art der Arbeit</div><div>Einzel-<br>Std.</div><div>Gesamt-<br>Std.</div></div><div class="body">${worksheetVectorRows()}</div></div><div class="bottomlabel">Gesamt:</div><div class="bottomline"></div></div><script>(function(){const im=document.querySelector('.headerbg');const go=()=>setTimeout(()=>window.print(),180);if(im.complete)go();else{im.onload=go;im.onerror=go}})()<\/script></body></html>`;
  win.document.open();win.document.write(html);win.document.close();
}
$('csvWeek').onclick=()=>downloadCsv(false);
$('csvAll').onclick=()=>downloadCsv(true);
$('printWeek').onclick=printWorksheetWeek;
if($('viewMore')&&!$('appVersion'))$('viewMore').insertAdjacentHTML('beforeend','<div class="moreCard" id="appVersion"><div class="moreRow"><span>Version</span><b>1.2.1 Beta</b></div></div>');
setInterval(()=>{if(active&&$('runningTimer'))$('runningTimer').textContent=clock(activeElapsed());if(!active){const any=entries.some(e=>e.date===key()&&e.type==='work'&&recentRemaining(e)>0);if(any)renderStart()}},1000);