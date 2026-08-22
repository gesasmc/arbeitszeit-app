(function(){
  const ENABLE_KEY='arbeitszeit-app-weekly-backup-enabled-v1';
  const META_KEY='arbeitszeit-app-weekly-backup-meta-v1';
  const PREFIX='arbeitszeit-app-weekly-backup-v1:';
  const MAX_BACKUPS=8;
  const WEEK_MS=7*24*60*60*1000;

  function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{}}catch{return {}}}
  function writeMeta(meta){localStorage.setItem(META_KEY,JSON.stringify(meta))}
  function enabled(){return localStorage.getItem(ENABLE_KEY)==='1'}
  function setEnabled(v){localStorage.setItem(ENABLE_KEY,v?'1':'0')}
  function fmt(ts){if(!ts)return 'Noch kein Backup';try{return new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(ts))}catch{return new Date(ts).toLocaleString()}}
  function backupKeys(){const arr=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PREFIX))arr.push(k)}return arr.sort()}
  function currentSnapshot(){
    return {
      version:'1.4.2 Beta',
      createdAt:new Date().toISOString(),
      entries:Array.isArray(window.entries)?window.entries:[],
      active:window.active||null,
      settings:window.settings||{},
      storage:{
        entries:localStorage.getItem('arbeitszeit-app-v2'),
        active:localStorage.getItem('arbeitszeit-app-active-v1'),
        settings:localStorage.getItem('arbeitszeit-app-settings-v1')
      }
    };
  }
  function makeBackup(reason){
    const now=Date.now(),key=PREFIX+new Date(now).toISOString();
    localStorage.setItem(key,JSON.stringify(currentSnapshot()));
    const keys=backupKeys();while(keys.length>MAX_BACKUPS){localStorage.removeItem(keys.shift())}
    const meta=readMeta();meta.lastBackupAt=now;meta.lastReason=reason||'manual';writeMeta(meta);renderStatus();return key;
  }
  function maybeWeeklyBackup(){
    if(!enabled())return;
    const meta=readMeta(),last=Number(meta.lastBackupAt)||0;
    if(!last||Date.now()-last>=WEEK_MS)makeBackup('weekly');
  }
  function downloadLatest(){
    const keys=backupKeys();
    if(!keys.length){makeBackup('manual-download')}
    const latest=backupKeys().slice(-1)[0];
    const raw=localStorage.getItem(latest)||JSON.stringify(currentSnapshot());
    const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Arbeitszeit_Backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function renderStatus(){
    const s=document.getElementById('weeklyBackupStatus');if(!s)return;
    const meta=readMeta(),count=backupKeys().length;
    s.textContent=(enabled()?'Aktiv':'Aus')+' · Letztes Backup: '+fmt(meta.lastBackupAt)+' · Gespeichert: '+count;
    const cb=document.getElementById('weeklyBackupToggle');if(cb)cb.checked=enabled();
  }
  function install(){
    const more=document.getElementById('viewMore');if(!more||document.getElementById('weeklyBackupCard'))return;
    const card=document.createElement('div');card.className='moreCard';card.id='weeklyBackupCard';
    card.innerHTML='<h3>Backups</h3><label class="moreRow" style="cursor:pointer"><span>Wöchentliches Backup</span><span class="switch"><input id="weeklyBackupToggle" type="checkbox"><span class="slider"></span></span></label><p style="margin:0 0 12px;color:#667085;font-size:14px;line-height:1.4">Wenn aktiviert, erstellt die App spätestens alle 7 Tage beim nächsten Öffnen automatisch ein lokales Backup. Es werden die letzten 8 Backups behalten.</p><button class="moreBtn" id="backupNowBtn">Backup jetzt erstellen</button><button class="moreBtn" id="backupDownloadBtn">Letztes Backup herunterladen</button><div id="weeklyBackupStatus" style="margin-top:10px;font-size:13px;color:#667085"></div>';
    more.appendChild(card);
    const toggle=document.getElementById('weeklyBackupToggle');
    toggle.checked=enabled();
    toggle.onchange=()=>{setEnabled(toggle.checked);if(toggle.checked&&!readMeta().lastBackupAt)makeBackup('enabled');renderStatus();};
    document.getElementById('backupNowBtn').onclick=()=>{makeBackup('manual');if(typeof toast==='function')toast('Backup erstellt')};
    document.getElementById('backupDownloadBtn').onclick=downloadLatest;
    renderStatus();maybeWeeklyBackup();
    const v=document.querySelector('#appVersion b');if(v)v.textContent='1.4.2 Beta';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
