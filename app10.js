(function(){
  const VERSION='1.4.8 Beta';
  const VAC_KEY='arbeitszeit-app-vacation-settings-v1';

  function readVac(){
    try{return JSON.parse(localStorage.getItem(VAC_KEY)||'{}')||{}}catch{return {}}
  }
  function writeVac(v){localStorage.setItem(VAC_KEY,JSON.stringify(v))}
  function yearCfg(year){
    const all=readVac();
    const cfg=all[String(year)]||{};
    return {annual:Math.max(0,Number(cfg.annual)||0),carry:Math.max(0,Number(cfg.carry)||0)};
  }
  function saveYearCfg(year,annual,carry){
    const all=readVac();
    all[String(year)]={annual:Math.max(0,Number(annual)||0),carry:Math.max(0,Number(carry)||0)};
    writeVac(all);
  }
  function round2(n){return Math.round((Number(n)||0)*100)/100}
  function fmtDays(n){return round2(n).toFixed(2).replace('.',',')+' Tage'}

  function vacationDaysUsed(year){
    let used=0;
    for(const e of entries){
      if(e.type!=='vacation'||!e.date||Number(e.date.slice(0,4))!==Number(year))continue;
      const target=Math.max(0,targetFor(e.date));
      if(target<=0)continue;
      const minutes=e.vacationHourly?Math.max(0,Number(e.vacationMinutes)||Number(e.targetDayMinutes)||0):target;
      used+=Math.min(1,minutes/target);
    }
    return round2(used);
  }
  function vacationStats(year){
    const cfg=yearCfg(year),used=vacationDaysUsed(year);
    const carryUsed=Math.min(cfg.carry,used);
    const carryRemaining=Math.max(0,cfg.carry-carryUsed);
    const annualUsed=Math.max(0,used-carryUsed);
    const annualRemaining=Math.max(0,cfg.annual-annualUsed);
    return {cfg,used,carryRemaining,annualRemaining,totalRemaining:carryRemaining+annualRemaining};
  }

  function renderVacationStats(){
    const y=document.getElementById('vacYear');if(!y)return;
    const year=Number(y.value)||new Date().getFullYear(),s=vacationStats(year);
    const annual=document.getElementById('vacAnnual'),carry=document.getElementById('vacCarry');
    if(document.activeElement!==annual)annual.value=String(s.cfg.annual||'');
    if(document.activeElement!==carry)carry.value=String(s.cfg.carry||'');
    const used=document.getElementById('vacUsed'),old=document.getElementById('vacOldRemaining'),rest=document.getElementById('vacRemaining');
    if(used)used.textContent=fmtDays(s.used);
    if(old)old.textContent=fmtDays(s.carryRemaining);
    if(rest)rest.textContent=fmtDays(s.totalRemaining);
  }

  function installVacationCard(){
    const more=document.getElementById('viewMore');
    if(!more||document.getElementById('vacationAccountCard'))return;
    const card=document.createElement('div');card.className='moreCard';card.id='vacationAccountCard';
    card.innerHTML='<h3>Urlaubskonto</h3><div class="moreRow"><span>Jahr</span><input id="vacYear" type="number" min="2000" max="2100" step="1"></div><div class="moreRow"><span>Urlaub pro Jahr</span><input id="vacAnnual" type="number" min="0" max="365" step="0.5" inputmode="decimal" placeholder="z. B. 30"></div><div class="moreRow"><span>Urlaub vom Vorjahr</span><input id="vacCarry" type="number" min="0" max="365" step="0.5" inputmode="decimal" placeholder="z. B. 5"></div><button class="moreBtn" id="vacSave">Urlaubskonto speichern</button><div class="moreRow"><span>Genommen</span><b id="vacUsed">0,00 Tage</b></div><div class="moreRow"><span>Davon Rest Vorjahr</span><b id="vacOldRemaining">0,00 Tage</b></div><div class="moreRow"><span>Resturlaub gesamt</span><b id="vacRemaining">0,00 Tage</b></div><p style="margin:10px 0 0;color:#667085;font-size:13px;line-height:1.4">Urlaubstage werden automatisch aus deinen Urlaubseinträgen berechnet. Resturlaub vom Vorjahr wird dabei zuerst verbraucht.</p>';
    const version=document.getElementById('appVersion');
    if(version)more.insertBefore(card,version);else more.appendChild(card);
    const year=document.getElementById('vacYear');year.value=String(new Date().getFullYear());
    year.onchange=renderVacationStats;
    document.getElementById('vacSave').onclick=()=>{
      const yr=Number(year.value)||new Date().getFullYear();
      const annual=Number(String(document.getElementById('vacAnnual').value).replace(',','.'))||0;
      const carry=Number(String(document.getElementById('vacCarry').value).replace(',','.'))||0;
      saveYearCfg(yr,annual,carry);renderVacationStats();if(typeof toast==='function')toast('Urlaubskonto gespeichert');
    };
    renderVacationStats();
  }

  function installHourlyUi(){
    const fields=document.getElementById('nameFields');if(!fields||document.getElementById('vacationHourlyBox'))return;
    const box=document.createElement('div');box.id='vacationHourlyBox';box.innerHTML='<div class="sheetSectionTitle">Urlaubsumfang</div><div class="sheetGroup"><label class="sheetRow switchRow"><span>Stundenweise Urlaub</span><span class="switch"><input id="vacationHourlyToggle" type="checkbox"><span class="slider"></span></span></label><label class="sheetRow" id="vacationHoursRow" hidden><span>Urlaubsstunden</span><input id="vacationHours" type="number" min="0.25" max="24" step="0.25" inputmode="decimal"></label></div>';
    fields.appendChild(box);
    const toggle=document.getElementById('vacationHourlyToggle');
    const hours=document.getElementById('vacationHours');
    toggle.onchange=()=>{document.getElementById('vacationHoursRow').hidden=!toggle.checked;if(toggle.checked&&!hours.value){const d=document.getElementById('entryDate').value||key();hours.value=(targetFor(d)/60).toFixed(2)}};
  }

  function syncVacationUi(){
    const box=document.getElementById('vacationHourlyBox');if(!box)return;
    const isVac=editor&&editor.type==='vacation';box.style.display=isVac?'block':'none';
    if(!isVac)return;
    const date=document.getElementById('entryDate').value||key();
    let e=null;
    if(editor.mode==='edit'&&editor.originalDate)e=byDate(editor.originalDate);
    const toggle=document.getElementById('vacationHourlyToggle'),hours=document.getElementById('vacationHours');
    const hourly=!!(e&&e.type==='vacation'&&e.vacationHourly);
    toggle.checked=hourly;
    document.getElementById('vacationHoursRow').hidden=!hourly;
    if(hourly)hours.value=((Number(e.vacationMinutes)||Number(e.targetDayMinutes)||0)/60).toFixed(2);
    else if(!hours.value)hours.value=(targetFor(date)/60).toFixed(2);
  }

  function bindEditorEnhancement(){
    const oldOpen=window.openEditor;
    if(typeof oldOpen==='function')window.openEditor=function(){const r=oldOpen.apply(this,arguments);setTimeout(syncVacationUi,0);return r};
    document.querySelectorAll('#typeSeg button').forEach(b=>b.addEventListener('click',()=>setTimeout(syncVacationUi,0)));
    const date=document.getElementById('entryDate');if(date)date.addEventListener('change',()=>{const h=document.getElementById('vacationHours');if(h&&!document.getElementById('vacationHourlyToggle').checked)h.value=(targetFor(date.value||key())/60).toFixed(2)});

    const originalSave=window.saveEditor;
    const saveBtn=document.getElementById('entrySave');
    if(typeof originalSave==='function'&&saveBtn){
      const enhanced=function(){
        const isVac=editor&&editor.type==='vacation';
        const date=(document.getElementById('entryDate').value||'');
        const isNew=editor&&editor.mode==='new';
        const existedBefore=date?byDate(date):null;
        let hourly=false,vacMinutes=0;
        if(isVac){
          hourly=!!document.getElementById('vacationHourlyToggle')?.checked;
          if(hourly){
            const hrs=Number(String(document.getElementById('vacationHours')?.value||'').replace(',','.'))||0;
            vacMinutes=Math.round(hrs*60);
            if(vacMinutes<=0){if(typeof toast==='function')toast('Urlaubsstunden eingeben');return}
            const max=targetFor(date);
            if(max>0&&vacMinutes>max){if(typeof toast==='function')toast('Urlaubsstunden können die Tages-Sollzeit nicht überschreiten');return}
          }
        }
        const result=originalSave.apply(this,arguments);
        if(isVac&&date&&!(isNew&&existedBefore)){
          const e=byDate(date);
          if(e&&e.type==='vacation'){
            if(hourly){e.vacationHourly=true;e.vacationMinutes=vacMinutes;e.targetDayMinutes=vacMinutes}
            else{delete e.vacationHourly;delete e.vacationMinutes;e.targetDayMinutes=targetFor(date)}
            store();if(typeof renderAll==='function')renderAll();renderVacationStats();
          }
        }
        return result;
      };
      window.saveEditor=enhanced;saveBtn.onclick=enhanced;
    }
  }

  function patchVacationDeleteAndAbsence(){
    const del=document.getElementById('entryDelete');if(del)del.addEventListener('click',()=>setTimeout(renderVacationStats,0));
    const abs=document.getElementById('absenceSave');if(abs)abs.addEventListener('click',()=>setTimeout(renderVacationStats,0));
  }

  function install(){
    installVacationCard();installHourlyUi();bindEditorEnhancement();patchVacationDeleteAndAbsence();
    const v=document.querySelector('#appVersion b');if(v)v.textContent=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
