(function(){
// CEH: footprinting and reconnaissance (passive vs active).
var AS=['www','mail','vpn','dev'];
function cnt(S){return AS.filter(function(k){return S.f[k]}).length}
var IP={www:'203.0.113.10',mail:'203.0.113.25',vpn:'203.0.113.20',dev:'203.0.113.30'};
var PANEL=['Attack surface: acme.example'].concat(AS.map(function(k){return function(S){return S.f[k]?{t:'✓ '+(k+'.acme.example').padEnd(19)+IP[k],tone:k=='dev'?'red':'green'}:{t:'· ?',tone:'slate'}}})).concat(['',function(S){return {t:'Name servers: '+(S.ns?'ns1, ns2':'unknown'),tone:S.ns?'amber':'slate'}}]);
function show(f){var o={};AS.forEach(function(k){o[k]={show:!!f[k]}});return o}
function found(S,A,keys){keys.forEach(function(k){if(!S.f[k]){S.f[k]=1;A.set(k,{show:true});A.fx(k,'pulse')}});A.set('surf',{rows:PANEL});A.hud({found:{v:cnt(S)+' / 4',lv:cnt(S)==4?'good':'warn'}});A.refresh()}
function mode(A,active){A.hud({mode:{v:active?'active':'passive',lv:active?'warn':'good'},touch:{v:active?'yes':'no',lv:active?'warn':'good'}})}
LESSON('ceh','recon',{
 title:'Footprinting & reconnaissance',sub:'Map a target from public sources first: whois, DNS, certificate logs and search engines.',time:'15 min',level:'Beginner',
 S:{f:{},ns:false,axfr:true},
 legend:[['#5a4aa8','passive source'],['#c8962e','active (touches target)'],['#d23a2e','sensitive find']],
 hud:[{id:'found',l:'Hosts found',v:'0 / 4',lv:'none'},{id:'mode',l:'Recon',v:'passive',lv:'good'},{id:'touch',l:'Touches target',v:'no',lv:'good'},{id:'last',l:'Source',v:'—',lv:'none'}],
 nodes:[
  {t:'crowd',id:'you',x:62,y:200,tone:'gold',label:'you',n:1,w:52,anchor:[114,200]},
  H.tile('whois',176,40,'whois','registry','violet',{w:104}),
  H.tile('crt',176,118,'cert logs','crt.sh','violet',{w:104}),
  H.tile('search',176,196,'search','dorks, OSINT','violet',{w:104}),
  H.tile('ns',176,330,'ns1','target DNS','amber',{w:104,status:'run'}),
  H.box('www',322,40,'www','green',{center:true,w:28,h:14,d:24,show:false}),
  H.box('mail',322,138,'mail','green',{center:true,w:28,h:14,d:24,show:false}),
  H.box('vpn',322,236,'vpn','green',{center:true,w:28,h:14,d:24,show:false}),
  H.box('dev',322,334,'dev','red',{center:true,w:28,h:14,d:24,show:false}),
  {t:'panel',id:'surf',x:392,y:14,w:316,h:170,title:'recon notes',rows:PANEL,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'kali terminal'}],
 links:[H.lk('you','whois','violet',{dash:true}),H.lk('you','crt','violet',{dash:true}),H.lk('you','search','violet',{dash:true}),H.lk('you','ns','gold')],
 controls:{title:'Map acme.example',groups:[{items:[
  {label:'whois',wide:true,click:function(S,A){mode(A,false);A.send(['you','whois'],{label:'?',tone:'violet',ok:true});A.term('term',['$ whois acme.example | grep -i server','Name Server: NS1.ACME.EXAMPLE','Name Server: NS2.ACME.EXAMPLE']);S.ns=true;A.hud({last:{v:'whois',lv:'none'}});A.set('surf',{rows:PANEL});A.refresh()}},
  {label:'dig MX',wide:true,click:function(S,A){mode(A,false);A.send(['you','search'],{label:'MX',tone:'violet',ok:true});A.term('term',['$ dig +short MX acme.example','10 mail.acme.example.']);A.hud({last:{v:'DNS',lv:'none'}});found(S,A,['mail'])}},
  {label:'subfinder',wide:true,click:function(S,A){mode(A,false);A.send(['you','crt'],{label:'CT',tone:'violet',ok:true});A.term('term',['$ subfinder -d acme.example -silent','www.acme.example','vpn.acme.example']);A.hud({last:{v:'cert logs',lv:'none'}});found(S,A,['www','vpn'])}},
  {label:'dig axfr',wide:true,click:function(S,A){mode(A,true);A.hud({last:{v:'zone xfer',lv:'warn'}});
   if(!S.ns){A.fx('ns','no');A.term('term',['$ dig axfr acme.example @?','! which name server? run whois first']);return}
   A.send(['you','ns'],{label:'AXFR',tone:'gold',ok:true});A.term('term',['$ dig axfr acme.example @ns1.acme.example','www.acme.example.  300 IN A 203.0.113.10','vpn.acme.example.  300 IN A 203.0.113.20','dev.acme.example.  300 IN A 203.0.113.30','mail.acme.example. 300 IN A 203.0.113.25']);found(S,A,['www','vpn','dev','mail'])}}]}]},
 goal:function(S){var ok=cnt(S)==4;return [ok,ok?'Done. All four hosts mapped, and the zone transfer leaked dev, a host nobody meant to publish.':'Goal: find all 4 hosts of acme.example. Passive sources give you some. A zone transfer needs the name server, so find that first.']},
 learn:[['Tell passive from active recon',0],['Read whois data',1],['Pull NS, MX and TXT records',2],['Find subdomains in certificate logs',3],['Use search engines and OSINT',4],['Try a zone transfer',5],['Shrink your own footprint',6]],
 steps:[
  {t:'Footprinting: map before you touch',b:'Footprinting builds a picture of the target: domains, hosts, IP ranges, email format, people and technologies. Passive recon reads public sources and never touches the target.',k:['idea','Key idea','Passive is invisible to the target. Active recon (DNS queries to their server, scans) can be logged.'],pill:'setup',tt:'Footprint',focus:['you','whois','crt','search'],S:{f:{},ns:false},
   set:Object.assign(show({}),{surf:{rows:['Passive  (target cannot see you)',{t:'  whois, public DNS, cert logs',tone:'violet'},{t:'  search engines, job ads, LinkedIn',tone:'violet'},'Active   (target may log you)',{t:'  zone transfer, ping, port scans',tone:'amber'},'','Start passive, go active in scope.'],hl:[]}}),
   hud:{found:{v:'0 / 4',lv:'none'},mode:{v:'passive',lv:'good'},touch:{v:'no',lv:'good'},last:{v:'—',lv:'none'}},termClear:true,term:{term:['$ # target: acme.example (in scope)','$ mkdir recon && cd recon']},
   flows:[{path:['you','whois'],label:'?',tone:'violet'},{path:['you','crt'],label:'?',tone:'violet'}]},
  {t:'whois: who owns the domain',b:'whois asks the domain registry. You get the registrar, dates, name servers and sometimes the owner. Name servers are useful later: they hold the full DNS zone.',k:['tip','Remember','Most owners use privacy protection, so contact details are hidden. Name servers and dates are still public.'],pill:'idea',tt:'whois',focus:['you','whois'],S:{f:{},ns:true},
   set:Object.assign(show({}),{surf:{rows:PANEL}}),hud:{last:{v:'whois',lv:'none'}},termClear:true,term:{term:['$ whois acme.example','Registrar: Example Registrar, Inc.','Creation Date: 2014-03-02T10:21:00Z','Name Server: NS1.ACME.EXAMPLE','Name Server: NS2.ACME.EXAMPLE','Registrant: REDACTED FOR PRIVACY']},
   once:[{path:['you','whois'],label:'?',tone:'violet'},{path:['whois','you'],label:'NS',tone:'violet',delay:1200}]},
  {t:'DNS records tell a story',b:'Public DNS answers anyone. MX shows the mail server, NS the name servers, and TXT often reveals services: an SPF record can tell you which email provider they use.',k:['idea','Key idea','include:_spf.google.com means Google Workspace. Now you know what a phishing login page would imitate.'],pill:'idea',tt:'DNS',focus:['you','search','mail'],S:{f:{mail:1},ns:true},
   set:Object.assign(show({mail:1}),{surf:{rows:PANEL}}),hud:{found:{v:'1 / 4',lv:'warn'},last:{v:'DNS',lv:'none'}},termClear:true,term:{term:['$ dig +short NS acme.example','ns1.acme.example.','$ dig +short MX acme.example','10 mail.acme.example.','$ dig +short TXT acme.example','"v=spf1 include:_spf.google.com ~all"']},
   fx:[{n:'mail',k:'pulse'}]},
  {t:'Subdomains from certificate logs',b:'Every public TLS certificate is written to Certificate Transparency logs. Searching them (crt.sh, or tools like subfinder) lists subdomains the company never linked anywhere.',k:['tip','Remember','vpn. and remote. hosts are gold: they are login pages facing the internet.'],pill:'idea',tt:'CT logs',focus:['you','crt','www','vpn'],S:{f:{mail:1,www:1,vpn:1},ns:true},
   set:Object.assign(show({mail:1,www:1,vpn:1}),{surf:{rows:PANEL}}),hud:{found:{v:'3 / 4',lv:'warn'},last:{v:'cert logs',lv:'none'}},termClear:true,term:{term:['$ subfinder -d acme.example -silent','www.acme.example','vpn.acme.example','mail.acme.example']},
   once:[{path:['you','crt'],label:'CT',tone:'violet'}],fx:[{n:'vpn',k:'pulse'}]},
  {t:'Search engines and OSINT',b:'Search operators find forgotten files and pages. theHarvester collects emails and hosts from public sources. Employee names give you the email format for phishing tests.',k:['problem','Watch out','A PDF on the website can leak user names and software versions in its metadata.'],pill:'idea',tt:'OSINT',focus:['you','search'],S:{f:{mail:1,www:1,vpn:1},ns:true},
   set:Object.assign(show({mail:1,www:1,vpn:1}),{surf:{rows:['Useful search operators',{t:'site:acme.example filetype:pdf',tone:'violet'},{t:'site:acme.example inurl:login',tone:'violet'},{t:'"@acme.example" -site:acme.example',tone:'violet'},'','Email format found:',{t:'first.last@acme.example',tone:'amber'}],hl:[]}}),
   hud:{last:{v:'OSINT',lv:'none'}},termClear:true,term:{term:['$ theHarvester -d acme.example -b crtsh','[*] Hosts found: 3','[*] Emails found: 2','sara.ali@acme.example','omar.hassan@acme.example']},
   flows:[{path:['you','search'],label:'q',tone:'violet'}]},
  {t:'Active: the zone transfer',b:'A zone transfer (AXFR) copies the whole DNS zone from one server to another. If the name server allows it to anyone, you get every host name in one request.',k:['problem','Watch out','This is active recon: your IP lands in their DNS logs. Only inside the agreed scope.'],pill:'problem',tt:'AXFR',focus:['you','ns','dev'],S:{f:{mail:1,www:1,vpn:1,dev:1},ns:true},
   set:Object.assign(show({mail:1,www:1,vpn:1,dev:1}),{surf:{rows:PANEL}}),hud:{found:{v:'4 / 4',lv:'good'},mode:{v:'active',lv:'warn'},touch:{v:'yes',lv:'warn'},last:{v:'zone xfer',lv:'warn'}},termClear:true,term:{term:['$ dig axfr acme.example @ns1.acme.example','www.acme.example.  300 IN A 203.0.113.10','vpn.acme.example.  300 IN A 203.0.113.20','dev.acme.example.  300 IN A 203.0.113.30','mail.acme.example. 300 IN A 203.0.113.25']},
   once:[{path:['you','ns'],label:'AXFR',tone:'gold'},{path:['ns','you'],label:'zone',tone:'red',delay:1300}],fx:[{n:'dev',k:'pulse'}]},
  {t:'Defend: shrink your footprint',b:'Blue teams do the same recon on themselves. Allow zone transfers only to your own secondary servers, remove old DNS records, watch the cert logs and clean file metadata.',k:['idea','Key idea','Run this recon on your own company every quarter. Anything you find, an attacker finds too.'],pill:'idea',tt:'Defend',focus:['ns'],S:{f:{mail:1,www:1,vpn:1},ns:true},
   set:Object.assign(show({mail:1,www:1,vpn:1}),{surf:{rows:['Reduce what recon can find',{t:'✓ AXFR only to own secondaries',tone:'green'},{t:'✓ delete stale DNS records',tone:'green'},{t:'✓ alert on new certs (CT monitor)',tone:'green'},{t:'✓ strip PDF/Office metadata',tone:'green'},{t:'✓ whois privacy on',tone:'green'}],hl:[]}}),
   hud:{found:{v:'3 / 4',lv:'warn'},mode:{v:'active',lv:'warn'},touch:{v:'yes',lv:'warn'},last:{v:'zone xfer',lv:'none'}},termClear:true,term:{term:['$ grep allow-transfer named.conf.options','    allow-transfer { none; };','$ dig axfr acme.example @ns1.acme.example','; Transfer failed.']},
   fx:[{n:'ns',k:'ok'}]},
  {t:'Try it: map the attack surface',b:'Find all four hosts of acme.example. Start with passive sources, then use the active technique for what is left.',k:['tip','Challenge','dig axfr needs a name server after the @. Which source tells you the name servers?'],pill:'problem',tt:'Try it',S:{f:{},ns:false,axfr:true},goal:true,focus:['you','whois','crt','search','ns'],
   set:Object.assign(show({}),{surf:{rows:PANEL}}),hud:{found:{v:'0 / 4',lv:'none'},mode:{v:'passive',lv:'good'},touch:{v:'no',lv:'good'},last:{v:'—',lv:'none'}},termClear:true,term:{term:['$ # map acme.example']}},
  {t:'Recap',b:'Start passive: whois, DNS, certificate logs, search engines. Go active only in scope. Every host you find is a door to test, and a door the owner must know about.',k:['idea','Next up','Scanning with Nmap: which hosts are up, which ports are open and what runs behind them.'],pill:'recap',tt:'Recap',S:{f:{mail:1,www:1,vpn:1,dev:1},ns:true},
   set:Object.assign(show({mail:1,www:1,vpn:1,dev:1}),{surf:{rows:PANEL}}),hud:{found:{v:'4 / 4',lv:'good'},mode:{v:'passive',lv:'good'},touch:{v:'no',lv:'good'},last:{v:'—',lv:'none'}},termClear:true,term:{term:['$ whois · dig · subfinder','$ theHarvester · dig axfr']}}
 ]});
})();
