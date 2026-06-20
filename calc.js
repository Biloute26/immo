// ===== Calculateurs immobiliers 2026 - moteur de calcul =====
const fmt=(n)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Math.round(n));
const fmt2=(n)=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const eur=(n)=>fmt(n)+' €';
const parseNum=(v)=>{if(typeof v==='number')return v;return parseFloat((v||'').toString().replace(/[^0-9.,]/g,'').replace(',','.'))||0;};

// Émoluments notaire (barème vente A.444-91, dégressif par tranches, HT)
function emoluments(prix){
  let e=0;
  const t=[[6500,0.03945],[17000,0.01627],[60000,0.01085],[Infinity,0.00814]];
  let prev=0;
  for(const [plafond,taux] of t){
    if(prix>prev){e+=(Math.min(prix,plafond)-prev)*taux;prev=plafond;}else break;
  }
  return e*1.20; // TVA 20%
}

// Frais de notaire complets
function fraisNotaire(prix,type,tauxDept){
  const emol=emoluments(prix);
  let dmto;
  if(type==='neuf'){dmto=prix*0.00715;}     // taxe publicité foncière neuf
  else{dmto=prix*(tauxDept/100);}            // DMTO ancien (départemental+communal+assiette)
  const csi=Math.max(prix*0.001,15);          // contribution sécurité immobilière
  const debours=prix<150000?1200:(prix<300000?1400:1600); // forfait estimatif
  const total=emol+dmto+csi+debours;
  return {emol,dmto,csi,debours,total,prix,pct:total/prix*100};
}

// Mensualité prêt + tableau amortissement
function pret(capital,tauxAnnuel,dureeAnnees,assuranceMensuelle){
  const n=dureeAnnees*12;const i=tauxAnnuel/100/12;
  const m=i===0?capital/n:capital*i/(1-Math.pow(1+i,-n));
  const mTot=m+(assuranceMensuelle||0);
  const coutInteret=m*n-capital;
  const coutAssur=(assuranceMensuelle||0)*n;
  return {mensualite:m,mensualiteTotale:mTot,coutInteret,coutAssur,coutTotal:coutInteret+coutAssur,capital,n,i};
}
function amortissement(capital,tauxAnnuel,dureeAnnees){
  const n=dureeAnnees*12;const i=tauxAnnuel/100/12;
  const m=i===0?capital/n:capital*i/(1-Math.pow(1+i,-n));
  let solde=capital;const rows=[];
  for(let an=1;an<=dureeAnnees;an++){
    let intAn=0,capAn=0;
    for(let mo=0;mo<12;mo++){const int=solde*i;const cap=m-int;intAn+=int;capAn+=cap;solde-=cap;}
    rows.push({annee:an,interet:intAn,capital:capAn,restant:Math.max(0,solde)});
  }
  return rows;
}

// Capacité d'emprunt (taux endettement 35%)
function capacite(revenusMensuels,chargesMensuelles,tauxAnnuel,dureeAnnees,tauxEndett){
  const te=(tauxEndett||35)/100;
  const mensMax=revenusMensuels*te-chargesMensuelles;
  if(mensMax<=0)return {mensMax:0,capital:0,coutTotal:0};
  const n=dureeAnnees*12;const i=tauxAnnuel/100/12;
  const capital=i===0?mensMax*n:mensMax*(1-Math.pow(1+i,-n))/i;
  return {mensMax,capital,n};
}

