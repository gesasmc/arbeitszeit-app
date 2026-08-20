const K='arbeitszeit-app-v2', AKEY='arbeitszeit-app-active-v1', SKEY='arbeitszeit-app-settings-v1';
const $=id=>document.getElementById(id), pad=n=>String(n).padStart(2,'0');
const key=(d=new Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromKey=k=>{const[a,b,c]=k.split('-').map(Number);return new Date(a,b-1,c,12)};
const addDays=(d,n)=>{d=new Date(d);d.setDate(d.getDate()+n);return d};
const weekStart=d=>{d=new Date(d);d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
const mins=t=>t?Number(t.slice(0,2))*60+Number(t.slice(3)):0;
const timeStr=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const dec=m=>(Math.max(0,m)/60).toFixed(2).replace('.',',')+' h';
const signedDec=m=>(m>0?'+':m<0?'−':'')+dec(Math.abs(m));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=k=>new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long'}).format(fromKey(k));
const fmtShort=k=>new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'}).format(fromKey(k));
const roundUp5=d=>{d=new Date(d);d.setSeconds(0,0);const r=d.getMinutes()%5;if(r)d.setMinutes(d.getMinutes()+(5-r));return d};
const completionTs=e=>{if(e.completedAt)return Number(e.completedAt);if(e.date&&e.end){const d=fromKey(e.date);d.setHours(Number(e.end.slice(0,2)),Number(e.end.slice(3)),0,0);return d.getTime()}return 0};
let entries=[], active=null, settings={targetWeek:2400,targetHistory:[],lastWage:0}, W=weekStart(new Date), M=new Date(new Date().getFullYear(),new Date().getMonth(),1,12), editor={mode:'new',originalDate:null,type:'work',start:'',end:'',pause:0,name:'',note:'',badWeather:0,wage:0}, picker={target:null,hour:0,minute:0,after:null};
try{entries=JSON.parse(localStorage.getItem(K)||'[]').map(e=>({...e,type:e.type||'work'}))}catch{}
try{active=JSON.parse(localStorage.getItem(AKEY)||'null')}catch{}
try{settings={...settings,...JSON.parse(localStorage.getItem(SKEY)||'{}')}}catch{}
if(!Array.isArray(settings.targetHistory))settings.targetHistory=[];if(!settings.targetHistory.length&&settings.targetWeek!=null)settings.targetHistory=[{from:'1900-01-01',minutes:Number(settings.targetWeek)||2400}];settings.targetHistory=settings.targetHistory.filter(r=>r&&r.from&&Number.isFinite(Number(r.minutes))).map(r=>({from:r.from,minutes:Number(r.minutes)})).sort((a,b)=>a.from.localeCompare(b.from));
const store=()=>localStorage.setItem(K,JSON.stringify(entries));
const storeActive=()=>active?localStorage.setItem(AKEY,JSON.stringify(active)):localStorage.removeItem(AKEY);
const byDate=k=>entries.find(e=>e.date===k);
const targetWeekFor=k=>{let mins=Number(settings.targetWeek)||2400;for(const r of settings.targetHistory){if(r.from<=k)mins=Number(r.minutes)||0;else break}return mins};
const targetFor=k=>{const d=fromKey(k).getDay();return d>0&&d<6?Math.round(targetWeekFor(k)/5):0};
const weekTargetFor=start=>{let total=0;for(let i=0;i<7;i++)total+=targetFor(key(addDays(start,i)));return total};
const workMins=e=>e?.type==='work'&&e.start&&e.end?Math.max(0,mins(e.end)-mins(e.start)-(Number(e.breakMinutes)||0)):0;
const credit=e=>e?(e.type==='work'?workMins(e):(Number.isFinite(Number(e.targetDayMinutes))?Number(e.targetDayMinutes):targetFor(e.date))):0;
const badWeatherMins=e=>{if(e?.badWeatherStart&&e?.badWeatherEnd&&mins(e.badWeatherEnd)>mins(e.badWeatherStart))return mins(e.badWeatherEnd)-mins(e.badWeatherStart);return Math.max(0,Math.round(Number(e?.badWeatherHours||0)*60))};
const earnings=e=>e?.type==='work'?(workMins(e)/60)*(Number(e.wage)||0):0;
const euro=n=>(Number(n)||0).toFixed(2).replace('.',',')+' €';
const lastWageBefore=k=>{const arr=entries.filter(e=>e.type==='work'&&e.date<=k&&Number(e.wage)>=0).sort((a,b)=>b.date.localeCompare(a.date));return arr.length?Number(arr[0].wage)||0:Number(settings.lastWage)||0};
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').hidden=true,1800)}
function typeName(t){return t==='work'?'Arbeit':t==='vacation'?'Urlaub':t==='holiday'?'Feiertag':'Krankheit'}
function typeClass(t){return t==='work'?'work':t==='vacation'?'vacation':t==='holiday'?'holiday':'sickness'}
function typeIcon(t){return t==='work'?'▣':t==='vacation'?'☂':t==='holiday'?'▤':'⚕'}
function initPause(){let h='';for(let m=0;m<=240;m+=5)h+=`<option value="${m}">${dec(m)}</option>`;$('pauseSelect').innerHTML=h}
function activeElapsed(){if(!active?.date||!active?.start)return 0;const d=fromKey(active.date);d.setHours(Number(active.start.slice(0,2)),Number(active.start.slice(3)),0,0);return Math.max(0,Date.now()-d.getTime())}
function clock(ms){const s=Math.floor(ms/1000);return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`}
function recentRemaining(e){const ts=completionTs(e);return Math.max(0,3*3600000-(Date.now()-ts))}
function renderStart(){
 $('todayLabel').textContent=fmtDate(key());
 const area=$('activeArea');
 if(active){
   area.innerHTML=`<div class="runningCard"><div class="statusPill"></div><div class="runningMain"><small>● LÄUFT SEIT ${esc(active.start)}</small><div id="runningTimer" class="runningTimer">${clock(activeElapsed())}</div><div class="sub">Arbeitszeit läuft …</div><div class="runningType">▣ Arbeit · Pause ${dec(active.breakMinutes||0)}${badWeatherMins(active)?` · Schlechtwetter ${dec(badWeatherMins(active))}`:''}${Number(active.wage)>=0?` · ${euro(active.wage)}/h`:''}</div></div><div class="runningActions"><button class="endBtn" id="endActiveBtn">Beenden</button><button class="miniBtn" id="editActiveBtn">Bearbeiten</button><small>Endzeit wird vor dem Speichern gewählt.</small></div></div><div class="info"><div class="infoIcon">ⓘ</div><div>Nach dem Beenden bleibt der Eintrag noch <b>3 Stunden</b> hier sichtbar, damit du ihn schnell nachbearbeiten kannst.</div></div>`;
   $('startButtonArea').style.display='none';
   $('endActiveBtn').onclick=()=>openPicker('active-end',null,roundUp5(new Date()));
   $('editActiveBtn').onclick=()=>openEditor('active',active.date);
 }else{area.innerHTML='';$('startButtonArea').style.display='block'}
 const recent=entries.filter(e=>{if(e.date!==key())return false;if(e.type!=='work')return true;const ts=completionTs(e);return ts&&Date.now()-ts<3*3600000}).sort((a,b)=>(completionTs(b)||0)-(completionTs(a)||0));
 if(!recent.length){$('recentArea').innerHTML='';return}
 let h='<div class="dateTitle" style="padding-top:10px">Aktuelle Einträge</div><div class="recentList">';
 for(const e of recent){const t=e.type, main=t==='work'?`${esc(e.start)} – ${esc(e.end)}`:(e.name||typeName(t));const sub=t==='work'?`▣ Arbeit${e.note?' · '+esc(e.note):''}`:`${typeIcon(t)} ${typeName(t)}${e.name?' – '+esc(e.name):''}`;const aside=t==='work'?`${dec(workMins(e))}${Number(e.wage)>0?` · ${euro(earnings(e))}`:''}`:dec(credit(e));const rem=t==='work'?recentRemaining(e):0;h+=`<div class="entryCard" data-edit="${esc(e.date)}"><div class="colorBar ${typeClass(t)}"></div><div class="entryMain"><strong>${main}</strong><span>${sub}</span></div><div class="entryAside"><b>${aside}</b>${rem?`<small>Noch ${clock(rem).slice(0,5)}</small>`:''}</div></div>`}h+='</div>';$('recentArea').innerHTML=h;document.querySelectorAll('[data-edit]').forEach(el=>el.onclick=()=>openEditor('edit',el.dataset.edit))
}
function renderWeek(){let total=0,bad=0,earn=0,h='';for(let i=0;i<7;i++){const k=key(addDays(W,i)),e=byDate(k);if(e){const c=credit(e);total+=c;bad+=badWeatherMins(e);earn+=earnings(e);const label=e.type==='work'?`${esc(e.start)}–${esc(e.end)}`:`<span class="tag ${typeClass(e.type)}">${typeName(e.type)}</span>`;const extras=e.type==='work'?`<p>${badWeatherMins(e)?`Schlechtwetter: <b>${esc(e.badWeatherStart||'–')}–${esc(e.badWeatherEnd||'–')}</b> (${dec(badWeatherMins(e))})<br>`:''}${Number(e.wage)>0?`Stundenlohn: <b>${euro(e.wage)}</b> · Verdienst: <b>${euro(earnings(e))}</b><br>`:''}${esc(e.note||'–')}</p>`:`<p>${esc(e.note||'–')}</p>`;h+=`<div class="weekItem"><div class="weekRow"><span class="day">${esc(fmtShort(k))}</span><span>${label}</span><span class="right">${dec(c)}</span><span>⌄</span></div><div class="weekDetail">${e.name?`<b>${esc(e.name)}</b>`:''}${extras}<button class="editLink" data-week-edit="${k}">Bearbeiten</button></div></div>`}else h+=`<div class="weekItem"><div class="weekRow"><span class="day">${esc(fmtShort(k))}</span><span class="muted">Kein Eintrag</span><span></span><span></span></div></div>`}$('weekRows').innerHTML=h;const wt=weekTargetFor(W);$('weekTotal').textContent=dec(total);$('weekTarget').textContent=dec(wt);const delta=total-wt;$('weekDelta').textContent=signedDec(delta);$('weekDelta').style.color=delta<0?'#c62828':delta>0?'#16823a':'#111';$('weekBadWeather').textContent=dec(bad);$('weekEarnings').textContent=euro(earn);$('weekLabel').textContent='KW '+getWeekNumber(W);document.querySelectorAll('.weekRow').forEach(r=>r.onclick=()=>r.parentElement.classList.toggle('open'));document.querySelectorAll('[data-week-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();openEditor('edit',b.dataset.weekEdit)})}
function getWeekNumber(d){const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()+4-(x.getUTCDay()||7));const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil((((x-y)/86400000)+1)/7)}