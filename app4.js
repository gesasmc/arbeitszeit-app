const WORKSHEET_BG='worksheet-template.jpg'
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
function worksheetOverlayHtml(){
  const start=key(W),end=key(addDays(W,5));
  let html=`<div class="field from">${esc(pdfDateShort(start).slice(0,6))}</div>`+
           `<div class="field to">${esc(pdfDateShort(end).slice(0,6))}</div>`+
           `<div class="field year">${String(fromKey(start).getFullYear()).slice(-2)}</div>`+
           `<div class="field employee">Rodenbach</div>`;
  const bodyTop=27.45, dayH=10.94, subH=dayH/6;
  for(let i=0;i<6;i++){
    const k=key(addDays(W,i)),e=byDate(k),d=worksheetDayData(k,e);
    if(!e)continue;
    const dayTop=bodyTop+i*dayH;
    html+=`<div class="cell date" style="top:${dayTop+dayH/2}%">${esc(d.date)}</div>`;
    if(d.client)html+=`<div class="cell client" style="top:${dayTop+dayH/2}%">${esc(d.client)}</div>`;
    const hs={};(d.hours||[]).forEach(x=>hs[x.line]=x.value);
    (d.lines||[]).slice(0,6).forEach((line,j)=>{
      const y=dayTop+(j+.5)*subH;
      const bad=line==='Schlechtwetter';
      html+=`<div class="desc${bad?' bad':''}" style="top:${y}%">${esc(line)}</div>`;
      if(hs[j])html+=`<div class="hours" style="top:${y}%">${esc(hs[j])}</div>`;
    });
  }
  return html;
}
function printWorksheetWeek(){
  const win=window.open('','_blank');
  if(!win){toast('Popup für PDF erlauben');return}
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><title>Arbeitszettel ${key(W)}</title><style>
  @page{size:A4 portrait;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0;background:#e8eaee;font-family:Arial,Helvetica,sans-serif;color:#111}
  body{display:flex;justify-content:center;align-items:flex-start;overflow:auto}
  .screenFit{transform-origin:top center}
  .page{position:relative;width:210mm;height:297mm;background:#fff;overflow:hidden}
  .template{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}
  .field,.cell,.desc,.hours{position:absolute;z-index:2;color:#111;line-height:1;transform:translateY(-50%)}
  .field{font-size:7.5pt;font-weight:600;white-space:nowrap}
  .from{left:16.3%;top:14.1%;width:9%;text-align:center}
  .to{left:32.5%;top:14.1%;width:9%;text-align:center}
  .year{left:45.0%;top:14.1%;width:4%;text-align:center}
  .employee{left:16.4%;top:18.0%;width:26%;font-size:8.6pt;text-align:left}
  .cell{font-size:6.3pt;text-align:center;white-space:normal;overflow-wrap:anywhere}
  .date{left:14.4%;width:8.5%}
  .client{left:22.9%;width:10.1%}
  .desc{left:33.2%;width:46.1%;font-size:6.4pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:.7mm}
  .desc.bad{text-align:right;font-weight:700;padding-right:1.8mm;padding-left:0}
  .hours{left:86.35%;width:6.9%;text-align:center;font-size:6.4pt;font-weight:700}
  @media screen{body{padding:8px 0 18px}.page{box-shadow:0 4px 24px rgba(0,0,0,.18)}}
  @media print{html,body{width:210mm;height:297mm;background:#fff;overflow:hidden}body{display:block;padding:0}.screenFit{transform:none!important;width:210mm!important;height:297mm!important}.page{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="screenFit"><div class="page"><img class="template" src="${WORKSHEET_BG}">${worksheetOverlayHtml()}</div></div><script>
  (function(){
    const wrap=document.querySelector('.screenFit'),page=document.querySelector('.page'),img=document.querySelector('.template');
    function fit(){if(matchMedia('print').matches)return;const s=Math.min(1,(innerWidth-16)/page.offsetWidth);wrap.style.transform='scale('+s+')';wrap.style.width=page.offsetWidth+'px';wrap.style.height=(page.offsetHeight*s)+'px';}
    const go=()=>{fit();setTimeout(()=>window.print(),350)};
    addEventListener('resize',fit);if(img.complete)go();else{img.onload=go;img.onerror=go}
  })()<\/script></body></html>`;
  win.document.open();win.document.write(html);win.document.close();
}
$('csvWeek').onclick=()=>downloadCsv(false);
$('csvAll').onclick=()=>downloadCsv(true);
$('printWeek').onclick=printWorksheetWeek;
if($('viewMore')&&!$('appVersion'))$('viewMore').insertAdjacentHTML('beforeend','<div class="moreCard" id="appVersion"><div class="moreRow"><span>Version</span><b>1.2.2 Beta</b></div></div>');
setInterval(()=>{if(active&&$('runningTimer'))$('runningTimer').textContent=clock(activeElapsed());if(!active){const any=entries.some(e=>e.date===key()&&e.type==='work'&&recentRemaining(e)>0);if(any)renderStart()}},1000);
