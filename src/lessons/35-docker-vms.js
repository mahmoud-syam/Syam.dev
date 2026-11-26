(function(){
var MEM={vm:2.5,ct:0.6},BOOT={vm:'~45 s',ct:'~1 s'},CAP=16;
function used(S){return S.apps.reduce(function(a,k){return a+MEM[k]},0)}
var SLOT=[[52,190],[126,190],[200,190],[274,190],[348,190],[52,270],[126,270],[200,270],[274,270],[348,270]];
var CMP=['VM vs container',{t:'VM         own kernel + full OS',tone:'gold'},{t:'           ~2 GB, boots in ~45 s',tone:'gold'},{t:'container  shares the host kernel',tone:'green'},{t:'           ~50 MB overhead, ~1 s start',tone:'green'},'',{t:'VMs isolate more strongly.',tone:'amber'},{t:'Containers pack denser and start faster.',tone:'amber'}];
var NS=['How containers isolate',{t:'namespaces  what a process can SEE',tone:'gold'},'            own PIDs, network, mounts, hostname',{t:'cgroups     what it can USE',tone:'gold'},'            CPU and memory limits','',{t:'A container is a normal Linux process',tone:'green'},{t:'with these walls around it.',tone:'green'}];
var RUN=[{t:'docker run -d --name web -p 8080:80 nginx',tone:'gold'},'  -d        run in the background','  --name    a name instead of an id','  -p 8080:80  host port → container port','',{t:'docker ps · docker logs web',tone:'green'},{t:'docker exec -it web sh · docker stop web',tone:'green'}];
function SV(apps,extra){var o={};SLOT.forEach(function(p,i){var k=apps[i];o['s'+i]=k?{show:true,title:k=='vm'?'VM '+(i+1):'ctr '+(i+1),sub:k=='vm'?'OS + app':'app',tone:k=='vm'?'violet':'green'}:{show:false}});return Object.assign(o,extra||{})}
function vis(S,A){SLOT.forEach(function(p,i){var k=S.apps[i];A.set('s'+i,{show:!!k,title:k=='vm'?'VM '+(i+1):'ctr '+(i+1),sub:k=='vm'?'OS + app':'app',tone:k=='vm'?'violet':'green'})});A.set('host',{});A.refresh()}
function add(S,A,k){if(S.apps.length>=10){A.term('term',['# 10 apps running: the goal size'],true);return}if(used(S)+MEM[k]>CAP){A.fx('host','no');A.term('term',['! out of memory: '+used(S).toFixed(1)+' GB used,',"! a "+(k=='vm'?'VM':'container')+' needs '+MEM[k]+' GB more'],true);S.oom=true;return}
 S.apps.push(k);var i=S.apps.length-1;A.send(['host','s'+i],{label:k=='vm'?'VM':'ctr',tone:k=='vm'?'violet':'green',ok:true});
 A.term('term',[k=='vm'?'$ virt-install --name app'+(i+1)+' ... ':'$ docker run -d --name app'+(i+1)+' app:1.4','# ready in '+BOOT[k]+'   memory '+used(S).toFixed(1)+' / 16 GB'],true);vis(S,A)}
LESSON('docker','vms',{
 title:'Containers vs VMs',sub:'Why containers exist, how they differ from virtual machines, and your first docker run.',time:'13 min',level:'Beginner',
 S:{apps:[],oom:false},
 legend:[['#5a4aa8','virtual machine'],['#2f7d57','container'],['#e5534b','out of memory']],
 hud:[{id:'n',l:'Apps running',v:function(S){return S.apps.length+' / 10'},lv:function(S){return S.apps.length>=10?'good':'none'}},{id:'m',l:'Memory',v:function(S){return used(S).toFixed(1)+' / 16 GB'},lv:function(S){var u=used(S);return u>14?'bad':u>10?'warn':'good'}},{id:'v',l:'VMs',v:function(S){return String(S.apps.filter(function(k){return k=='vm'}).length)},lv:'none'},{id:'c',l:'Containers',v:function(S){return String(S.apps.filter(function(k){return k=='ct'}).length)},lv:'none'}],
 nodes:[H.box('host',200,34,'host · 16 GB RAM','slate',{center:true,led:true,sub:function(S){return used(S).toFixed(1)+' GB used'}})].concat(SLOT.map(function(p,i){return H.tile('s'+i,p[0],p[1],'app',' ','green',{w:68,h:40,fs:10,show:false})})).concat([
  H.tile('kern',200,360,'Linux kernel','shared by containers','gold',{w:160}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'VM vs container',rows:CMP,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}]),
 links:[H.lk('host','kern','gold',{dash:true})],
 controls:{title:'Run 10 copies of the app',groups:[{items:[
  {label:'add a VM',wide:true,click:function(S,A){add(S,A,'vm')}},
  {label:'add a container',wide:true,click:function(S,A){add(S,A,'ct')}},
  {label:'clear the host',wide:true,click:function(S,A){S.apps=[];S.oom=false;vis(S,A);A.term('term',['$ # host is empty'],true)}}]}]},
 goal:function(S){var ok=S.apps.length>=10;return [ok,ok?'Done. 10 copies in '+used(S).toFixed(1)+' GB. With VMs each copy carries a whole OS, so the host fills up after 6.':'Goal: run 10 copies of the app on this 16 GB host. Try VMs first and watch the memory.']},
 learn:[['Know why containers exist',0],['Know how VMs work',1],['Know how containers isolate',2],['Tell images from containers',3],['Use docker run, ps, logs, exec',4],['Weigh the trade-offs',5],['See containers as processes',6]],
 steps:[
  {t:'"Works on my machine"',b:'An app needs the right language version, libraries and settings. A container packs the app with all of that, so it runs the same on your laptop, in CI and in production.',k:['idea','Key idea','Ship the environment, not just the code.'],pill:'setup',tt:'Why',focus:['host'],S:{apps:[],oom:false},
   set:SV([],{info:{title:'VM vs container',rows:CMP,hl:[]}}),termClear:true,term:{term:['$ python3 app.py','! ModuleNotFoundError: No module','! named "flask"  (on the server only)']}},
  {t:'Virtual machines',b:'A hypervisor like Hyper-V or VMware splits one server into VMs. Each VM runs its own full operating system and kernel, which is strong isolation but heavy.',k:['tip','Remember','You already run VMs at work. Containers do not replace them, they usually run inside them.'],pill:'idea',tt:'VMs',focus:['host','s0','s1'],S:{apps:['vm','vm']},
   set:SV(['vm','vm'],{info:{rows:CMP,hl:[1,2]}}),termClear:true,term:{term:['# VM 1: Ubuntu kernel 6.8, 2 GB RAM','# VM 2: Ubuntu kernel 6.8, 2 GB RAM','# two kernels, two full OSes']},
   once:[{path:['host','s0'],label:'VM',tone:'violet'},{path:['host','s1'],label:'VM',tone:'violet',delay:500}]},
  {t:'Containers share the kernel',b:'Containers all use the host\'s kernel. Namespaces give each one its own view of processes, network and files, and cgroups limit how much CPU and memory it can use.',k:['idea','Key idea','No guest OS to boot means a container starts in about a second and costs megabytes, not gigabytes.'],pill:'idea',tt:'Isolation',focus:['kern','s0','s1','s2'],S:{apps:['ct','ct','ct']},
   set:SV(['ct','ct','ct'],{info:{title:'namespaces + cgroups',rows:NS,hl:[1,3]}}),termClear:true,term:{term:['$ docker run --memory 256m --cpus 0.5 app:1.4','$ docker exec app1 hostname','3f2a9c1e0b7d   # its own hostname']},
   once:[{path:['kern','s0'],label:'',tone:'gold'},{path:['kern','s1'],label:'',tone:'gold',delay:300},{path:['kern','s2'],label:'',tone:'gold',delay:600}]},
  {t:'Images and containers',b:'An image is a read-only template: the app plus everything it needs. A container is a running instance of an image. One image can start many containers.',k:['tip','Remember','Image = recipe, container = the dish. Delete the container and the image is still there.'],pill:'idea',tt:'Image',focus:['s0','s1','s2'],
   set:{info:{title:'docker run',rows:RUN,hl:[0]}},termClear:true,term:{term:['$ docker images','REPOSITORY  TAG   SIZE','app         1.4   148MB','$ docker ps --format "{{.Names}}"','app1','app2','app3']}},
  {t:'Your first docker run',b:'docker run pulls the image if needed and starts a container. -d runs it in the background, -p publishes a port, --name gives it a name you can use later.',k:['tip','Remember','docker logs shows its output, docker exec -it gets a shell inside, docker stop and rm clean up.'],pill:'idea',tt:'run',focus:['host','s0'],
   set:{info:{title:'docker run',rows:RUN,hl:[0,3,5,6]}},termClear:true,term:{term:['$ docker run -d --name web -p 8080:80 nginx','Unable to find image locally, pulling...','$ curl -sI localhost:8080 | head -1','HTTP/1.1 200 OK']},
   once:[{path:['host','s0'],label:'run',tone:'green'}]},
  {t:'Trade-offs',b:'Containers pack densely and start fast. VMs isolate better, because a kernel bug affects every container on the host. Most production setups run containers inside VMs.',k:['problem','Watch out','A Linux container needs a Linux kernel. On Windows or Mac, Docker Desktop runs a small Linux VM for you.'],pill:'problem',tt:'Trade-offs',focus:['host','kern'],
   set:{info:{title:'VM vs container',rows:CMP,hl:[6,7]}},termClear:true,term:{term:['$ docker info | grep -i "kernel version"','Kernel Version: 6.8.0-45-generic']}},
  {t:'Containers are processes',b:'From the host, a container is just a process with walls around it. You can see it with ps. That is why containers are so light.',k:['idea','Key idea','Everything from the Linux lessons applies: signals, logs, limits. Containers are Linux, not magic.'],pill:'idea',tt:'Processes',focus:['kern','s0'],
   set:{info:{title:'namespaces + cgroups',rows:NS,hl:[6,7]}},termClear:true,term:{term:['$ docker top web','PID    USER  CMD','24118  root  nginx: master process','$ ps -p 24118 -o comm=','nginx']}},
  {t:'Try it: pack the host',b:'You need 10 copies of the app on one 16 GB server. Add VMs or containers and watch memory and start time.',k:['tip','Challenge','Fill the host with VMs first. How many fit? Then clear it and use containers.'],pill:'problem',tt:'Try it',S:{apps:[],oom:false},goal:true,focus:null,
   set:SV([],{info:{title:'VM vs container',rows:CMP,hl:[]}}),termClear:true,term:{term:['$ free -g | head -2','       total   used   free','Mem:      16      0     16']}},
  {t:'Recap',b:'VMs virtualize hardware and run full OSes. Containers share the kernel and isolate with namespaces and cgroups. Images are templates, containers are running copies.',k:['idea','Next up','Images and the Dockerfile: build your own image the right way.'],pill:'recap',tt:'Recap',S:{apps:['ct','ct','ct','ct','ct','ct','ct','ct','ct','ct'],oom:false},
   set:SV(['ct','ct','ct','ct','ct','ct','ct','ct','ct','ct'],{info:{title:'VM vs container',rows:CMP,hl:[]}}),termClear:true,term:{term:['$ docker ps -q | wc -l','10']}}
 ]});
})();
