const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const K='arbeitszeit-app-v2',BK='arbeitszeit-app-vacation-delete-backup-v1';
function harness(seed=[],active=null){
  const storage=new Map([[K,JSON.stringify(seed)],['arbeitszeit-app-active-v1',JSON.stringify(active)],['arbeitszeit-app-vacation-settings-v1',JSON.stringify({'2027':{annual:30,carry:5}})]]);
  const fields=new Map();for(const id of ['entrySheet','entrySave','entryDate','entryToDate','entryName','entryNote','vacationHourlyToggle','absenceType','absenceFrom','absenceTo','absenceName','absenceSave'])fields.set(id,{value:'',checked:false,hidden:false});
  let renders=0,forwarded=0,allowConfirm=true,failKey=null;
  const messages=[];
  const ctx={console:{error(){},warn(){}},Date,Intl,Math,Set,Map,URL,crypto:{randomUUID},setTimeout(){},
    document:{readyState:'loading',addEventListener(){},getElementById:id=>fields.get(id)||null,querySelector(){return null}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){if(key===failKey)throw Error('quota');storage.set(key,value)},removeItem:key=>storage.delete(key)},
    renderAll(){renders++},saveEditor(){forwarded++},saveAbsence(){forwarded++},openEditor(){},toast:message=>messages.push(message),confirm(){return allowConfirm}
  };ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'app1.js'),'utf8'),ctx);ctx.toast=message=>messages.push(message);
  // Export existing module functions into this isolated test VM only; production stays private.
  const code=fs.readFileSync(path.join(root,'app11.js'),'utf8').replace('function install(){','window.testVacation={groupList,makeRangeEntries,saveRange,deleteGroup,restoreDeletedGroup,installSavePatch,rangeHint};function install(){');
  vm.runInContext(code,ctx);ctx.testVacation.installSavePatch();
  const balance=fs.readFileSync(path.join(root,'app10.js'),'utf8').replace('function install(){','window.testBalance=vacationDaysUsed;function install(){');vm.runInContext(balance,ctx);
  const state=()=>JSON.parse(vm.runInContext('JSON.stringify(entries)',ctx));
  const setEditor=(type,from,to,name='Urlaub')=>{vm.runInContext('editor.mode="new"',ctx);ctx.inputType=type;vm.runInContext('editor.type=inputType',ctx);fields.get('entryDate').value=from;fields.get('entryToDate').value=to;fields.get('entryName').value=name};
  return {ctx,fields,storage,messages,state,setEditor,api:ctx.testVacation,cancel:value=>allowConfirm=!value,fail:key=>failKey=key,forwarded:()=>forwarded};
}
const work={date:'2027-07-13',type:'work',start:'07:00',end:'16:00',breakMinutes:30,wage:23.5,note:'keep'};
let h=harness([work],{date:'2027-07-14',start:'07:00'});
for(const [id,value] of Object.entries({absenceType:'vacation',absenceFrom:'2027-07-10',absenceTo:'2027-07-25',absenceName:'Sommer 2027'}))h.fields.get(id).value=value;
h.ctx.saveAbsence();let vacations=h.state().filter(e=>e.type==='vacation');assert.equal(vacations.length,8);assert(vacations.every(e=>![0,6].includes(new Date(e.date+'T12:00:00').getDay())));
assert.deepEqual(h.state().find(e=>e.date===work.date),work);const id=vacations[0].vacationGroupId;assert(vacations.every(e=>e.vacationGroupId===id));assert.equal(h.ctx.testBalance(2027),8);
h.api.saveRange('vacation','2027-08-02','2027-08-06','Sommer 2027','');assert.equal(h.api.groupList().length,2);const second=h.api.groupList().find(g=>g.id!==id).id;
const before=h.state();h.cancel(true);h.api.deleteGroup(id);assert.deepEqual(h.state(),before);h.cancel(false);h.api.deleteGroup(id);
assert.equal(h.state().filter(e=>e.vacationGroupId===id).length,0);assert.equal(h.state().filter(e=>e.vacationGroupId===second).length,5);assert.deepEqual(h.state().filter(e=>e.type!=='vacation'),before.filter(e=>e.type!=='vacation'));
const deleted=h.state(),backup=JSON.parse(h.storage.get(BK));assert.equal(backup.entries.length,8);h.api.restoreDeletedGroup();assert.deepEqual(h.state(),before);assert.equal(h.storage.has(BK),false);assert.equal(h.ctx.testBalance(2027),13);
console.log('PASS: calendar weekdays, work/active conflicts, account, separate same-name packages, cancel, package delete and undo');

