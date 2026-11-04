/* Apply the approved visual design after the production generator.
 * Conversion code, consent markup and existing SEO are sourced from that build. */
import {readFileSync as read, writeFileSync as write, readdirSync, existsSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'site'), design=join(root,'build/design');
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);
const match=(s,re)=>s.match(re)?.[0]||'';
const integrationFR=read(join(out,'industries/construction/index.html'),'utf8');
const integrationEN=read(join(out,'en/industries/construction/index.html'),'utf8');
const home=read(join(out,'index.html'),'utf8');
const gtm=match(home,/<script>window.dataLayer[\s\S]*?<!-- End Google Tag Manager -->/);
const noscript=match(home,/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/);
const consent=s=>match(s,/<div class="consent-overlay[\s\S]*?(?=<script src="\/assets\/js\/config.js")/);
const head=s=>match(s,/<head>[\s\S]*?<\/head>/);
const main=s=>match(s,/<main\b[\s\S]*?<\/main>/);
const header=s=>match(s,/<header class="ep-header"[\s\S]*?<\/header>/);
const footer=s=>match(s,/<footer class="ep-footer"[\s\S]*?<\/footer>/).replace(' · Proposition de site complet','').replace(' · Full website preview','');
const commonScripts='<script src="/assets/js/config.js"></script><script src="/assets/js/main.js"></script><script src="/assets/design-shell.js" defer></script>';
const styles='<link rel="stylesheet" href="/assets/preview-shell.css?v=20261104"><link rel="stylesheet" href="/assets/preview-interior.css?v=20261104">';
let added=[];
for(const f of files(design).filter(f=>f.endsWith('.html'))){
 const rel=f.slice(design.length+1),target=join(out,rel),preview=read(f,'utf8');
 const original=existsSync(target)?read(target,'utf8'):null;
 const industry=/^(en\/)?industries\/[^/]+\/index.html$/.test(rel);
 const newPage=['sites-web.html','industries/index.html','ressources/index.html'].includes(rel);
 const custom=rel==='index.html'||newPage||!original||industry;
 let html;
 if(!custom){
  // Retain current contact calendar, forms, guide downloads, legal copy and landing conversions.
  let h=head(original).replace('</head>',styles+'</head>');
  const body=match(preview,/<body[^>]*>/)||'<body>';
  html=original.slice(0,original.indexOf('<head>'))+h+body+noscript+header(preview)+'<div class="we-page">'+(main(original)||original.split(/<body[^>]*>/)[1].split('<footer')[0].replace(/<!--[\s\S]*?-->/g,'').replace(/<noscript>[\s\S]*?<\/noscript>/g,'').replace(/<header[\s\S]*?<\/header>/,''))+'</div>'+footer(preview)+consent(original)+commonScripts+'</body></html>';
 }else{
  html=preview.replace(/<meta name="robots"[^>]*>/g,'').replace(/<div class="ep-ribbon">[\s\S]*?<\/div>/g,'').replace(' · Proposition de site complet','').replace(' · Full website preview','');
  html=html.replace(/<script src="\/assets\/preview-shell.js"[^>]*><\/script>/g,'');
  html=html.replace('</body>',consent(original||home)+commonScripts+'</body>');
  let extra=gtm;
  if(original&&!newPage){
   extra += [...head(original).matchAll(/<link rel="(?:canonical|alternate)"[^>]*>/g)].map(m=>m[0]).join('\n');
   // Preserve organization identity; refresh service schema for the visible dual offer.
   extra += [...head(original).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].filter(m=>JSON.parse(m[1])['@type']==='Organization').map(m=>m[0]).join('');
  }else{
   const path=rel==='index.html'?'/':'/'+rel.replace(/index.html$/,'');added.push(path);
   extra+='<link rel="canonical" href="https://essentielpme.com'+path+'">';
  }
  if(rel==='index.html'){
   html=html.replace(/<title>.*?<\/title>/,'<title>Sites web et publicité en ligne au Québec | Essentiel PME</title>');
  }
  html=html.replace(/<meta property="og:(?:url|type|title|description|image)"[^>]*>/g,'');
  const title=match(html,/<title>.*?<\/title>/).replace(/<\/?title>/g,'');
  const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'Sites web WordPress et publicité en ligne pour les PME du Québec. Des forfaits clairs et un accompagnement au Québec.';
  const url='https://essentielpme.com/'+rel.replace(/index.html$/,'');
  if(!html.includes('name="description"'))extra+='<meta name="description" content="'+description+'">';
  extra+='<meta property="og:url" content="'+url+'"><meta property="og:type" content="website"><meta property="og:title" content="'+title+'"><meta property="og:description" content="'+description+'"><meta property="og:image" content="https://essentielpme.com/assets/img/og-cover.png">';
  extra+='<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':industry||rel==='sites-web.html'?'Service':'WebPage',name:title,description,url,provider:{'@type':'Organization',name:'Essentiel PME',url:'https://essentielpme.com/'}})+'</script>';
  if(industry){
   const integration=rel.startsWith('en/')?integrationEN:integrationFR;
   extra += [...head(integration).matchAll(/<(?:script|link)[^>]*(?:booking\/|industry-landing.mjs)[^>]*>(?:<\/script>)?/g)].map(m=>m[0]).join('');
   const dialog=match(integration,/<dialog class="lp-booking-dialog"[\s\S]*?<\/dialog>/);
   html=html.replace('</main>',dialog+'</main>');
   const subscribe=match(original,/<form[^>]*data-subscribe-form[\s\S]*?<\/form>/);
   if(subscribe){const msg=match(original,/<p data-subscribe-msg[\s\S]*?<\/p>/);html=html.replace('</main>','<section class="section-white section-pad"><div class="lp-container"><h2>'+(rel.startsWith('en/')?'Get updates from our blog':'Recevez les nouvelles de notre blogue')+'</h2>'+subscribe+msg+'</div></section></main>')}
   html=html.replace(/(<a class="lp-cta"[^>]*data-plan-name="[^"]*")/g,'$1 data-lp-book="forfait"');
   // Restore booking hooks for ad plans, without binding website offers to ad plan selection.
   html=html.replace(/<a class="lp-cta" href="(\/en\/contact\/|\/contact\/)">([^<]*(?:↗)?)/g,'<a class="lp-cta" href="$1" data-lp-book="page">$2');
   for(const name of ['Essentiel Performance','Essentiel Plus','Essentiel']){
    const old=match(original,new RegExp('<a class="lp-cta"[^>]*data-plan-name="'+name+'"[^>]*>[\\s\\S]*?<\\/a>'));
    const panel=name==='Essentiel'?'depart':name==='Essentiel Plus'?'croissance':'performance';
    if(old)html=html.replace(new RegExp('(<[^>]+id="panel-'+panel+'"[\\s\\S]*?)(<a class="lp-cta"[^>]*>[\\s\\S]*?<\\/a>)'),(_,before)=>before+old);
   }
  }
  // Base CSS supplies consent UI styling; approved design overrides remain later in the cascade.
  html=html.replace('<head>','<head><link rel="stylesheet" href="'+(['index.html','sites-web.html'].includes(rel)?'/assets/css/design-consent.css':'/assets/css/styles.css')+'">').replace('</head>',extra+'</head>').replace(/(<body[^>]*>)/,'$1'+noscript);
 }
 // Production shell has no preview submit handlers or demo styling.
 html=html.replaceAll('/assets/preview-shell.css"','/assets/preview-shell.css?v=20261104"');
 html=html.replace(/^[ \t]+$/gm,'');
 mkdirSync(dirname(target),{recursive:true});write(target,html);
}
const sitemap=join(out,'sitemap.xml');let xml=read(sitemap,'utf8');
for(const path of added)if(!xml.includes('<loc>https://essentielpme.com'+path+'</loc>'))xml=xml.replace('</urlset>','  <url><loc>https://essentielpme.com'+path+'</loc></url>\n</urlset>');
write(sitemap,xml);
write(join(out,'llms.txt'),read(join(out,'llms.txt'),'utf8')+'\n## Sites web WordPress\n- https://essentielpme.com/sites-web.html : forfaits 3 999 $, 6 499 $ et 11 499 $ CAD, taxes en sus.\n');
console.log('Approved design applied with production integrations preserved.');
