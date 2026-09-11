(function(){
  const VERSION='1.5.1 Beta';
  const ROW=44;
  const CYCLES=7;
  const CENTER_CYCLE=3;

  function valueIndex(kind){
    return kind==='hour' ? picker.hour : Math.round(picker.minute/5);
  }
  function itemCount(kind){return kind==='hour'?24:12}
  function valueFor(kind,index){return kind==='hour'?index:index*5}

  function rebuildWheel(kind){
    const id=kind==='hour'?'hourWheel':'minuteWheel';
    const old=document.getElementById(id);if(!old)return null;
    // Clone once so the old non-circular scroll listener from the original app is removed.
    const el=old.cloneNode(false);old.replaceWith(el);
    let html='';const count=itemCount(kind);
    for(let cycle=0;cycle<CYCLES;cycle++){
      for(let i=0;i<count;i++){
        const value=valueFor(kind,i),label=String(value).padStart(2,'0');
        html+=`<div class="wheelOpt${i===valueIndex(kind)?' selected':''}" data-circle-kind="${kind}" data-circle-index="${cycle*count+i}" data-circle-value="${value}">${label}</div>`;
      }
    }
    el.innerHTML=html;
    el.querySelectorAll('[data-circle-index]').forEach(opt=>{
      opt.onclick=()=>{
        const value=Number(opt.dataset.circleValue)||0;
        if(kind==='hour')picker.hour=value;else picker.minute=value;
        el.scrollTo({top:Number(opt.dataset.circleIndex)*ROW,behavior:'smooth'});
        markCircle();
      };
    });
    bindCircle(el,kind);
    return el;
  }

  function markCircle(){
    document.querySelectorAll('[data-circle-kind="hour"]').forEach(o=>o.classList.toggle('selected',Number(o.dataset.circleValue)===picker.hour));
    document.querySelectorAll('[data-circle-kind="minute"]').forEach(o=>o.classList.toggle('selected',Number(o.dataset.circleValue)===picker.minute));
  }

  function bindCircle(el,kind){
    let timer;
    el.addEventListener('scroll',()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        const count=itemCount(kind);
        let absolute=Math.round(el.scrollTop/ROW);
        const local=((absolute%count)+count)%count;
        const value=valueFor(kind,local);
        if(kind==='hour')picker.hour=value;else picker.minute=value;
        markCircle();
        // Jump invisibly to the same value in the middle copy before an edge is reached.
        if(absolute<count || absolute>=count*(CYCLES-1)){
          absolute=CENTER_CYCLE*count+local;
          el.scrollTop=absolute*ROW;
        }
      },70);
    },{passive:true});
  }

  window.buildWheels=function(){
    rebuildWheel('hour');
    rebuildWheel('minute');
  };

  window.scrollWheels=function(){
    const hw=document.getElementById('hourWheel'),mw=document.getElementById('minuteWheel');
    if(hw)hw.scrollTo({top:(CENTER_CYCLE*24+picker.hour)*ROW,behavior:'auto'});
    if(mw)mw.scrollTo({top:(CENTER_CYCLE*12+Math.round(picker.minute/5))*ROW,behavior:'auto'});
    markCircle();
  };

  // Replace the already-bound original wheels immediately. The next openPicker call fills them.
  function install(){
    const h=document.getElementById('hourWheel'),m=document.getElementById('minuteWheel');
    if(h){const c=h.cloneNode(false);h.replaceWith(c)}
    if(m){const c=m.cloneNode(false);m.replaceWith(c)}
    const v=document.querySelector('#appVersion b');if(v)v.textContent=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
