(function(){
  const VERSION='1.5.5 Beta';
  const NET_MINUTES=495; // 8.25 hours, after the pause has already been accounted for.
  const BACKUP_KEY='arbeitszeit-app-full-day-weather-backup-v1';
  const el=id=>document.getElementById(id);
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&key(fromKey(value))===value;

  function automaticPause(){
    const current=Number(editor.pause);
    if(Number.isFinite(current)&&current>0)return Math.round(current);
    const date=el('entryDate').value||key();
    const previous=entries.filter(entry=>entry.type==='work'&&!isFullDayBadWeather(entry)&&entry.date<=date&&Number.isFinite(Number(entry.breakMinutes))).sort((a,b)=>b.date.localeCompare(a.date))[0];
    return previous?Math.max(0,Math.round(Number(previous.breakMinutes))):30;
  }

  function fullDaySelected(){
    return editor.type==='work'&&!!editor.badWeatherFullDay&&el('badWeatherToggle').checked;
  }

  function updateUi(){
    const full=fullDaySelected(),weather=editor.type==='work'&&el('badWeatherToggle').checked;
    const row=el('badWeatherFullDayRow'),toggle=el('badWeatherFullDayToggle'),info=el('badWeatherFullDayInfo');
    if(!row||!toggle||!info)return;
    row.hidden=!weather;toggle.checked=full;info.hidden=!full;
    for(const id of ['startTimeBtn','endTimeBtn','pauseSelect'])el(id)?.closest('.sheetRow')?.classList.toggle('fullDayWeatherHidden',full);
    el('badWeatherTimeRows').classList.toggle('hidden',!weather||full);
    if(full){
      info.textContent='8,25 h netto · Pause '+Math.max(0,Number(editor.pause)||0)+' Min. bereits berücksichtigt. Beim Sichern wird der Tag direkt abgeschlossen.';
      el('sumWork').textContent=dec(0);el('sumPause').textContent=dec(editor.pause);
      el('sumBadWeather').textContent=dec(NET_MINUTES);el('sumCredit').textContent=dec(NET_MINUTES);el('sumEarnings').textContent=euro(0);
    }
  }

  function setFullDay(value){
    if(value){editor._weatherPreviousPause=editor.pause;editor.pause=automaticPause()}
    else if(Number.isFinite(Number(editor._weatherPreviousPause))){editor.pause=Number(editor._weatherPreviousPause);delete editor._weatherPreviousPause}
    editor.badWeatherFullDay=!!value;el('pauseSelect').value=String(editor.pause);syncEditor();
  }

  function saveFullDay(){
    const date=el('entryDate').value,mode=editor.mode,originalDate=editor.originalDate;
    if(!validDate(date))return toast('Gültiges Datum wählen');
    const old=mode==='edit'?byDate(originalDate):mode==='active'?active:null;
    if((mode==='edit'||mode==='active')&&!old)return toast('Der ursprüngliche Eintrag ist nicht mehr vorhanden');
    const occupied=byDate(date);
    if(occupied&&!(mode==='edit'&&occupied===old))return toast('Für diesen Tag gibt es bereits einen Eintrag');
    if(active?.date===date&&mode!=='active')return toast('Für diesen Tag läuft ein Eintrag. Bitte diesen bearbeiten.');
    if(mode==='active'&&active.date!==originalDate)return toast('Der laufende Eintrag hat sich geändert. Bitte erneut öffnen.');
    if(old&&!isFullDayBadWeather(old)&&!confirm('Diesen Eintrag vollständig durch einen abgeschlossenen Schlechtwettertag mit 8,25 h netto ersetzen?'))return;
    const pause=Math.max(0,Math.round(Number(editor.pause)||0));
    const item={date,type:'work',start:'',end:'',breakMinutes:pause,note:el('entryNote').value.trim(),workplace:el('entryWorkplace').value.trim(),workDescription:'',badWeatherStart:'',badWeatherEnd:'',badWeatherHours:0,badWeatherFullDay:true,badWeatherNetMinutes:NET_MINUTES,badWeatherGrossMinutes:NET_MINUTES+pause,wage:Math.max(0,Number(editor.wage)||0),targetDayMinutes:targetFor(date),completedAt:old?.completedAt||Date.now()};
    const next=entries.filter(entry=>!(mode==='edit'&&entry===old));next.push(item);next.sort((a,b)=>a.date.localeCompare(b.date));
    const closeActive=mode==='active';
    let beforeRaw=null,entriesWritten=false,backupWritten=false;
    try{
      beforeRaw=localStorage.getItem(K);
      localStorage.setItem(BACKUP_KEY,JSON.stringify({version:VERSION,createdAt:new Date().toISOString(),entries,active,originalDate}));backupWritten=true;
      localStorage.setItem(K,JSON.stringify(next));entriesWritten=true;
      if(closeActive)localStorage.removeItem(AKEY);
    }catch(error){
      if(entriesWritten){
        try{if(beforeRaw===null)localStorage.removeItem(K);else localStorage.setItem(K,beforeRaw)}
        catch(restoreError){console.error('Sicherung zur Wiederherstellung vorhanden',restoreError)}
      }
      console.error(error);toast(backupWritten?'Speichern fehlgeschlagen. Eine Sicherung des vorherigen Stands ist vorhanden.':'Speichern abgebrochen: Die Sicherung konnte nicht angelegt werden.');return;
    }
    entries=next;if(closeActive)active=null;
    W=weekStart(fromKey(date));M=new Date(fromKey(date).getFullYear(),fromKey(date).getMonth(),1,12);
    el('entrySheet').hidden=true;renderAll();toast('Schlechtwettertag abgeschlossen · 8,25 h netto');
  }

  function install(){
    const weatherRow=el('badWeatherToggle')?.closest('.sheetRow');if(!weatherRow)return;
    if(!el('badWeatherFullDayRow')){
      const row=document.createElement('label');row.id='badWeatherFullDayRow';row.className='sheetRow switchRow';row.hidden=true;
      row.innerHTML='<span>Ganzer Tag</span><span class="switch"><input id="badWeatherFullDayToggle" type="checkbox"><span class="slider"></span></span>';weatherRow.after(row);
      const info=document.createElement('p');info.id='badWeatherFullDayInfo';info.className='weatherDayInfo';info.hidden=true;weatherRow.closest('.sheetGroup').after(info);
    }
    const previousOpen=window.openEditor;
    window.openEditor=function(mode,date){
      const source=mode==='active'?active:mode==='edit'?byDate(date):null;
      editor.badWeatherFullDay=isFullDayBadWeather(source);delete editor._weatherPreviousPause;
      const result=previousOpen.apply(this,arguments);updateUi();return result;
    };
    const previousSync=window.syncEditor;
    window.syncEditor=function(){const result=previousSync.apply(this,arguments);updateUi();return result};
    const previousSave=window.saveEditor;
    window.saveEditor=function(){if(fullDaySelected())return saveFullDay();return previousSave.apply(this,arguments)};
    el('entrySave').onclick=window.saveEditor;
    el('badWeatherFullDayToggle').onchange=()=>setFullDay(el('badWeatherFullDayToggle').checked);
    el('badWeatherToggle').addEventListener('change',()=>{if(!el('badWeatherToggle').checked)setFullDay(false);else updateUi()});
    updateUi();const version=document.querySelector('#appVersion b');if(version)version.textContent=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
