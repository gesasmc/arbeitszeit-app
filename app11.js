(function(){
  const VERSION='1.5.4 Beta';
  const DELETE_BACKUP_KEY='arbeitszeit-app-vacation-delete-backup-v1';
  const el=id=>document.getElementById(id);
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&key(fromKey(value))===value;
  const weekend=date=>[0,6].includes(fromKey(date).getDay());
  const fmt=date=>new Intl.DateTimeFormat('de-DE').format(fromKey(date));
  const daysLabel=count=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(count)+(count===1?' Urlaubstag':' Urlaubstage');

  function groupList(){
    const groups=new Map();
    for(const entry of entries){
      if(entry.type!=='vacation'||!entry.vacationGroupId)continue;
      const id=entry.vacationGroupId;
      if(!groups.has(id))groups.set(id,{id,name:entry.vacationGroupName||entry.name||'Urlaub',from:entry.vacationGroupFrom||entry.date,to:entry.vacationGroupTo||entry.date,items:[],days:0});
      const group=groups.get(id);group.items.push(entry);
      const target=Math.max(0,targetFor(entry.date));
      if(target>0&&!weekend(entry.date))group.days+=entry.vacationHourly?Math.min(1,Math.max(0,Number(entry.vacationMinutes)||Number(entry.targetDayMinutes)||0)/target):1;
    }
    return [...groups.values()].sort((a,b)=>b.from.localeCompare(a.from));
  }

  function deletedGroup(){
    try{
      const saved=JSON.parse(localStorage.getItem(DELETE_BACKUP_KEY)||'null');
      return saved&&Array.isArray(saved.entries)&&saved.entries.length?saved:null;
    }catch{return null}
  }

  function persist(next){
    // Keep the in-memory data intact if the browser cannot save the new state.
    localStorage.setItem(K,JSON.stringify(next));
    entries=next;
  }

  function deleteGroup(id){
    const group=groupList().find(item=>item.id===id);if(!group)return;
    const message='„'+group.name+'“ ('+fmt(group.from)+' – '+fmt(group.to)+') mit '+daysLabel(group.days)+' komplett löschen?';
    if(!confirm(message))return;
    try{
      // Save exactly the removed days before the bulk operation, for undo.
      localStorage.setItem(DELETE_BACKUP_KEY,JSON.stringify({createdAt:new Date().toISOString(),name:group.name,entries:group.items}));
      persist(entries.filter(entry=>!(entry.type==='vacation'&&entry.vacationGroupId===id)));
    }catch(error){console.error(error);toast('Löschen nicht möglich: Sicherung oder Speichern fehlgeschlagen');return}
    el('entrySheet').hidden=true;
    renderAll();toast('Urlaubszeitraum gelöscht – im Kalender wiederherstellbar');
  }

  function restoreDeletedGroup(){
    const saved=deletedGroup();if(!saved)return;
    const occupied=new Set(entries.map(entry=>entry.date));if(active?.date)occupied.add(active.date);
    const fresh=[],remaining=[];
    for(const entry of saved.entries){
      if(entry.type!=='vacation'||!validDate(entry.date)||weekend(entry.date))continue;
      if(occupied.has(entry.date)){remaining.push(entry);continue}
      fresh.push(entry);occupied.add(entry.date);
    }
    if(!fresh.length)return toast('Die Tage sind bereits belegt. Vorhandene Einträge bleiben erhalten.');
    try{persist([...entries,...fresh].sort((a,b)=>a.date.localeCompare(b.date)))}
    catch(error){console.error(error);toast('Wiederherstellen fehlgeschlagen');return}
    try{
      if(remaining.length)localStorage.setItem(DELETE_BACKUP_KEY,JSON.stringify({...saved,entries:remaining}));
      else localStorage.removeItem(DELETE_BACKUP_KEY);
    }catch(error){console.warn(error)}
    renderAll();toast(fresh.length+' Urlaubseinträge wiederhergestellt'+(remaining.length?' · '+remaining.length+' belegte Tage übersprungen':''));
  }

  function renderGroups(){
    const year=el('vacYear');if(typeof year?.onchange==='function')year.onchange();
    const list=el('vacationGroupList');if(!list)return;
    const groups=groupList();
    list.innerHTML='<h3>Urlaubszeiträume</h3>'+(groups.length?groups.map(group=>'<div class="vacationPeriod"><strong>'+esc(group.name)+'</strong><p>'+esc(fmt(group.from)+' – '+fmt(group.to)+' · '+daysLabel(group.days))+'</p><button type="button" class="moreBtn vacationPeriodDelete" data-vacation-group="'+esc(group.id)+'">Gesamten Urlaub löschen</button></div>').join(''):'<p class="vacationHint">Neu eingetragene Urlaube erscheinen hier als zusammengehörige Zeiträume.</p>');
    list.querySelectorAll('[data-vacation-group]').forEach(button=>button.onclick=()=>deleteGroup(button.dataset.vacationGroup));
    if(deletedGroup()){
      const undo=document.createElement('button');undo.type='button';undo.className='moreBtn';undo.id='restoreVacationGroup';undo.textContent='Letzten gelöschten Urlaub wiederherstellen';undo.onclick=restoreDeletedGroup;list.appendChild(undo);
    }
    syncGroupDelete();
  }

  function syncGroupDelete(){
    const box=el('vacationGroupEditor');if(!box)return;
    const entry=editor.mode==='edit'&&editor.type==='vacation'?byDate(editor.originalDate):null;
    const group=entry?.vacationGroupId?groupList().find(item=>item.id===entry.vacationGroupId):null;
    box.hidden=!group;
    if(group){
      el('vacationGroupInfo').textContent='Gehört zu „'+group.name+'“ · '+fmt(group.from)+' – '+fmt(group.to)+' · '+daysLabel(group.days);
      el('vacationGroupDelete').onclick=()=>deleteGroup(group.id);
    }
  }

  function makeRangeEntries(type,from,to,name,note){
    const out=[],occupied=new Set(entries.map(entry=>entry.date));if(active?.date)occupied.add(active.date);
    const id=type==='vacation'?(window.crypto?.randomUUID?.()||'vacation-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)):null;
    for(let date=fromKey(from),end=fromKey(to);date<=end;date=addDays(date,1)){
      const dateKey=key(date);
      if((type==='vacation'&&weekend(dateKey))||occupied.has(dateKey))continue;
      const entry={date:dateKey,type,start:'',end:'',breakMinutes:0,name,note,targetDayMinutes:targetFor(dateKey)};
      if(id)Object.assign(entry,{vacationGroupId:id,vacationGroupName:name||'Urlaub',vacationGroupFrom:from,vacationGroupTo:to});
      out.push(entry);
    }
    return out;
  }

  function saveRange(type,from,to,name,note){
    if(!validDate(from)||!validDate(to)){toast('Gültiges Von- und Bis-Datum wählen');return}
    if(to<from){toast('Bis-Datum muss nach dem Von-Datum liegen');return}
    const items=makeRangeEntries(type,from,to,name,note);
    if(!items.length){toast(type==='vacation'?'Keine freien Urlaubstage: Wochenenden und belegte Tage werden übersprungen':'Keine freien Tage im Zeitraum');return}
    try{persist([...entries,...items].sort((a,b)=>a.date.localeCompare(b.date)))}
    catch(error){console.error(error);toast('Speichern fehlgeschlagen');return}
    el('entrySheet').hidden=true;
    W=weekStart(fromKey(from));M=new Date(fromKey(from).getFullYear(),fromKey(from).getMonth(),1,12);
    renderAll();toast(type==='vacation'?daysLabel(items.length)+' als Zeitraum gespeichert':items.length+' Einträge gespeichert');
  }

  function rangeHint(type,from,to){
    if(type!=='vacation')return '';
    if(!validDate(from)||!validDate(to)||to<from)return 'Samstag und Sonntag werden übersprungen.';
    let count=0;
    for(let date=fromKey(from),end=fromKey(to);date<=end;date=addDays(date,1)){
      const dateKey=key(date);if(!weekend(dateKey)&&!byDate(dateKey)&&active?.date!==dateKey)count++;
    }
    return daysLabel(count)+' · Wochenenden und bereits belegte Tage werden übersprungen.';
  }

  function syncCalendarHint(){
    const hint=el('absenceVacationHint');if(!hint)return;
    hint.hidden=el('absenceType').value!=='vacation';
    hint.textContent=rangeHint(el('absenceType').value,el('absenceFrom').value,el('absenceTo').value);
  }

  function ensureRangeUi(){
    const dateRow=el('entryDate')?.closest('.sheetGroup');
    if(dateRow&&!el('entryToDate')){
      const label=document.createElement('label');label.className='sheetRow';label.id='entryToDateRow';label.hidden=true;
      label.innerHTML='<span>Bis</span><input id="entryToDate" type="date">';dateRow.appendChild(label);
      const hint=document.createElement('p');hint.id='entryVacationHint';hint.className='vacationHint vacationEditorHint';hint.hidden=true;dateRow.after(hint);
    }
    if(!el('vacationGroupEditor')){
      const box=document.createElement('div');box.id='vacationGroupEditor';box.hidden=true;
      box.innerHTML='<p id="vacationGroupInfo" class="vacationHint vacationEditorHint"></p><button type="button" id="vacationGroupDelete" class="deleteBtn">Gesamten Urlaub löschen</button>';
      el('entryDelete')?.after(box);
    }
    const panel=document.querySelector('#viewCalendar .calendarPanel');
    if(panel&&!el('vacationGroupList')){const list=document.createElement('div');list.id='vacationGroupList';list.className='absenceBox';panel.appendChild(list)}
    const absence=el('absenceSave');
    if(absence&&!el('absenceVacationHint')){const hint=document.createElement('p');hint.id='absenceVacationHint';hint.className='vacationHint';absence.closest('.formGrid').after(hint)}
  }

  function syncRangeUi(){
    const row=el('entryToDateRow'),to=el('entryToDate'),from=el('entryDate');if(!row||!to||!from)return;
    const rangeType=editor.mode==='new'&&(editor.type==='vacation'||editor.type==='sickness');
    row.hidden=!rangeType;
    from.closest('label').querySelector('span').textContent=rangeType?'Von':'Datum';
    if(rangeType){if(!to.value)to.value=from.value}else to.value='';
    const hint=el('entryVacationHint');
    hint.hidden=!(rangeType&&editor.type==='vacation');
    hint.textContent=rangeHint(editor.type,from.value,to.value);
    el('entryName').placeholder=editor.type==='vacation'?'z. B. Sommer 2027':'Bezeichnung';
    syncGroupDelete();
  }

  const oldOpen=window.openEditor;
  if(typeof oldOpen==='function')window.openEditor=function(){
    const result=oldOpen.apply(this,arguments);
    setTimeout(()=>{
      // A new entry must never inherit the previous vacation's end date.
      if(editor.mode==='new'&&el('entryToDate'))el('entryToDate').value=el('entryDate').value;
      syncRangeUi();
    },0);
    return result;
  };

  function installSavePatch(){
    const previous=window.saveEditor,button=el('entrySave');if(typeof previous!=='function'||!button)return;
    const enhanced=function(){
      if(!(editor.mode==='new'&&(editor.type==='vacation'||editor.type==='sickness')))return previous.apply(this,arguments);
      const from=el('entryDate').value,to=el('entryToDate')?.value||from;
      if(editor.type==='vacation'&&el('vacationHourlyToggle')?.checked){
        if(to!==from)return toast('Stundenweiser Urlaub ist nur für einen einzelnen Tag möglich');
        return previous.apply(this,arguments);
      }
      return saveRange(editor.type,from,to,el('entryName').value.trim(),el('entryNote').value.trim());
    };
    window.saveEditor=enhanced;button.onclick=enhanced;
    const previousAbsence=window.saveAbsence;
    window.saveAbsence=function(){
      if(el('absenceType').value!=='vacation')return previousAbsence.apply(this,arguments);
      return saveRange('vacation',el('absenceFrom').value,el('absenceTo').value,el('absenceName').value.trim(),'');
    };
    el('absenceSave').onclick=window.saveAbsence;
  }

  function install(){
    ensureRangeUi();installSavePatch();
    const previousRender=window.renderAll;
    window.renderAll=function(){const result=previousRender.apply(this,arguments);renderGroups();syncCalendarHint();syncRangeUi();return result};
    document.querySelectorAll('#typeSeg button').forEach(button=>button.addEventListener('click',()=>setTimeout(syncRangeUi,0)));
    ['entryDate','entryToDate'].forEach(id=>el(id)?.addEventListener('change',syncRangeUi));
    ['absenceType','absenceFrom','absenceTo'].forEach(id=>el(id)?.addEventListener('change',syncCalendarHint));
    renderGroups();syncCalendarHint();syncRangeUi();
    const version=document.querySelector('#appVersion b');if(version)version.textContent=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
