(function(){
  const APP_VERSION='1.4.5 Beta';

  function applyPauseMinuteLabels(){
    const select=document.getElementById('pauseSelect');
    if(!select)return;
    [...select.options].forEach(option=>{
      const minutes=Number(option.value)||0;
      option.textContent=minutes+' Min.';
    });
  }

  function applyVersion(){
    const versionBox=document.getElementById('appVersion');
    if(versionBox){
      const value=versionBox.querySelector('b');
      if(value)value.textContent=APP_VERSION;
    }
    document.querySelectorAll('#viewMore .moreCard').forEach(card=>{
      const heading=card.querySelector('h3');
      if(heading&&heading.textContent.trim()==='Version'){
        const value=card.querySelector('b');
        if(value)value.textContent=APP_VERSION;
      }
    });
  }

  function install(){
    applyPauseMinuteLabels();
    applyVersion();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
