(function(){
  const originalPrintWorksheetWeek=window.printWorksheetWeek;
  if(typeof originalPrintWorksheetWeek!=='function')return;

  function installIosPdfSave(child){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      try{
        if(child.closed){clearInterval(timer);return}
        const jsPDF=child.jspdf&&child.jspdf.jsPDF;
        if(jsPDF&&jsPDF.API){
          clearInterval(timer);
          jsPDF.API.save=async function(filename){
            const name=filename||'Arbeitszettel.pdf';
            const blob=this.output('blob');
            try{
              const file=new child.File([blob],name,{type:'application/pdf'});
              const nav=child.navigator;
              if(nav.share&&(!nav.canShare||nav.canShare({files:[file]}))){
                await nav.share({files:[file],title:name});
                return this;
              }
            }catch(err){
              if(err&&err.name==='AbortError')return this;
              console.warn('Teilen nicht verfügbar, nutze Download-Fallback',err);
            }
            const url=child.URL.createObjectURL(blob);
            const a=child.document.createElement('a');
            a.href=url;
            a.download=name;
            child.document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>child.URL.revokeObjectURL(url),1500);
            return this;
          };
        }
      }catch(e){console.warn(e)}
      if(attempts>80)clearInterval(timer);
    },100);
  }

  window.printWorksheetWeek=function(){
    let child=null;
    const realOpen=window.open;
    window.open=function(){child=realOpen.apply(window,arguments);return child};
    try{originalPrintWorksheetWeek()}finally{window.open=realOpen}
    if(child)installIosPdfSave(child);
  };

  const printBtn=document.getElementById('printWeek');
  if(printBtn)printBtn.onclick=window.printWorksheetWeek;
  const v=document.querySelector('#appVersion b');
  if(v)v.textContent='1.3.8 Beta';
})();
