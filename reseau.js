// Onglet flottant "Nos autres sites" — réseau de sites
(function(){
  const SITES=[
    {nom:'Calculateurs immobiliers',url:'https://biloute26.github.io/immo/',ic:'🏠'},
    {nom:'Outils administratifs',url:'https://biloute26.github.io/outils-administratifs/',ic:'📋'},
    {nom:'Outils pratiques du quotidien',url:'https://biloute26.github.io/Outils-pratiques-du-Quotidien/',ic:'🧰'}
  ];
  const HERE=location.href.replace(/index\.html$/,'');
  const css=`
  #netTab{position:fixed;left:0;top:38%;z-index:9000;font-family:'Inter',-apple-system,sans-serif}
  #netTab .nt-toggle{position:absolute;left:0;top:0;background:#1F3A2E;color:#fff;border:none;border-right:2px solid #C9A24B;
    writing-mode:vertical-rl;text-orientation:mixed;padding:14px 8px;border-radius:0 10px 10px 0;cursor:pointer;font-size:13px;
    font-weight:600;letter-spacing:.05em;box-shadow:2px 2px 10px rgba(0,0,0,.15);transition:background .2s}
  #netTab .nt-toggle:hover{background:#2E5141}
  #netTab .nt-panel{position:absolute;left:-300px;top:0;width:280px;background:#fff;border:1px solid #D8CFBC;border-left:3px solid #C9A24B;
    border-radius:0 12px 12px 0;box-shadow:4px 6px 24px rgba(31,58,46,.18);padding:16px;transition:left .28s ease;opacity:0;pointer-events:none}
  #netTab.open .nt-panel{left:46px;opacity:1;pointer-events:auto}
  #netTab.open .nt-toggle{background:#2E5141}
  #netTab .nt-title{font-family:'Fraunces',Georgia,serif;font-size:15px;color:#1F3A2E;font-weight:600;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #ECE6D8}
  #netTab a.nt-link{display:flex;align-items:center;gap:10px;padding:10px;border-radius:9px;color:#23231F;text-decoration:none;font-size:14px;transition:background .15s}
  #netTab a.nt-link:hover{background:#F3EFE6}
  #netTab a.nt-link .nt-ic{width:30px;height:30px;border-radius:7px;background:#F3EFE6;display:grid;place-items:center;font-size:16px;flex-shrink:0}
  #netTab a.nt-link.current{opacity:.5;pointer-events:none}
  #netTab a.nt-link.current:after{content:'(vous êtes ici)';font-size:11px;color:#6B6557;margin-left:auto}
  @media(max-width:680px){#netTab{top:auto;bottom:90px}#netTab .nt-panel{width:240px}#netTab.open .nt-panel{left:42px}}
  @media(prefers-reduced-motion:reduce){#netTab .nt-panel{transition:none}}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const wrap=document.createElement('div');wrap.id='netTab';
  let links='';
  SITES.forEach(s=>{const cur=HERE.indexOf(s.url)===0||s.url.indexOf(HERE)===0;
    links+=`<a class="nt-link${cur?' current':''}" href="${s.url}"${cur?'':' '}><span class="nt-ic">${s.ic}</span><span>${s.nom}</span></a>`;});
  wrap.innerHTML=`<button class="nt-toggle" aria-label="Nos autres sites">＋ Nos sites</button>
    <div class="nt-panel"><p class="nt-title">Nos autres sites</p>${links}</div>`;
  document.body.appendChild(wrap);
  const tog=wrap.querySelector('.nt-toggle');
  tog.addEventListener('click',()=>wrap.classList.toggle('open'));
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))wrap.classList.remove('open');});
})();
