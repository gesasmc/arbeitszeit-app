(function(){
  function parseRows(text){
    text=String(text||'').replace(/^\uFEFF/,'');
    const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){if(q&&text[i+1]==='"'){cell+='"';i++}else q=!q}
      else if(ch===';'&&!q){row.push(cell);cell=''}
      else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[]}
      else cell+=ch;
    }
    row.push(cell);if(row.some(v=>String(v).trim()!==''))rows.push(row);return rows;
  }
  const dmY=s=>{const m=String(s||'').match(/(\d{1,2})\.(\d{1,2})\.(20\d{2})/);return m?`${m[3]}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`:''};
  const hm=s=>{const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?`${String(+m[1]).padStart(2,'0')}:${m[2]}`:''};
  const decHours=s=>{const m=String(s||'').trim().replace(/\./g,'').replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Math.max(0,Math.round(Number(m[0])*60)):0};
  function exactAtWork(rows){
    const hi=rows.findIndex(r=>String(r[0]||'').trim()==='#'&&String(r[1]||'').trim().toLowerCase()==='beginn'&&String(r[2]||'').trim().toLowerCase()==='ende');if(hi<0)return null;
    const out=[],bad=[];
    for(let i=hi+1;i<rows.length;i++){const r=rows[i];if(!r||!r.length)continue;if(String(r[0]||'').trim().toLowerCase()==='gesamt')break;const date=dmY(r[1]);if(!date)continue;const start=hm(r[1]),end=hm(r[2]);if(!start||!end)continue;const duration=decHours(r[3]),span=Math.max(0,mins(end)-mins(start)),pause=Math.max(0,span-duration),second=decHours(r[4]),note=String(r[5]||'').trim(),e={date,type:'work',start,end,breakMinutes:pause,wage:0,note};if(second>0){e.badWeatherHours=second/60;bad.push(date)}out.push(e)}
    const groups=new Map();for(const e of out){if(!groups.has(e.date))groups.set(e.date,[]);groups.get(e.date).push(e)}const items=[];
    for(const [date,list] of groups){if(list.length===1){items.push(list[0]);continue}const startMin=Math.min(...list.map(e=>mins(e.start))),endMin=Math.max(...list.map(e=>mins(e.end))),net=list.reduce((s,e)=>s+Math.max(0,mins(e.end)-mins(e.start)-(Number(e.breakMinutes)||0)),0),merged={date,type:'work',start:timeStr(startMin),end:timeStr(endMin),breakMinutes:Math.max(0,endMin-startMin-net),wage:0,note:list.map(e=>e.note).filter(Boolean).join('\n---\n')};const bw=list.reduce((s,e)=>s+Math.round((Number(e.badWeatherHours)||0)*60),0);if(bw)merged.badWeatherHours=bw/60;items.push(merged)}
    return {items,badCount:bad.length,headerIndex:hi};
  }
  function install(){
    const input=document.getElementById('atworkFile'),btn=document.getElementById('atworkImportBtn'),status=document.getElementById('atworkImportStatus');if(!input||!btn||!status)return;
    btn.textContent='AtWork-Datei importieren (.csv / .txt)';input.setAttribute('accept','.csv,.txt,text/csv,text/plain');
    input.onchange=async()=>{const file=input.files&&input.files[0];if(!file)return;try{status.textContent='AtWork-Datei wird geprüft …';const rows=parseRows(await file.text()),parsed=exactAtWork(rows);if(!parsed||!parsed.items.length){status.textContent='Dieses Format wurde nicht erkannt.';alert('Die Datei entspricht nicht dem erwarteten AtWork-Export.');return}const occupied=new Set(entries.map(e=>e.date)),fresh=parsed.items.filter(e=>!occupied.has(e.date)),skipped=parsed.items.length-fresh.length;let msg=`AtWork-Datei erkannt.\n\n${parsed.items.length} Tage gefunden\n${fresh.length} neue Tage importierbar`;if(skipped)msg+=`\n${skipped} Tage bereits vorhanden (werden nicht überschrieben)`;msg+='\n\nJetzt importieren?';if(!confirm(msg)){status.textContent='Import abgebrochen.';return}localStorage.setItem('arbeitszeit-app-import-backup-'+new Date().toISOString(),JSON.stringify(entries));entries.push(...fresh);entries.sort((a,b)=>a.date.localeCompare(b.date));store();if(typeof renderAll==='function')renderAll();else{renderStart();renderWeek();if(typeof renderCalendar==='function')renderCalendar()}status.textContent=`${fresh.length} Tage aus AtWork importiert. Backup gespeichert.`;toast(`${fresh.length} AtWork-Tage importiert`)}catch(err){console.error(err);status.textContent='Import fehlgeschlagen.';alert('Die AtWork-Datei konnte nicht importiert werden.')}finally{input.value=''}};
    const v=document.querySelector('#appVersion b');if(v)v.textContent='1.4.4 Beta';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();

(function(){
  function easterSunday(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da,12)}
  function hessenHolidays(y){const e=easterSunday(y);return[[new Date(y,0,1,12),'Neujahr'],[addDays(e,-2),'Karfreitag'],[addDays(e,1),'Ostermontag'],[new Date(y,4,1,12),'Tag der Arbeit'],[addDays(e,39),'Christi Himmelfahrt'],[addDays(e,50),'Pfingstmontag'],[addDays(e,60),'Fronleichnam'],[new Date(y,9,3,12),'Tag der Deutschen Einheit'],[new Date(y,11,25,12),'1. Weihnachtsfeiertag'],[new Date(y,11,26,12),'2. Weihnachtsfeiertag']]}
  function installHessenHolidays(){let changed=false,cy=new Date().getFullYear();for(let y=cy-6;y<=cy+10;y++){for(const[d,name]of hessenHolidays(y)){const dk=key(d);if(byDate(dk)||active?.date===dk)continue;entries.push({date:dk,type:'holiday',start:'',end:'',breakMinutes:0,name,note:'Gesetzlicher Feiertag in Hessen',targetDayMinutes:targetFor(dk),autoHoliday:'HE'});changed=true}}if(changed){entries.sort((a,b)=>a.date.localeCompare(b.date));store()}if(typeof renderAll==='function')renderAll()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(installHessenHolidays,10));else setTimeout(installHessenHolidays,10);
})();