// Plus-value immobilière
function plusValue(prixVente,prixAchat,fraisAchat,travaux,anneesDetention,forfaits){
  let pa=prixAchat;
  if(forfaits){fraisAchat=anneesDetention>=5?prixAchat*0.075:fraisAchat;travaux=anneesDetention>=5?prixAchat*0.15:travaux;}
  const base=pa+fraisAchat+travaux;
  const pvBrute=Math.max(0,prixVente-base);
  // Abattement IR : 6%/an de 6 à 21 ans, 4% à 22 ans => exo 22 ans
  let abIR=0;
  if(anneesDetention>21)abIR=1;
  else if(anneesDetention>=6)abIR=Math.min(1,(anneesDetention-5)*0.06+(anneesDetention>=22?0.04:0));
  // Abattement PS : 1.65%/an 6-21, 1.60% 22e, 9%/an 23-30 => exo 30 ans
  let abPS=0;
  if(anneesDetention>=30)abPS=1;
  else if(anneesDetention>=6){
    let a=Math.min(anneesDetention,21)-5;abPS=a*0.0165;
    if(anneesDetention>=22)abPS+=0.016;
    if(anneesDetention>22)abPS+=(Math.min(anneesDetention,30)-22)*0.09;
    abPS=Math.min(1,abPS);
  }
  const pvIR=pvBrute*(1-abIR);
  const pvPS=pvBrute*(1-abPS);
  const ir=pvIR*0.19;
  const ps=pvPS*0.172;
  // Surtaxe sur PV imposable IR > 50000
  let surtaxe=0;const p=pvIR;
  if(p>50000){
    const tr=[[100000,0.02],[150000,0.03],[200000,0.04],[250000,0.05],[Infinity,0.06]];
    // approximation barème lissé officiel : on applique taux marginal simplifié
    if(p<=100000)surtaxe=p*0.02;
    else if(p<=150000)surtaxe=p*0.03;
    else if(p<=200000)surtaxe=p*0.04;
    else if(p<=250000)surtaxe=p*0.05;
    else surtaxe=p*0.06;
  }
  const totalImpot=ir+ps+surtaxe;
  return {pvBrute,pvIR,pvPS,ir,ps,surtaxe,totalImpot,net:pvBrute-totalImpot,abIR,abPS};
}

// Rendement locatif
function rendement(prix,fraisNotaireV,travaux,loyerMensuel,chargesAnnuelles,taxeFonciere){
  const invest=prix+fraisNotaireV+travaux;
  const loyerAn=loyerMensuel*12;
  const brut=loyerAn/invest*100;
  const netCharges=loyerAn-chargesAnnuelles-taxeFonciere;
  const net=netCharges/invest*100;
  return {invest,loyerAn,brut,net,netCharges};
}

// DMTO par département (taux global ancien : départemental + communal 1.20% + assiette 2.37% sur dépt)
// 2026 : majorité à 5% départemental => ~5.81% global. Standard 4.5% => ~5.31%.
const DEPTS_5PCT=['01','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','21','22','23','24','25','26','27','28','29','2A','2B','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95'];
function tauxDMTO(dept){
  // 5% départemental + 1.20% communal + frais assiette = ~5.8066% ; 4.5% => ~5.31%
  return DEPTS_5PCT.includes(dept)?5.8066:5.3066;
}

// Frais de notaire étendus : terrain, garage, viager
function fraisNotaireEtendu(prix,type,tauxDept,opts){
  opts=opts||{};
  const emol=emoluments(prix);
  let dmto, labelDmto='Droits de mutation (DMTO)';
  if(type==='neuf'){dmto=prix*0.00715;labelDmto='Taxe de publicité foncière';}
  else if(type==='terrain-pro'){dmto=prix*0.00715;labelDmto='Droits réduits (terrain vendu par pro, TVA)';}
  else if(type==='terrain-particulier'){dmto=prix*(tauxDept/100);labelDmto='Droits de mutation (terrain entre particuliers)';}
  else if(type==='viager'){
    // valeur fiscale = valeur occupée (prix - DUH). opts.valeurOccupee fournie.
    const base=opts.valeurOccupee||prix;
    dmto=base*(tauxDept/100);labelDmto='Droits de mutation (sur valeur occupée)';
    const emol2=emoluments(base);
    const csi2=Math.max(base*0.001,15);
    const deb2=prix<150000?1200:(prix<300000?1400:1600);
    return {emol:emol2,dmto,csi:csi2,debours:deb2,total:emol2+dmto+csi2+deb2,prix,base,pct:(emol2+dmto+csi2+deb2)/prix*100,labelDmto};
  }
  else{dmto=prix*(tauxDept/100);}
  const csi=Math.max(prix*0.001,15);
  let debours=prix<150000?1200:(prix<300000?1400:1600);
  if(type==='garage')debours=Math.min(debours,900); // dossier plus simple
  const total=emol+dmto+csi+debours;
  return {emol,dmto,csi,debours,total,prix,pct:total/prix*100,labelDmto};
}
