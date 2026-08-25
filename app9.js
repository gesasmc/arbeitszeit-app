(function(){
  const VERSION='1.4.7 Beta';
  // Send/share experiment removed. Preserve the existing PDF generator and only rename its download.
  const original=window.printWorksheetWeek;
  if(typeof original==='function'){
    window.printWorksheetWeek=function(){
      let child=null;
      const realOpen=window.open;
      window.open=function(){child=realOpen.apply(window,arguments);return child};
      try{original()}finally{window.open=realOpen}
      if(child){
        let tries=0;
        const timer=setInterval(()=>{
          tries++;
          try{
            if(child.closed){clearInterval(timer);return}
            const jsPDF=child.jspdf&&child.jspdf.jsPDF;
            if(jsPDF&&typeof child.downloadPdf==='function'){
              clearInterval(timer);
              const oldDownload=child.downloadPdf;
              child.downloadPdf=function(){
                const oldSave=jsPDF.API.save;
                jsPDF.API.save=function(){
                  const start=key(W),end=key(addDays(W,5));
                  const fmt=k=>{const d=fromKey(k);return pad(d.getDate())+'-'+pad(d.getMonth()+1)+'-'+d.getFullYear()};
                  return oldSave.call(this,'Arbeitszettel_Rodenbach_'+fmt(start)+'_bis_'+fmt(end)+'.pdf');
                };
                try{return oldDownload()}finally{jsPDF.API.save=oldSave}
              };
            }
          }catch(e){console.warn(e)}
          if(tries>100)clearInterval(timer);
        },100);
      }
    };
    const btn=document.getElementById('printWeek');if(btn)btn.onclick=window.printWorksheetWeek;
  }
  const v=document.querySelector('#appVersion b');if(v)v.textContent=VERSION;
})();
