LESSON('linux','users',{
 title:'Users, groups & sudo',sub:'Who you are, which groups you belong to, and when you can borrow root’s power.',time:'12 min',level:'Beginner',
 S:{devops:false,sudo:false},
 legend:[['#e0a526','write request'],['#e8834d','sudo request'],['#e5534b','denied']],
 hud:[{id:'uid',l:'Your UID',v:'1000',lv:'none'},{id:'grp',l:'Groups',v:function(S){return S.devops?'syam, devops':'syam'},lv:'none'},{id:'sudo',l:'sudo',v:function(S){return S.sudo?'yes':'no'},lv:function(S){return S.sudo?'good':'warn'}},{id:'acc',l:'Write /var/www',v:function(S){return S.devops?'allowed':'denied'},lv:function(S){return S.devops?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'syam',x:90,y:130,tone:'green',label:'syam',n:1,w:56},
  {t:'crowd',id:'sara',x:90,y:250,tone:'violet',label:'sara',n:1,w:56},
  {t:'crowd',id:'root',x:90,y:370,tone:'red',label:'root',n:1,w:56,crown:true},
  {t:'tile',id:'devops',x:300,y:70,w:118,h:46,tone:'violet',title:'devops',sub:'group · GID 1002'},
  {t:'tile',id:'sudo',x:290,y:330,w:110,h:46,tone:'orange',title:'sudo',sub:'group · GID 27'},
  {t:'box',id:'www',x:588,y:160,w:40,h:18,d:44,tone:'gold',base:true,lock:true,label:'/var/www',sub:'root:devops  rwxrwx---',nobob:true,ports:['green']},
  {t:'panel',id:'pw',x:430,y:18,w:272,h:104,title:'/etc/passwd',fs:9.5,rows:['root:x:0:0:root:/root:/bin/bash','syam:x:1000:1000::/home/syam:/bin/bash','sara:x:1001:1001::/home/sara:/bin/bash']},
  {t:'term',id:'term',x:380,y:326,w:322,h:126,title:'terminal'}
 ],
 links:[
  {id:'m1',a:'sara',b:'devops',tone:'violet'},{id:'m2',a:'sara',b:'sudo',tone:'orange'},
  {id:'m3',a:'syam',b:'devops',tone:'violet',on:function(S){return S.devops}},{id:'m4',a:'syam',b:'sudo',tone:'orange',on:function(S){return S.sudo}}
 ],
 controls:{title:'Group membership',groups:[{name:'syam in',items:[{label:'devops',wide:true,on:function(S){return S.devops},click:function(S){S.devops=!S.devops}},{label:'sudo',wide:true,on:function(S){return S.sudo},click:function(S){S.sudo=!S.sudo}}]}]},
 goal:function(S){return [S.devops,S.devops?'Done. syam is in devops, so the group permissions (rwx) apply — no root needed.':'Goal: let syam write to /var/www without using root. Which group does the folder belong to?']},
 learn:[['Know what a UID is',0],['Know why root is special',1],['Understand groups',3],['Use sudo safely',4],['Add a user to a group',6]],
 steps:[
  {t:'Everyone has an identity',b:'Linux tracks users by number, the UID. Names are just labels for humans. The list of users is the text file /etc/passwd.',k:['idea','Key idea','Your files, your processes and your permissions are all tied to your UID, not your name.'],pill:'setup',tt:'Identity',focus:['syam','sara','root','pw'],
   term:{term:['$ id','uid=1000(syam) gid=1000(syam)','groups=1000(syam)']},hud:{uid:{v:'1000',lv:'none'}},set:{pw:{hl:[1]}},fx:[{n:'syam',k:'pulse'}]},
  {t:'root: UID 0',b:'The user with UID 0 is root. It bypasses the normal permission checks: it can read, change or delete almost anything.',k:['problem','Watch out','Use root only when you must. One wrong command as root can wipe a whole system.'],pill:'problem',tt:'root',focus:['root','pw'],
   term:{term:['$ id root','uid=0(root) gid=0(root)']},hud:{uid:{v:'0',lv:'bad'}},set:{pw:{hl:[0]}},fx:[{n:'root',k:'no'}]},
  {t:'Groups: shared access',b:'A group is a named set of users. sara is in devops and sudo. syam is in neither, only in his own personal group.',k:['idea','Key idea','Instead of giving access to each person, give it to a group and put people in the group.'],pill:'idea',tt:'Groups',focus:['sara','syam','devops','sudo'],
   term:{term:['$ id sara','uid=1001(sara) gid=1001(sara)','groups=1001(sara),1002(devops),27(sudo)']},hud:{uid:{v:'1000',lv:'none'}},set:{pw:{hl:[2]}},
   once:[{path:['sara','devops'],label:'in',tone:'violet'},{path:['sara','sudo'],label:'in',tone:'orange'}]},
  {t:'Who can write /var/www?',b:'The folder belongs to group devops with permissions rwxrwx---. Members of devops can write. Everyone else gets nothing.',k:['tip','Watch','sara gets in through the devops group. syam is blocked: he is “everyone else”.'],pill:'tip',tt:'Access',focus:['sara','syam','www'],
   flows:[{path:['sara','www#0'],label:'w',tone:'amber',ok:true,log:'sara → write /var/www'},{path:['syam','www#0'],label:'w',tone:'amber',ok:function(S){return S.devops},log:'syam → write /var/www'}],
   term:{term:['$ touch /var/www/index.html','! touch: Permission denied']}},
  {t:'sudo: borrow root for one command',b:'sudo runs one command with root power, but only for users in the sudo group. Every use is logged.',k:['idea','Key idea','You act as root only for the command you type. (On RHEL and CentOS this group is called wheel.)'],pill:'idea',tt:'sudo',focus:['sara','syam','sudo','root'],
   flows:[{path:['sara','sudo','root'],label:'sudo',tone:'orange',ok:true,log:'sara → sudo'},{path:['syam','sudo','root'],label:'sudo',tone:'orange',ok:function(S){return S.sudo},denyAt:'sudo',log:'syam → sudo'}],
   term:{term:['$ sudo cat /etc/shadow','! syam is not in the sudoers file.']}},
  {t:'Add a user to a group',b:'An admin (sara, who has sudo) adds syam to devops. After that, syam gets the group’s permissions on /var/www. He must log in again for the new group to apply.',k:['problem','Watch out','Always use -aG. Without -a, usermod -G replaces ALL of the user’s groups.'],pill:'problem',tt:'Add user',S:{devops:true},focus:['sara','syam','devops','www'],
   term:{term:['$ sudo usermod -aG devops syam','$ id syam','uid=1000(syam) gid=1000(syam)','groups=1000(syam),1002(devops)']},
   flows:[{path:['syam','www#0'],label:'w',tone:'amber',ok:function(S){return S.devops},log:'syam → write /var/www'}]},
  {t:'Try it: control access',b:'Turn syam’s group membership on and off and watch the requests. Goal: syam can write /var/www without root.',k:['tip','Challenge','Then try the sudo group. What does it change, and what does it not change?'],pill:'problem',tt:'Try it',S:{devops:false,sudo:false},goal:true,termClear:true,
   term:{term:['$ id syam','uid=1000(syam) gid=1000(syam)','groups=1000(syam)']},
   flows:[{path:['syam','www#0'],label:'w',tone:'amber',ok:function(S){return S.devops},log:'syam → write /var/www'},{path:['syam','sudo','root'],label:'sudo',tone:'orange',ok:function(S){return S.sudo},denyAt:'sudo',log:'syam → sudo'}]},
  {t:'Where it is stored',b:'Users, groups and sudo rules are plain text files. Tools like usermod just edit them safely.',k:['idea','Key idea','/etc/passwd lists users, /etc/group lists groups, /etc/shadow keeps password hashes, /etc/sudoers says who may sudo.'],pill:'idea',tt:'Files',focus:['pw'],termClear:true,
   term:{term:['$ grep devops /etc/group','devops:x:1002:sara,syam']},set:{pw:{title:'/etc/group',rows:['root:x:0:','sudo:x:27:sara','devops:x:1002:sara,syam'],hl:[2]}}},
  {t:'Recap',b:'A user is a UID. Groups share access. root is UID 0 and ignores permissions. sudo lends root power for one command.',k:['idea','Next up','Processes: every command you run becomes a process, owned by a user.'],pill:'recap',tt:'Recap',termClear:true,
   term:{term:['$ id','uid=1000(syam) gid=1000(syam)','groups=1000(syam),1002(devops)']},set:{pw:{title:'/etc/passwd',rows:['root:x:0:0:root:/root:/bin/bash','syam:x:1000:1000::/home/syam:/bin/bash','sara:x:1001:1001::/home/sara:/bin/bash'],hl:[]}},S:{devops:true}}
 ]});
})();

(function(){
function P(id,x,y,title,pid,tone,status,extra){return Object.assign({t:'tile',id:id,x:x,y:y,w:112,h:44,tone:tone,title:title,sub:pid,status:status},extra||{})}
function cpu(S){return S.st=='run'&&S.hog?'97%':'4%'}
