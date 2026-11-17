const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const K='arbeitszeit-app-v2',AK='arbeitszeit-app-active-v1',BK='arbeitszeit-app-full-day-weather-backup-v1';
function harness(seed=[],running=null){
  const storage=new Map([[K,JSON.stringify(seed)],...(running?[[AK,JSON.stringify(running)]]:[])]),nodes=new Map(),messages=[];
  let answer=true,failSet=null,failRemove=null;
  function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{id,value:'',checked:false,hidden:false,textContent:'',innerHTML:'',style:{},classes,onclick:null,onchange:null,
    classList:{toggle(name,on){if(on===undefined)on=!classes.has(name);on?classes.add(name):classes.delete(name)}},
    closest(){return this},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},scrollIntoView(){}})}return nodes.get(id)}
  const ctx={console:{error(){},warn(){}},Date,Intl,Math,URL,Blob,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},location:{href:'https://example.test/'},
    document:{readyState:'loading',addEventListener(){},getElementById:node,querySelectorAll(){return []},querySelector(){return null}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){if(key===failSet)throw Error('quota');storage.set(key,value)},removeItem(key){if(key===failRemove)throw Error('denied');storage.delete(key)}},
    confirm(){return answer},downloadCsv(){},
  };ctx.window=ctx;vm.createContext(ctx);
  for(const file of ['app1.js','app2.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  // Load the actual CSV functions without the unrelated page boot bindings.
  vm.runInContext(fs.readFileSync(path.join(root,'app3.js'),'utf8').split('initPause();')[0],ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'app4.js'),'utf8'),ctx);
  const code=fs.readFileSync(path.join(root,'app14.js'),'utf8').replace('function install(){','window.testWeather={automaticPause,fullDaySelected,updateUi,setFullDay,saveFullDay,install};function install(){');
  vm.runInContext(code,ctx);ctx.toast=message=>messages.push(message);ctx.testWeather.install();
  const value=expression=>JSON.parse(vm.runInContext('JSON.stringify('+expression+')',ctx));
  function prepare(date='2027-07-12',mode='new',originalDate=date){ctx.openEditor(mode,originalDate);node('entryDate').value=date;node('badWeatherToggle').checked=true;ctx.testWeather.setFullDay(true)}
  return {ctx,node,storage,messages,value,prepare,save:()=>node('entrySave').onclick(),answer:value=>answer=value,failSet:key=>failSet=key,failRemove:key=>failRemove=key};
}
let h=harness();h.prepare();assert.equal(h.value('editor.pause'),30);h.save();
let data=h.value('entries');assert.equal(data.length,1);let day=data[0];assert.equal(day.start,'');assert.equal(day.end,'');assert.equal(day.badWeatherFullDay,true);assert.equal(day.breakMinutes,30);assert.equal(day.badWeatherGrossMinutes-day.breakMinutes,495);assert(day.completedAt>0);assert.equal(h.value('active'),null);
assert.equal(h.value('credit(entries[0])'),495);assert.equal(h.value('badWeatherMins(entries[0])'),495);assert.equal(h.value('workMins(entries[0])'),0);assert.equal(h.value('earnings(entries[0])'),0);
assert.equal(h.node('weekTotal').textContent,'8,25 h');assert.equal(h.node('weekBadWeather').textContent,'8,25 h');assert(h.node('weekRows').innerHTML.includes('Schlechtwetter · ganzer Tag'));
const pdf=h.ctx.worksheetDayData(day.date,day);assert.deepEqual(JSON.parse(JSON.stringify(pdf.lines)),['Schlechtwetter']);assert.deepEqual(JSON.parse(JSON.stringify(pdf.hours)),[{line:0,value:'8,25'}]);
const csv=h.ctx.csvRows(true);assert(csv.includes('Schlechtwetter (ganzer Tag)'));assert.equal((csv.split('\n')[1].match(/8,25/g)||[]).length,2);
h.ctx.showCalendarDay(day.date);assert(h.node('calendarDetail').innerHTML.includes('Tag abgeschlossen'));assert(!h.node('calendarDetail').innerHTML.includes('<small>Start</small>'));
let reloaded=harness(data);reloaded.ctx.openEditor('edit',day.date);assert.equal(reloaded.value('editor.badWeatherFullDay'),true);assert.equal(reloaded.node('badWeatherFullDayToggle').checked,true);assert.equal(reloaded.value('credit(entries[0])'),495);
console.log('PASS: completed day without times, default pause, exactly 8.25 net, week/calendar/CSV/PDF and reload');

