(function(){
  const VERSION='1.5.2 Beta';
  function monthEarningsForWeek(){
    const ref=W instanceof Date?W:new Date();
    const y=ref.getFullYear(),m=ref.getMonth();
    return entries.reduce((sum,e)=>{if(!e||e.type!=='work'||!e.date)return sum;const d=fromKey(e.date);return d.getFullYear()===y&&d.getMonth()===m?sum+earnings(e):sum},0);
  }
  function renderMonthEarnings(){
    const el=document.getElementById('monthEarnings');if(!el)return;
    el.textContent=euro(monthEarningsForWeek());
  }
  function install(){
    const grid=document.querySelector('#viewOverview .statsGrid');
    if(grid&&!document.getElementById('monthEarnings')){
      const card=document.createElement('div');card.className='statCard';card.innerHTML='<small>Monatsverdienst</small><b id="monthEarnings">0,00 €</b>';grid.appendChild(card);
    }
    const oldRenderWeek=window.renderWeek;
    if(typeof oldRenderWeek==='function')window.renderWeek=function(){const r=oldRenderWeek.apply(this,arguments);renderMonthEarnings();return r};
    const oldRenderAll=window.renderAll;
    if(typeof oldRenderAll==='function')window.renderAll=function(){const r=oldRenderAll.apply(this,arguments);renderMonthEarnings();return r};
    renderMonthEarnings();
    const v=document.querySelector('#appVersion b');if(v)v.textContent=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
