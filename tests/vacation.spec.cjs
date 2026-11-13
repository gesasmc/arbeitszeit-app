const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const URL=process.env.APP_TEST_URL||'http://127.0.0.1:8765/';
const KEY='arbeitszeit-app-v2',BACKUP='arbeitszeit-app-vacation-delete-backup-v1';
const work={date:'2027-07-13',type:'work',start:'07:00',end:'16:00',breakMinutes:30,wage:23.5,note:'Unverändert'};
let browser;
async function fresh(seed=[],extra={}){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Berlin'});
  await context.addInitScript(({seed,extra,KEY})=>{
    if(sessionStorage.getItem('vacation-test-seeded'))return;
    localStorage.setItem(KEY,JSON.stringify(seed));
    localStorage.setItem('arbeitszeit-app-vacation-settings-v1',JSON.stringify({'2027':{annual:30,carry:5}}));
    for(const [key,value] of Object.entries(extra))localStorage.setItem(key,value);
    sessionStorage.setItem('vacation-test-seeded','1');
  },{seed,extra,KEY});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL);
  await page.waitForFunction(()=>document.querySelector('#appVersion b')?.textContent==='1.5.4 Beta'&&document.getElementById('vacationGroupList'));
  return {context,page,errors};
}
async function data(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'[]'),KEY)}
async function calendar(page){await page.locator('[data-view="Calendar"]').click()}
async function range(page,from,to,name='Sommer 2027',type='vacation'){
  await calendar(page);
  await page.locator('#absenceType').selectOption(type);
  await page.locator('#absenceFrom').fill(from);await page.locator('#absenceTo').fill(to);
  await page.locator('#absenceName').fill(name);await page.locator('#absenceSave').click();
}
async function used(page,year){
  await page.locator('[data-view="More"]').click();await page.locator('#vacYear').fill(String(year));await page.locator('#vacYear').press('Tab');
  return page.locator('#vacUsed').innerText();
}
async function editorRange(page,from,to,name){
  await page.locator('[data-view="Overview"]').click();await page.locator('#newEntryBtn').click();
  await page.locator('[data-type="vacation"]').click();await page.locator('#entryToDate').waitFor({state:'visible'});
  await page.locator('#entryDate').fill(from);await page.locator('#entryToDate').fill(to);await page.locator('#entryName').fill(name);await page.locator('#entrySave').click();
}
(async()=>{
  browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
  let t=await fresh([work]);let {page}=t;
  await range(page,'2027-07-10','2027-07-25','Sommer <2027>');
  let items=await data(page),vac=items.filter(e=>e.type==='vacation');
  assert.equal(vac.length,9,'Ten weekdays, with the existing workday protected');
  assert(vac.every(e=>![0,6].includes(new Date(e.date+'T12:00:00').getDay())));
  const id=vac[0].vacationGroupId;assert(id&&vac.every(e=>e.vacationGroupId===id));
  assert.deepEqual(items.find(e=>e.date===work.date),work);
  assert.equal(await used(page,2027),'9,00 Tage');
  assert.equal(await page.locator('#vacRemaining').innerText(),'26,00 Tage');
  await page.reload();await page.locator('#vacationGroupList').waitFor({state:'attached'});await calendar(page);
  assert((await page.locator('#vacationGroupList').innerText()).includes('Sommer <2027>'));
  assert.equal(await page.locator('#vacationGroupList script').count(),0);
  await range(page,'2027-08-02','2027-08-06','Sommer <2027>');
  items=await data(page);const second=items.find(e=>e.date==='2027-08-02').vacationGroupId;assert.notEqual(id,second);
  assert.equal(new Set(items.filter(e=>e.type==='vacation').map(e=>e.vacationGroupId)).size,2);
  await page.locator('#prevMonth').click();await page.locator('[data-cal="2027-07-12"]').click();await page.locator('#calEdit').click();
  assert.equal(await page.locator('#vacationGroupDelete').isVisible(),true);
  assert((await page.locator('#vacationGroupInfo').innerText()).includes('Sommer <2027>'));
  await page.locator('#entryClose').click();
  const before=await data(page);const deleteButton=page.locator('[data-vacation-group="'+id+'"]');
  page.once('dialog',dialog=>dialog.dismiss());await deleteButton.click();assert.deepEqual(await data(page),before,'Cancel must not delete anything');
  page.once('dialog',async dialog=>{assert(dialog.message().includes('9 Urlaubstage'));await dialog.accept()});await deleteButton.click();
  items=await data(page);assert.equal(items.filter(e=>e.vacationGroupId===id).length,0);assert.equal(items.filter(e=>e.vacationGroupId===second).length,5);
  assert.deepEqual(items.filter(e=>e.type!=='vacation'),before.filter(e=>e.type!=='vacation'));
  const backup=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),BACKUP);assert.equal(backup.entries.length,9);
  const deletedState=items;
  await page.locator('#restoreVacationGroup').click();assert.equal((await data(page)).filter(e=>e.vacationGroupId===id).length,9);
  assert.equal(await used(page,2027),'14,00 Tage');
  await calendar(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.resolve(__dirname,'../../vacation-mobile-test.png'),fullPage:true});
  assert.deepEqual(t.errors,[]);await t.context.close();console.log('PASS: calendar weekdays, balance, existing entries, persistence, separate IDs, editor group action, cancel, scoped bulk delete and undo');

  t=await fresh();page=t.page;
  await editorRange(page,'2027-06-18','2027-06-21','Brückentage');vac=(await data(page)).filter(e=>e.type==='vacation');assert.equal(vac.length,2);assert.equal(vac[0].vacationGroupId,vac[1].vacationGroupId);
  await page.locator('#newEntryBtn').click();await page.locator('[data-type="vacation"]').click();await page.locator('#entryToDate').waitFor({state:'visible'});
  assert.equal(await page.locator('#entryToDate').inputValue(),await page.locator('#entryDate').inputValue(),'New entry must reset the previous end date');
  await page.locator('#entryDate').fill('2027-08-09');await page.locator('#entryToDate').fill('2027-08-02');await page.locator('#entrySave').click();
  assert.equal((await data(page)).filter(e=>e.type==='vacation').length,2,'Invalid range must not save');
  await page.locator('#entryClose').click();
  await range(page,'2027-07-10','2027-07-11','Wochenende');assert.equal((await data(page)).filter(e=>e.type==='vacation').length,2);
  await range(page,'2027-09-10','2027-09-12','Krank','sickness');assert.equal((await data(page)).filter(e=>e.type==='sickness').length,3);
  assert.deepEqual(t.errors,[]);await t.context.close();console.log('PASS: editor ranges, weekend-only ranges, invalid dates, reset end date, sickness behavior');

  t=await fresh();page=t.page;
  await range(page,'2026-12-31','2027-01-04','Jahreswechsel');vac=(await data(page)).filter(e=>e.type==='vacation');assert.deepEqual(vac.map(e=>e.date),['2026-12-31','2027-01-04']);
  assert.equal(await used(page,2026),'1,00 Tage');assert.equal(await used(page,2027),'1,00 Tage');
  await range(page,'2027-10-29','2027-11-01','Zeitumstellung');assert.equal((await data(page)).filter(e=>e.vacationGroupName==='Zeitumstellung').length,2);
  assert.deepEqual(t.errors,[]);await t.context.close();console.log('PASS: public holidays, year boundary, per-year balance and daylight-saving weekend');

  t=await fresh([{date:'2027-07-10',type:'vacation',name:'Alter Wochenend-Eintrag'},{date:'2027-07-12',type:'vacation',name:'Alter Werktag'}]);
  assert.equal(await used(t.page,2027),'1,00 Tage');assert.equal((await data(t.page)).filter(e=>e.type==='vacation').length,2);await t.context.close();
  console.log('PASS: legacy weekend entries are not counted or silently deleted');

  const conflict={...work,date:'2027-07-12'};
  t=await fresh([...deletedState,conflict],{[BACKUP]:JSON.stringify(backup)});page=t.page;await calendar(page);await page.locator('#restoreVacationGroup').click();
  items=await data(page);assert.equal(items.filter(e=>e.vacationGroupId===id).length,8);assert.deepEqual(items.find(e=>e.date===conflict.date),conflict);
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).entries.length,BACKUP),1);await t.context.close();
  console.log('PASS: restore preserves workdays added after a deletion');

  t=await fresh();page=t.page;await range(page,'2027-07-12','2027-07-16','Speicherfehler');const saved=await data(page);
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Test quota','QuotaExceededError');return original.call(this,k,v)}},BACKUP);
  page.once('dialog',dialog=>dialog.accept());await page.locator('[data-vacation-group]').click();assert.deepEqual(await data(page),saved);
  assert.equal(await page.locator('[data-vacation-group]').count(),1);await t.context.close();console.log('PASS: failed backup blocks bulk deletion');

  await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1});
