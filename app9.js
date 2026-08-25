(function(){
  const VERSION='1.4.6 Beta';

  function installSendButton(child){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      try{
        if(!child||child.closed){clearInterval(timer);return}
        const toolbar=child.document&&child.document.querySelector('.toolbar');
        const download=child.document&&child.document.getElementById('downloadBtn');
        const jsPDF=child.jspdf&&child.jspdf.jsPDF;
        if(toolbar&&download&&jsPDF){
          clearInterval(timer);
          if(child.document.getElementById('sendBtn'))return;
          const send=child.document.createElement('button');
          send.id='sendBtn';
          send.textContent='✉ Senden';
          download.insertAdjacentElement('afterend',send);
          send.onclick=async()=>{
            const old=send.textContent;
            try{
              send.disabled=true;send.textContent='Wird vorbereitet…';
              // Reuse the existing, already tested PDF generator by temporarily intercepting jsPDF.save.
              let shared=false;
              const oldSave=jsPDF.API.save;
              jsPDF.API.save=async function(filename){
                const name=filename||('Arbeitszettel_'+new Date().toISOString().slice(0,10)+'.pdf');
                const blob=this.output('blob');
                try{
                  const file=new child.File([blob],name,{type:'application/pdf'});
                  if(child.navigator.share&&(!child.navigator.canShare||child.navigator.canShare({files:[file]}))){
                    await child.navigator.share({files:[file],title:'Arbeitszettel',text:'Arbeitszettel im Anhang'});
                    shared=true;
                    return this;
                  }
                }catch(e){if(e&&e.name==='AbortError'){shared=true;return this}}
                return this;
              };
              try{await child.downloadPdf()}finally{jsPDF.API.save=oldSave}
              if(!shared){
                // Browsers cannot attach a local PDF through mailto. Open the phone's default mail app as fallback.
                child.location.href='mailto:?subject='+encodeURIComponent('Arbeitszettel')+'&body='+encodeURIComponent('Arbeitszettel – bitte PDF über Teilen anhängen.');
              }
            }catch(e){console.error(e);child.alert('Senden konnte nicht geöffnet werden.')}finally{send.disabled=false;send.textContent=old}
          };
        }
      }catch(e){console.warn(e)}
      if(tries>100)clearInterval(timer);
    },100);
  }

  const original=window.printWorksheetWeek;
  if(typeof original==='function'){
    window.printWorksheetWeek=function(){
      let child=null;
      const realOpen=window.open;
      window.open=function(){child=realOpen.apply(window,arguments);return child};
      try{original()}finally{window.open=realOpen}
      if(child)installSendButton(child);
    };
    const btn=document.getElementById('printWeek');if(btn)btn.onclick=window.printWorksheetWeek;
  }

  const v=document.querySelector('#appVersion b');if(v)v.textContent=VERSION;
})();