const normal={date:'2027-07-11',type:'work',start:'07:00',end:'16:00',breakMinutes:45,wage:23.5,note:'keep'};
h=harness([normal]);h.prepare();assert.equal(h.value('editor.pause'),45);h.save();assert.equal(h.value('entries[1].badWeatherGrossMinutes'),540);assert.deepEqual(h.value('entries[0]'),normal);
h=harness([normal]);h.ctx.openEditor('new');h.node('entryDate').value='2027-07-12';h.node('badWeatherToggle').checked=true;vm.runInContext('editor.pause=20',h.ctx);h.ctx.testWeather.setFullDay(true);assert.equal(h.value('editor.pause'),20);h.ctx.testWeather.setFullDay(false);assert.equal(h.value('editor.pause'),20);
assert.equal(h.value('credit('+JSON.stringify(normal)+')'),495);assert.equal(h.value('badWeatherMins({type:"work",start:"07:00",end:"16:00",badWeatherStart:"13:00",badWeatherEnd:"15:00"})'),120);
console.log('PASS: selected/previous pause, no double subtraction, ordinary work and partial weather unchanged');

h=harness([normal]);h.prepare(normal.date);h.save();assert.deepEqual(h.value('entries'),[normal]);
h=harness([normal]);h.prepare(normal.date,'edit');h.answer(false);h.save();assert.deepEqual(h.value('entries'),[normal]);assert.equal(h.storage.has(BK),false);h.answer(true);h.save();assert.equal(h.value('entries[0].badWeatherFullDay'),true);assert.deepEqual(JSON.parse(h.storage.get(BK)).entries,[normal]);
// Turning a completed weather day back into normal work must clear the marker.
h.ctx.openEditor('edit',normal.date);h.ctx.testWeather.setFullDay(false);vm.runInContext("editor.start='07:00';editor.end='16:00';editor.pause=30",h.ctx);h.save();assert.equal(h.value('entries[0].badWeatherFullDay'),false);assert.equal(h.value('credit(entries[0])'),510);
console.log('PASS: occupied dates, replacement confirmation/backup and editing back to normal work');

const active={date:'2027-07-12',type:'work',start:'07:00',breakMinutes:30,wage:23.5,note:'running'};
h=harness([normal],active);h.prepare(active.date,'active');h.save();assert.equal(h.value('active'),null);assert.equal(h.storage.has(AK),false);assert.equal(h.value('entries.length'),2);assert.deepEqual(JSON.parse(h.storage.get(BK)).active,active);
h=harness([normal],active);h.prepare('2027-07-13');h.save();assert.deepEqual(h.value('active'),active);assert.equal(h.value('entries.length'),2);
h=harness([],active);h.prepare(active.date);h.save();assert.equal(h.value('entries.length'),0);assert.deepEqual(h.value('active'),active);
console.log('PASS: closing the selected running day and protecting other active/occupied days');

for(const failKey of [BK,K]){h=harness([normal],active);h.prepare(active.date,'active');h.failSet(failKey);h.save();assert.deepEqual(h.value('entries'),[normal]);assert.deepEqual(h.value('active'),active);assert.deepEqual(JSON.parse(h.storage.get(K)),[normal]);assert.deepEqual(JSON.parse(h.storage.get(AK)),active)}
h=harness([normal],active);h.prepare(active.date,'active');h.failRemove(AK);h.save();assert.deepEqual(h.value('entries'),[normal]);assert.deepEqual(JSON.parse(h.storage.get(K)),[normal]);assert.deepEqual(h.value('active'),active);assert.deepEqual(JSON.parse(h.storage.get(AK)),active);
h=harness();h.prepare('2027-02-30');h.save();assert.equal(h.value('entries.length'),0);
console.log('PASS: backup/storage errors roll back, and invalid dates do not create entries');
