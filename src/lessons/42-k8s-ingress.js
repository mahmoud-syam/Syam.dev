(function(){
var G=[['dns','DNS record → LB'],['host','host rule'],['path','path /api rule'],['tls','TLS via cert-manager']];
function T(S){return [['shop.example.com resolves',!!S.dns],['GET / → web',S.dns&&S.host],['GET /api → api',S.dns&&S.host&&S.path],['valid HTTPS certificate',S.dns&&S.host&&S.tls]]}
function n(S){return T(S).filter(function(t){return t[1]}).length}
var ING=[{t:'# ingress shop (simplified view)',tone:'gold'},'ingressClassName: nginx',function(S){return S.tls?{t:'tls: shop.example.com → secret shop-tls',tone:'green'}:{t:'tls: (none)',tone:'amber'}},'rules:',function(S){return S.host?{t:'- host: shop.example.com',tone:'green'}:{t:'- host: (missing)',tone:'red'}},function(S){return S.path?{t:'    /api  (Prefix) → service api:80',tone:'green'}:''},'    /     (Prefix) → service web:80','',function(S){return S.tls?{t:'annotation: cert-manager.io/cluster-issuer',tone:'green'}:''}];
var IV=[0,1,2,3,4,5,6,7,8].map(function(i){return function(S){var r=ING.map(function(f){return typeof f=='function'?f(S):f}).filter(function(x){return x!==''});return r[i]||''}});
var WHY=['Without Ingress',{t:'web   LoadBalancer  1 cloud LB',tone:'red'},{t:'api   LoadBalancer  1 cloud LB',tone:'red'},{t:'admin LoadBalancer  1 cloud LB',tone:'red'},'',{t:'With Ingress',tone:'green'},{t:'1 LB → controller → web, api, admin',tone:'green'},'routing by host name and URL path'];
var CTRL=['Ingress = rules, controller = engine',{t:'Ingress object   what should route where',tone:'gold'},{t:'controller       does the routing',tone:'gold'},'   ingress-nginx, Traefik,','   AWS Load Balancer Controller','',{t:'No controller installed = rules ignored.',tone:'red'},'Gateway API is the newer, richer successor.'];
var DNSV=['DNS → load balancer',{t:'shop.example.com  CNAME  a1b2.elb.amazonaws.com',tone:'gold'},'(Route 53: an alias record)','',{t:'external-dns can create these records',tone:'green'},{t:'automatically from your Ingress hosts.',tone:'green'},'','TTL decides how fast changes spread.'];
function vis(S,A){A.set('cert',{show:!!S.tls});A.set('code',{rows:IV});A.refresh()}
function test(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}var t=T(S);S.ran=false;
 A.send(['users','dns'],{label:'?',tone:t[0][1]?'green':'red',ok:t[0][1]});
 L(900,function(){if(t[0][1])A.send(['users','lb','web'],{label:'/',tone:t[1][1]?'green':'red',ok:t[1][1],denyAt:'lb'})});
 L(1800,function(){if(t[0][1])A.send(['users','lb','api'],{label:'/api',tone:t[2][1]?'green':'red',ok:t[2][1],denyAt:'lb'})});
 L(2800,function(){S.ran=true;S.score=n(S);A.term('term',['$ # testing https://shop.example.com'].concat(t.map(function(x){return (x[1]?'✓ ':'! ')+x[0]})).concat(!S.dns?['! curl: (6) Could not resolve host']:!S.host?['! 404 Not Found (no rule for this host)']:!S.path?['! /api → web: 404 from the frontend']:!S.tls?['! SSL: self-signed "Fake Certificate"']:[]),true);A.refresh()})}
LESSON('k8s','ingress',{
 title:'Ingress & DNS',sub:'One load balancer for many sites: route by host name and path, add HTTPS with cert-manager, point DNS at it.',time:'15 min',level:'Intermediate',
 S:{dns:false,host:false,path:false,tls:false,ran:false,score:0},
 legend:[['#3fa456','routed correctly'],['#e5534b','not routed'],['#c8962e','user traffic']],
 hud:[{id:'s',l:'Checks passing',v:function(S){return S.ran?S.score+' / 4':'—'},lv:function(S){return !S.ran?'none':S.score==4?'good':'bad'}},{id:'h',l:'Routes',v:function(S){return String((S.host?1:0)+(S.host&&S.path?1:0))},lv:'none'},{id:'t',l:'HTTPS',v:function(S){return S.tls?'valid':'none'},lv:function(S){return S.tls?'good':'warn'}},{id:'c',l:'Controller',v:'nginx',lv:'none'}],
 nodes:[
  {t:'crowd',id:'users',x:64,y:62,tone:'gold',label:'browser',n:1,w:46,anchor:[110,62]},
  H.tile('dns',70,186,'DNS','shop.example.com','violet',{w:138}),
  H.box('lb',230,30,'ingress controller','blue',{center:true}),
  H.tile('cert',330,170,'cert-manager','Let\'s Encrypt','green',{w:112,show:false}),
  H.tile('web',150,320,'service web','frontend','green',{w:120}),
  H.tile('api',300,320,'service api','backend','teal',{w:120}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:170,title:'ingress shop',rows:IV,fs:9.3},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('users','dns','violet',{dash:true}),H.lk('users','lb','gold',{on:function(S){return S.dns}}),H.lk('lb','web','green',{on:function(S){return S.host}}),H.lk('lb','api','teal',{on:function(S){return S.host&&S.path}}),H.lk('cert','lb','green',{dash:true,on:function(S){return S.tls}})],
 controls:{title:'Publish shop.example.com',groups:[{items:G.map(function(g){return {label:g[1],wide:true,on:function(S){return S[g[0]]},click:function(S,A){S[g[0]]=!S[g[0]];S.ran=false;S.rid=(S.rid||0)+1;vis(S,A)}}}).concat([{label:'test the site',wide:true,click:function(S,A){test(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&S.score==4;return [ok,ok?'Done. DNS points at the load balancer, the host rule picks the site, /api reaches the backend, and cert-manager serves a valid certificate.':'Goal: https://shop.example.com must load the frontend at / and the backend at /api, with a valid certificate. Test after each change.']},
 learn:[['Know why Ingress',0],['Know rules vs controller',1],['Route by host',2],['Route by path',3],['Add TLS with cert-manager',4],['Point DNS at the load balancer',5],['Know the Gateway API',6]],
 steps:[
  {t:'Many services, one door',b:'A LoadBalancer Service per app means one cloud load balancer, and one bill, each. Ingress puts many HTTP services behind a single load balancer.',k:['idea','Key idea','Ingress is for HTTP and HTTPS. It reads the host name and URL path to decide where a request goes.'],pill:'setup',tt:'Why',focus:['users','lb','web','api'],S:{dns:false,host:false,path:false,tls:false,ran:false,score:0},
   set:{cert:{show:false},code:{title:'why ingress',rows:WHY,hl:[1,2,3,6]}},termClear:true,term:{term:['$ kubectl get svc -A | grep -c LoadBalancer','3   # three load balancers, three bills']}},
  {t:'Rules and a controller',b:'An Ingress object is just a set of routing rules. An ingress controller, like ingress-nginx or the AWS Load Balancer Controller, reads them and does the actual routing.',k:['problem','Watch out','Without a controller in the cluster, an Ingress does nothing at all, and shows no error.'],pill:'idea',tt:'Controller',focus:['lb'],
   set:{code:{title:'rules vs controller',rows:CTRL,hl:[1,2,6]}},termClear:true,term:{term:['$ helm install ingress-nginx \\','    ingress-nginx/ingress-nginx -n ingress','$ kubectl get ingressclass','nginx   k8s.io/ingress-nginx']}},
  {t:'Host rules',b:'A host rule sends shop.example.com to one service and admin.example.com to another, all on the same IP. The browser sends the host name in every request.',k:['tip','Remember','A request for an unknown host gets the controller\'s default backend, usually a plain 404.'],pill:'idea',tt:'Host',focus:['lb','web'],S:{dns:true,host:true},
   set:{code:{title:'ingress shop',rows:IV,hl:[4]}},termClear:true,term:{term:['$ curl -s -H "Host: shop.example.com" \\','    http://a1b2.elb.amazonaws.com/ | head -1','<!doctype html>']},
   once:[{path:['users','lb','web'],label:'/',tone:'green'}]},
  {t:'Path rules',b:'Under one host, paths split traffic: /api goes to the backend service, everything else to the frontend. pathType Prefix matches /api and everything under it.',k:['problem','Watch out','Rules are matched by the longest path first. Put the specific /api rule in, and / catches the rest.'],pill:'idea',tt:'Path',focus:['lb','api','web'],S:{path:true},
   set:{code:{title:'ingress shop',rows:IV,hl:[5,6]}},termClear:true,term:{term:['$ curl -s https://shop.example.com/api/health','{"status":"ok"}']},
   once:[{path:['users','lb','api'],label:'/api',tone:'teal'}]},
  {t:'HTTPS with cert-manager',b:'cert-manager watches Ingress objects, asks Let\'s Encrypt for a certificate, stores it in a Secret and renews it before it expires. You add one annotation and a tls section.',k:['tip','Remember','Let\'s Encrypt certificates last 90 days. cert-manager renews them automatically around day 60.'],pill:'idea',tt:'TLS',focus:['cert','lb'],S:{tls:true},
   set:{cert:{show:true},code:{title:'ingress shop',rows:IV,hl:[2]}},termClear:true,term:{term:['$ kubectl get certificate -n shop','NAME      READY  SECRET','shop-tls  True   shop-tls']},
   once:[{path:['cert','lb'],label:'cert',tone:'green'}]},
  {t:'DNS points at the load balancer',b:'Finally, the name must resolve: a DNS record for shop.example.com pointing at the load balancer address. external-dns can create these records from your Ingress automatically.',k:['problem','Watch out','DNS changes are cached for the TTL. Lower the TTL a day before a migration.'],pill:'idea',tt:'DNS',focus:['users','dns','lb'],
   set:{code:{title:'DNS',rows:DNSV,hl:[1,4,5]}},termClear:true,term:{term:['$ dig +short shop.example.com','a1b2.elb.amazonaws.com.','52.48.11.7']},
   once:[{path:['users','dns'],label:'?',tone:'violet'}]},
  {t:'The Gateway API',b:'Ingress is simple but limited. The Gateway API is its successor, with separate roles for platform and app teams, and support for more protocols and traffic splitting.',k:['idea','Key idea','Learn Ingress first: it is everywhere. Expect new platforms to move to Gateway API.'],pill:'idea',tt:'Gateway',focus:['lb'],
   set:{code:{title:'rules vs controller',rows:CTRL,hl:[7]}},termClear:true,term:{term:['$ kubectl get gateway,httproute -A','No resources found']}},
  {t:'Try it: publish the shop',b:'The services exist, the controller is installed. Make https://shop.example.com work for both the frontend and the API, with a valid certificate.',k:['tip','Challenge','Test after each change and read the error: each one points at a different missing piece.'],pill:'problem',tt:'Try it',S:{dns:false,host:false,path:false,tls:false,ran:false,score:0},goal:true,focus:null,
   set:{cert:{show:false},code:{title:'ingress shop',rows:IV,hl:[]}},termClear:true,term:{term:['$ kubectl get svc -n shop','web  ClusterIP  10.96.14.20','api  ClusterIP  10.96.30.11']}},
  {t:'Recap',b:'An ingress controller behind one load balancer routes by host and path to your services. cert-manager handles HTTPS, and DNS points the name at the load balancer.',k:['idea','Next up','ConfigMaps and Secrets: configuration outside the image.'],pill:'recap',tt:'Recap',S:{dns:true,host:true,path:true,tls:true,ran:true,score:4},
   set:{cert:{show:true},code:{title:'ingress shop',rows:IV,hl:[]}},termClear:true,term:{term:['✓ DNS ✓ host ✓ /api ✓ HTTPS']}}
 ]});
})();
