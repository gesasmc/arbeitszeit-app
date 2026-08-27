(function(){
  const VERSION='1.5.0 Beta';

  function ensureRangeUi(){
    const dateRow=document.getElementById('entryDate')?.closest('.sheetGroup');
    if(!dateRow||document.getElementById('entryToDate'))return;
    const label=document.createElement('label');label.className='sheetRow';label.id='entryToDateRow';label.hidden=true;
    label.innerHTML='<span>Bis</span><input id="entryToDate" type="date">';
    dateRow.appendChild(label);
  }

  function syncRangeUi(){
    const row=document.getElementById('entryToDateRow'),to=document.getElementById('entryToDate'),from=document.getElementById('entryDate');
    if(!row||!to||!from)return;
    const rangeType=editor&&editor.mode==='new'&&(editor.type==='vacation'||editor.type==='sickness');
    row.hidden=!rangeType;
    if(rangeType){if(!to.value||to.value<from.value)to.value=from.value}else to.value='';
  }

  const oldOpen=window.openEditor;
  if(typeof oldOpen==='function')window.openEditor=function(){const r=oldOpen.apply(this,arguments);setTimeout(syncRangeUi,0);return r};

  function makeRangeEntries(type,from,to,name,note){
    const out=[];let d=fromKey(from),end=fromKey(to);
    while(d<=end){
      const k=key(d),dow=d.getDay();
      if(!(type==='vacation'&&(dow===0||dow===6))){
        if(!byDate(k))out.push({date:k,type,start:'',end:'',breakMinutes:0,name,note,targetDayMinutes:targetFor(k)});
      }
      d=addDays(d,1);
    }
    return out;
  }

  function installSavePatch(){
    const previous=window.saveEditor,btn=document.getElementById('entrySave');
    if(typeof previous!=='function'||!btn)return;
    const enhanced=function(){
      if(!(editor&&editor.mode==='new'&&(editor.type==='vacation'||editor.type==='sickness')))return previous.apply(this,arguments);
      const from=document.getElementById('entryDate').value;
      const to=document.getElementById('entryToDate')?.value||from;
      if(!from)return toast('Datum wählen');
      if(to<from)return toast('Bis-Datum muss nach dem Von-Datum liegen');
      const name=document.getElementById('entryName').value.trim(),note=document.getElementById('entryNote').value.trim();
      if(editor.type==='vacation'&&document.getElementById('vacationHourlyToggle')?.checked&&to!==from)return toast('Stundenweiser Urlaub ist nur für einen einzelnen Tag möglich');
      if(editor.type==='vacation'&&document.getElementById('vacationHourlyToggle')?.checked)return previous.apply(this,arguments);
      const items=makeRangeEntries(editor.type,from,to,name,note);
      if(!items.length)return toast('Keine freien Arbeitstage im Zeitraum');
      entries.push(...items);entries.sort((a,b)=>a.date.localeCompare(b.date));store();
      document.getElementById('entrySheet').hidden=true;
      W=weekStart(fromKey(from));M=new Date(fromKey(from).getFullYear(),fromKey(from).getMonth(),1,12);
      if(typeof renderAll==='function')renderAll();
      if(typeof toast==='function')toast(items.length+' Einträge gespeichert');
      return;
    };
    window.saveEditor=enhanced;btn.onclick=enhanced;
  }

  function install(){
    ensureRangeUi();
    document.querySelectorAll('#typeSeg button').forEach(b=>b.addEventListener('click',()=>setTimeout(syncRangeUi,0)));
    document.getElementById('entryDate')?.addEventListener('change',syncRangeUi);
    installSavePatch();syncRangeUi();
    const v=document.querySelector('#appVersion b');if(v)v.textContent=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
