(function(){
  const originalPrintWorksheetWeek=window.printWorksheetWeek;

  function installIosPdfSave(child){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      try{
        if(child.closed){clearInterval(timer);return}
        const jsPDF=child.jspdf&&child.jspdf.jsPDF;
        if(jsPDF&&jsPDF.API){
          clearInterval(timer);
          jsPDF.API.save=async function(filename){
            const name=filename||'Arbeitszettel.pdf';
            const blob=this.output('blob');
            try{
              const file=new child.File([blob],name,{type:'application/pdf'});
              const nav=child.navigator;
              if(nav.share&&(!nav.canShare||nav.canShare({files:[file]}))){
                await nav.share({files:[file],title:name});
                return this;
              }
            }catch(err){
              if(err&&err.name==='AbortError')return this;
              console.warn('Teilen nicht verfügbar, nutze Download-Fallback',err);
            }
            const url=child.URL.createObjectURL(blob);
            const a=child.document.createElement('a');
            a.href=url;
            a.download=name;
            child.document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>child.URL.revokeObjectURL(url),1500);
            return this;
          };
        }
      }catch(e){console.warn(e)}
      if(attempts>80)clearInterval(timer);
    },100);
  }

  if(typeof originalPrintWorksheetWeek==='function'){
    window.printWorksheetWeek=function(){
      let child=null;
      const realOpen=window.open;
      window.open=function(){child=realOpen.apply(window,arguments);return child};
      try{originalPrintWorksheetWeek()}finally{window.open=realOpen}
      if(child)installIosPdfSave(child);
    };
    const printBtn=document.getElementById('printWeek');
    if(printBtn)printBtn.onclick=window.printWorksheetWeek;
  }

  function norm(s){
    return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  }

  function detectDelimiter(text){
    const line=(text.split(/\r?\n/).find(x=>x.trim())||'');
    const candidates=[';','\t',','];
    let best=';',score=-1;
    for(const d of candidates){
      let q=false,c=0;
      for(let i=0;i<line.length;i++){
        if(line[i]==='"')q=!q;
        else if(!q&&line[i]===d)c++;
      }
      if(c>score){score=c;best=d}
    }
    return best;
  }

  function parseCsv(text){
    text=String(text||'').replace(/^\uFEFF/,'');
    const d=detectDelimiter(text), rows=[];
    let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){
        if(q&&text[i+1]==='"'){cell+='"';i++}else q=!q;
      }else if(ch===d&&!q){row.push(cell);cell=''}
      else if((ch==='\n'||ch==='\r')&&!q){
        if(ch==='\r'&&text[i+1]==='\n')i++;
        row.push(cell);cell='';
        if(row.some(v=>String(v).trim()!==''))rows.push(row);
        row=[];
      }else cell+=ch;
    }
    row.push(cell);if(row.some(v=>String(v).trim()!==''))rows.push(row);
    return rows;
  }

  function findCol(headers, names){
    const hs=headers.map(norm);
    for(const n of names){
      const nn=norm(n);let i=hs.findIndex(h=>h===nn);if(i>=0)return i;
    }
    for(const n of names){
      const nn=norm(n);let i=hs.findIndex(h=>h.includes(nn)||nn.includes(h));if(i>=0)return i;
    }
    return -1;
  }

  function parseDate(v){
    v=String(v||'').trim();
    let m=v.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if(m)return `${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`;
    m=v.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})/);
    if(m)return `${m[3]}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`;
    return '';
  }

  function parseTime(v){
    const m=String(v||'').match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
    if(!m)return '';
    const h=+m[1],mi=+m[2];if(h>23||mi>59)return '';
    return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
  }

  function parseDuration(v){
    v=String(v||'').trim();if(!v)return 0;
    let m=v.match(/(-?\d+)\s*:\s*(\d{1,2})/);if(m)return Math.max(0,(+m[1])*60+(+m[2]));
    m=v.match(/(-?\d+(?:[.,]\d+)?)\s*(?:h|std|stunden?)?/i);if(m)return Math.max(0,Math.round(parseFloat(m[1].replace(',','.'))*60));
    return 0;
  }

  function parseMoney(v){
    const m=String(v||'').replace(/\s/g,'').match(/-?\d+(?:[.,]\d+)?/);return m?Number(m[0].replace(',','.')):0;
  }

  function mapType(v){
    const s=norm(v);
    if(/urlaub|vacation/.test(s))return 'vacation';
    if(/feiertag|holiday/.test(s))return 'holiday';
    if(/krank|sick/.test(s))return 'sickness';
    return 'work';
  }

  function buildImport(rows){
    if(rows.length<2)return {items:[],invalid:0,headers:[]};
    const h=rows[0];
    const cols={
      date:findCol(h,['Datum','Date','Tag']),
      start:findCol(h,['Beginn','Start','Startzeit','Von']),
      end:findCol(h,['Ende','End','Endzeit','Bis']),
      pause:findCol(h,['Pause','Pausenzeit','Pause Dauer']),
      duration:findCol(h,['Arbeitszeit','Dauer','Duration','Stunden','Zeit']),
      type:findCol(h,['Typ','Type','Art','Sondertag']),
      note:findCol(h,['Notiz','Notizen','Bemerkung','Kommentar','Note']),
      wage:findCol(h,['Stundenlohn','Lohn','Rate','Hourly Rate']),
      bad:findCol(h,['Schlechtwetter','Bad Weather']),
      customer:findCol(h,['Kunde','Customer','Job','Arbeitgeber']),
      project:findCol(h,['Projekt','Project']),
      task:findCol(h,['Aufgabe','Task','Tatigkeit','Tätigkeit']),
      name:findCol(h,['Bezeichnung','Name','Kategorie','Category'])
    };
    const raw=[];let invalid=0;
    for(let r=1;r<rows.length;r++){
      const a=rows[r],date=parseDate(a[cols.date]);if(!date){invalid++;continue}
      const label=[cols.type>=0?a[cols.type]:'',cols.name>=0?a[cols.name]:''].filter(Boolean).join(' ');
      const type=mapType(label);
      const names=[cols.customer>=0?a[cols.customer]:'',cols.project>=0?a[cols.project]:'',cols.task>=0?a[cols.task]:''].map(x=>String(x||'').trim()).filter(Boolean);
      const noteParts=[];if(cols.note>=0&&String(a[cols.note]||'').trim())noteParts.push(String(a[cols.note]).trim());
      if(names.length)noteParts.unshift(names.join(' · '));
      if(type!=='work'){
        raw.push({date,type,name:String((cols.name>=0?a[cols.name]:'')||(cols.type>=0?a[cols.type]:'')||'').trim(),note:noteParts.join('\n'),targetDayMinutes:0});
        continue;
      }
      let start=cols.start>=0?parseTime(a[cols.start]):'',end=cols.end>=0?parseTime(a[cols.end]):'';
      let pause=cols.pause>=0?parseDuration(a[cols.pause]):0;
      let duration=cols.duration>=0?parseDuration(a[cols.duration]):0;
      if(start&&end&&!duration)duration=Math.max(0,mins(end)-mins(start)-pause);
      if((!start||!end)&&duration){start='08:00';end=timeStr(Math.min(23*60+59,8*60+duration+pause))}
      if(!start||!end||mins(end)<=mins(start)){invalid++;continue}
      if(!duration)duration=Math.max(0,mins(end)-mins(start)-pause);
      const wage=cols.wage>=0?parseMoney(a[cols.wage]):0;
      const badMinutes=cols.bad>=0?parseDuration(a[cols.bad]):0;
      raw.push({date,type:'work',start,end,breakMinutes:pause,wage,note:noteParts.join('\n'),_duration:duration,_bad:badMinutes});
    }
    const grouped=new Map(),conflicts=[];
    for(const e of raw){
      if(!grouped.has(e.date)){grouped.set(e.date,[e]);continue}
      grouped.get(e.date).push(e);
    }
    const items=[];
    for(const [date,list] of grouped){
      if(list.length===1){const e={...list[0]};delete e._duration;delete e._bad;if(list[0]._bad)e.badWeatherHours=list[0]._bad/60;items.push(e);continue}
      if(list.some(x=>x.type!=='work')){conflicts.push(date);continue}
      const startMin=Math.min(...list.map(x=>mins(x.start))),endMin=Math.max(...list.map(x=>mins(x.end))),total=list.reduce((s,x)=>s+(x._duration||0),0);
      const merged={date,type:'work',start:timeStr(startMin),end:timeStr(endMin),breakMinutes:Math.max(0,endMin-startMin-total),wage:list.find(x=>x.wage>0)?.wage||0,note:list.map(x=>x.note).filter(Boolean).join('\n---\n')};
      const bad=list.reduce((s,x)=>s+(x._bad||0),0);if(bad)merged.badWeatherHours=bad/60;items.push(merged);
    }
    return {items,invalid,headers:h,conflicts};
  }

  function installImportUi(){
    const more=document.getElementById('viewMore');if(!more||document.getElementById('atworkImport'))return;
    const card=document.createElement('div');card.className='moreCard';card.id='atworkImport';
    card.innerHTML='<h3>Import</h3><div class="moreRow"><span>AtWork</span><b>CSV</b></div><p style="margin:0 0 12px;color:#667085;font-size:14px;line-height:1.4">Importiert Datum, Beginn, Ende, Pause, Notizen, Kunde/Projekt und Sondertage. Vor dem Import wird automatisch eine Sicherung deiner aktuellen Einträge erstellt.</p><input id="atworkFile" type="file" accept=".csv,text/csv,text/plain" hidden><button class="moreBtn" id="atworkImportBtn">AtWork-CSV importieren</button><div id="atworkImportStatus" style="margin-top:10px;font-size:13px;color:#667085"></div>';
    more.appendChild(card);
    const input=document.getElementById('atworkFile'),btn=document.getElementById('atworkImportBtn'),status=document.getElementById('atworkImportStatus');
    btn.onclick=()=>input.click();
    input.onchange=async()=>{
      const file=input.files&&input.files[0];if(!file)return;
      try{
        status.textContent='Datei wird geprüft …';
        const text=await file.text(),parsed=buildImport(parseCsv(text));
        const occupied=new Set(entries.map(e=>e.date));
        const fresh=parsed.items.filter(e=>!occupied.has(e.date));
        const skippedExisting=parsed.items.length-fresh.length;
        if(!parsed.items.length){status.textContent='Keine passenden AtWork-Einträge erkannt.';alert('Keine passenden Einträge erkannt. Exportiere AtWork bitte als CSV mit mindestens Datum sowie Beginn/Ende oder Dauer.');return}
        let msg=`Erkannt: ${parsed.items.length} Tag(e)\nNeu importierbar: ${fresh.length}`;
        if(skippedExisting)msg+=`\nBereits vorhanden: ${skippedExisting} (werden nicht überschrieben)`;
        if(parsed.invalid)msg+=`\nNicht erkannt/übersprungen: ${parsed.invalid}`;
        if(parsed.conflicts?.length)msg+=`\nMehrdeutige Tage: ${parsed.conflicts.length}`;
        msg+='\n\nJetzt importieren?';
        if(!confirm(msg)){status.textContent='Import abgebrochen.';return}
        const backupKey='arbeitszeit-app-import-backup-'+new Date().toISOString();
        localStorage.setItem(backupKey,JSON.stringify(entries));
        entries.push(...fresh);entries.sort((a,b)=>a.date.localeCompare(b.date));store();
        if(typeof renderAll==='function')renderAll();else{renderStart();renderWeek();if(typeof renderCalendar==='function')renderCalendar()}
        status.textContent=`${fresh.length} Tag(e) importiert. Backup wurde gespeichert.`;
        toast(`${fresh.length} AtWork-Einträge importiert`);
      }catch(err){console.error(err);status.textContent='Import fehlgeschlagen.';alert('Die CSV konnte nicht importiert werden. Bitte schick mir die AtWork-CSV, dann passe ich die Spaltenzuordnung an.')}
      finally{input.value=''}
    };
  }

  installImportUi();
  const v=document.querySelector('#appVersion b');
  if(v)v.textContent='1.4.0 Beta';
})();
