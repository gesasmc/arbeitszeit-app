const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {jsPDF} = require('../vendor/jspdf.umd.min.js');
const root = path.resolve(__dirname, '..');
let html = '', timers = [], storageWrites = 0;
const child = {closed:false};
const elements = new Map();
const source = {
  console, URL, Date, setInterval(fn){timers.push(fn);return timers.length}, clearInterval(){},
  location:{href:'https://arbeitszeit-app-5kv.pages.dev/'},
  localStorage:{getItem(){return null},setItem(){storageWrites++}},
  document:{
    getElementById(id){if(id==='viewMore'||id==='atworkImport')return null;if(!elements.has(id))elements.set(id,{});return elements.get(id)},
    querySelector(){return null},querySelectorAll(){return []}
  },
  open(){child.document={open(){},write(s){html=s},close(){}};return child},
  downloadCsv(){},renderAll(){},toast(){},
};
source.window = source;
vm.createContext(source);
for(const file of ['app1.js','app4.js','app5.js','app9.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),source,{filename:file});
vm.runInContext("W=weekStart(fromKey('2026-10-12'));entries=[{date:'2026-10-12',type:'work',start:'07:00',end:'16:00',breakMinutes:30,workplace:'Kunde A\\nKunde B',workDescription:'Dach reparieren\\nRinne montieren',wage:23.5},{date:'2026-10-13',type:'work',start:'07:00',end:'15:00',breakMinutes:30,workplace:'Kunde C',workDescription:'Wartung',badWeatherStart:'13:00',badWeatherEnd:'15:00'},{date:'2026-10-14',type:'vacation',name:'Urlaub'}]",source);
source.printWorksheetWeek();
assert(html.includes('Kunde A<br>Kunde B'), 'Real customer line breaks must render as separate lines');
assert(html.includes('Dach reparieren</div><div class="workline">Rinne montieren'), 'Work description line breaks must be preserved');
assert(html.includes('https://arbeitszeit-app-5kv.pages.dev/vendor/jspdf.umd.min.js'));
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>new vm.Script(m[1]));
assert.equal(scripts.length,1);
const decode = text=>text.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const rows = html.split('<div class="dayrow">').slice(1).map(raw=>{
  const single = cls=>{const m=raw.match(new RegExp('<div class="'+cls+'">([\\s\\S]*?)</div>'));return {textContent:decode(m[1]),innerText:decode(m[1])}};
  const lines = cls=>{const chunk=raw.split('<div class="'+cls+'">')[1].split(cls==='workcell'?'<div class="singlecell">':'</div></div>')[0];return [...chunk.matchAll(/<div class="workline([^\"]*)">([\s\S]*?)<\/div>/g)].map(m=>({textContent:decode(m[2]),classList:{contains:cls=>m[1].split(' ').includes(cls)}}))};
  return {querySelector:sel=>single(sel.slice(1)),querySelectorAll:sel=>lines(sel.includes('workcell')?'workcell':'totalcell')};
});
assert.equal(rows.length,6);
let wrapWidth=374, resize, visualResize, errors=[], shared, shareFinished, releaseShare;
const page={offsetWidth:210*96/25.4,offsetHeight:297*96/25.4,style:{}};
const wrap={get clientWidth(){return wrapWidth},style:{},querySelector(){return page}};
const button={disabled:false,textContent:'⬇ PDF herunterladen'};
Object.assign(child,{
  console,Blob,File,URL,setTimeout,
  document:{querySelector:()=>wrap,querySelectorAll:()=>rows,getElementById:()=>button},
  jspdf:{jsPDF},
  navigator:{canShare:()=>true,share(data){shared=data;return new Promise(resolve=>{releaseShare=()=>{shareFinished=true;resolve()}})}},
  addEventListener(event,fn){if(event==='resize')resize=fn},visualViewport:{addEventListener(event,fn){visualResize=fn}},
  alert(message){errors.push(message)},
});
child.window=child;
vm.createContext(child);
scripts[0].runInContext(child);
// Run the same save/share and filename hooks as the actual app after jsPDF loads.
timers.slice(1).forEach(fn=>fn());
for(const width of [320,390,844,1363]){
  wrapWidth=Math.min(width-16,page.offsetWidth);resize();
  const scale=Number(page.style.transform.match(/scale\(([^)]+)\)/)[1]);
  assert(scale>0&&scale<=1);
  assert(Math.abs(page.offsetWidth*scale-wrapWidth)<0.001, 'A4 must fit the available width at '+width);
  assert(Math.abs(parseFloat(wrap.style.height)-page.offsetHeight*scale)<0.001);
}
assert.equal(typeof visualResize,'function');
(async()=>{
  const saving=child.downloadPdf();
  assert.equal(button.disabled,true,'Keep button busy until save/share completes');
  assert.equal(shareFinished,undefined);
  assert.equal(shared.files[0].name,'Arbeitszettel_Rodenbach_12-10-2026_bis_17-10-2026.pdf');
  const bytes=Buffer.from(await shared.files[0].arrayBuffer());
  assert(bytes.toString('ascii',0,5)==='%PDF-');
  assert(bytes.length>5000);
  fs.writeFileSync(path.resolve(root,'../pdf-test-output.pdf'),bytes);
  releaseShare();await saving;
  assert.equal(button.disabled,false);
  assert.equal(button.textContent,'⬇ PDF herunterladen');
  assert.deepEqual(errors,[]);
  assert.equal(storageWrites,0,'Opening/downloading a worksheet must not change stored entries');
  console.log('PASS: popup JavaScript syntax, four screen widths, rotation, multiple customers, real PDF generation, filename, async sharing and unchanged entry storage');
})().catch(error=>{console.error(error);process.exitCode=1});