h=harness();h.setEditor('vacation','2027-06-18','2027-06-21','Brückentage');h.ctx.saveEditor();assert.deepEqual(h.state().map(e=>e.date),['2027-06-18','2027-06-21']);assert.equal(h.api.groupList().length,1);
h.setEditor('vacation','2027-06-30','2027-06-01');h.ctx.saveEditor();assert.equal(h.state().length,2);
h.api.saveRange('vacation','2027-07-10','2027-07-11','Weekend','');assert.equal(h.state().length,2);
h.api.saveRange('vacation','2027-02-30','2027-03-02','Invalid','');assert.equal(h.state().length,2);
h.fields.get('vacationHourlyToggle').checked=true;h.setEditor('vacation','2027-07-12','2027-07-13');h.ctx.saveEditor();assert.equal(h.forwarded(),0);
h.setEditor('vacation','2027-07-12','2027-07-12');h.ctx.saveEditor();assert.equal(h.forwarded(),1);
h.fields.get('absenceType').value='sickness';h.ctx.saveAbsence();assert.equal(h.forwarded(),2);
h.fields.get('vacationHourlyToggle').checked=false;h.setEditor('sickness','2027-09-10','2027-09-12');h.ctx.saveEditor();assert.equal(h.state().filter(e=>e.type==='sickness').length,3);
console.log('PASS: editor weekdays, invalid/weekend-only ranges, hourly vacation delegation, unchanged sickness path');

h=harness([{date:'2027-01-01',type:'holiday',name:'Neujahr'}]);h.api.saveRange('vacation','2026-12-31','2027-01-04','Jahreswechsel','');assert.deepEqual(h.state().filter(e=>e.type==='vacation').map(e=>e.date),['2026-12-31','2027-01-04']);assert.equal(h.ctx.testBalance(2026),1);assert.equal(h.ctx.testBalance(2027),1);
h.api.saveRange('vacation','2027-10-29','2027-11-01','Zeitumstellung','');assert.equal(h.state().filter(e=>e.vacationGroupName==='Zeitumstellung').length,2);
console.log('PASS: existing public holidays, year boundary and daylight-saving weekend');

h=harness([{date:'2027-07-10',type:'vacation',name:'Legacy weekend'},{date:'2027-07-12',type:'vacation',name:'Legacy weekday'}]);assert.equal(h.ctx.testBalance(2027),1);assert.equal(h.state().length,2);
const conflict={...work,date:'2027-07-12'};h=harness([...deleted,conflict]);h.storage.set(BK,JSON.stringify(backup));h.api.restoreDeletedGroup();assert.equal(h.state().filter(e=>e.vacationGroupId===id).length,7);assert.deepEqual(h.state().find(e=>e.date===conflict.date),conflict);assert.equal(JSON.parse(h.storage.get(BK)).entries.length,1);
console.log('PASS: legacy weekend accounting, conflict-safe partial restore');

for(const failKey of [BK,K]){h=harness();h.api.saveRange('vacation','2027-07-12','2027-07-16','Protected','');const before=h.state(),disk=h.storage.get(K);h.fail(failKey);h.api.deleteGroup(h.api.groupList()[0].id);assert.deepEqual(h.state(),before);assert.equal(h.storage.get(K),disk)}
h=harness();h.fail(K);h.api.saveRange('vacation','2027-07-12','2027-07-16','Cannot save','');assert.equal(h.state().length,0);
console.log('PASS: backup/storage failure leaves disk and in-memory entries intact');
