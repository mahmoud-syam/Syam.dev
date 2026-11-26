(function(){
var P={p1:['read logs','Allow',['s3:GetObject'],'logs-bucket/*'],p2:['admin *:*','Allow',['*'],'*'],p3:['deny deletes','Deny',['s3:DeleteObject'],'*'],p4:['read all S3','Allow',['s3:Get*'],'*']};
var REQ=[['r1','s3:GetObject','logs-bucket/app.log','logs',true],['r2','s3:DeleteObject','logs-bucket/app.log','logs',false],['r3','s3:GetObject','secrets-bucket/db.env','sec',false]];
function m(pat,v){if(pat=='*')return true;if(pat.slice(-1)=='*')return v.indexOf(pat.slice(0,-1))==0;return pat==v}
function ev(S,r){var on=Object.keys(P).filter(function(k){return S[k]});var d=on.filter(function(k){var p=P[k];return p[1]=='Deny'&&p[2].some(function(a){return m(a,r[1])})&&m(p[3],r[2])});if(d.length)return ['DENY','explicit deny ('+P[d[0]][0]+')'];
 var a=on.filter(function(k){var p=P[k];return p[1]=='Allow'&&p[2].some(function(x){return m(x,r[1])})&&m(p[3],r[2])});return a.length?['ALLOW','allowed by '+P[a[0]][0]]:['DENY','implicit deny (nothing allows it)']}
function good(S){return REQ.every(function(r){return (ev(S,r)[0]=='ALLOW')==r[4]})&&!S.p2}
function JSONP(k){var p=P[k];return [{t:'{ "Version": "2012-10-17",',tone:'gold'},'  "Statement": [{',{t:'    "Effect": "'+p[1]+'",',tone:p[1]=='Deny'?'red':'green'},'    "Action": '+JSON.stringify(p[2].length==1?p[2][0]:p[2])+',','    "Resource": "arn:aws:s3:::'+p[3]+'"','  }]','}']}
var EVAL=['How AWS decides',{t:'1 everything starts DENIED',tone:'gold'},{t:'2 an Allow that matches → allowed',tone:'green'},{t:'3 a Deny that matches → DENIED,',tone:'red'},{t:'  even if something else allows it',tone:'red'},'','explicit Deny > Allow > default deny'];
var ROLE=[{t:'Role: app-server-role',tone:'gold'},'trusted by:  ec2.amazonaws.com','permissions: read logs-bucket','',{t:'EC2 gets short-lived keys that rotate',tone:'green'},{t:'automatically. Nothing stored on disk.',tone:'green'},'',{t:'Never put access keys on a server.',tone:'red'}];
var BEST=['Account safety checklist',{t:'✓ root: MFA on, keys deleted, not used',tone:'green'},{t:'✓ people: SSO or users in groups + MFA',tone:'green'},{t:'✓ machines: roles, not access keys',tone:'green'},{t:'✓ least privilege: only what is needed',tone:'green'},{t:'✓ CloudTrail on: who did what',tone:'green'},{t:'✓ review unused permissions regularly',tone:'green'}];
function test(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;
 REQ.forEach(function(r,i){var e=ev(S,r),ok=e[0]=='ALLOW';L(200+i*700,function(){A.send(['alice','iam',r[3]],{label:r[1].split(':')[1].slice(0,3),tone:ok?'green':'red',ok:ok,denyAt:'iam'})})});
 L(2600,function(){S.ran=true;A.term('term',['$ # alice tries three requests'].concat(REQ.map(function(r){var e=ev(S,r);return (e[0]=='ALLOW'?'✓ ':'! ')+r[1].split(':')[1]+' '+r[2].split('/')[0]+': '+e[0]})).concat(REQ.map(function(r){return '  '+ev(S,r)[1]})),true);A.refresh()})}
LESSON('aws','iam',{
 title:'IAM: identities & policies',sub:'Control who can do what to which resource, and why an explicit deny always wins.',time:'15 min',level:'Beginner',
 S:{p1:false,p2:false,p3:false,p4:false,ran:false},
 legend:[['#3fa456','allowed'],['#e5534b','denied'],['#c8962e','identity']],
 hud:[{id:'n',l:'Policies on',v:function(S){return String(Object.keys(P).filter(function(k){return S[k]}).length)},lv:'none'},{id:'r1',l:'Read logs',v:function(S){return ev(S,REQ[0])[0]},lv:function(S){return ev(S,REQ[0])[0]=='ALLOW'?'good':'bad'}},{id:'r2',l:'Delete logs',v:function(S){return ev(S,REQ[1])[0]},lv:function(S){return ev(S,REQ[1])[0]=='DENY'?'good':'bad'}},{id:'r3',l:'Read secrets',v:function(S){return ev(S,REQ[2])[0]},lv:function(S){return ev(S,REQ[2])[0]=='DENY'?'good':'bad'}}],
 nodes:[
  {t:'crowd',id:'alice',x:66,y:70,tone:'gold',label:'alice (dev)',n:1,w:50,anchor:[118,70]},
  H.box('iam',196,150,'IAM','gold',{center:true,lock:true}),
  H.box('logs',322,60,'logs-bucket','green',{center:true}),
  H.box('sec',322,250,'secrets-bucket','red',{center:true}),
  H.tile('grp',74,280,'group: developers','attached policies','violet',{w:140}),
  H.tile('ec2',74,370,'EC2 role','no keys on disk','blue',{w:140}),
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'how AWS decides',rows:EVAL,fs:10},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'aws cli'}],
 links:[H.lk('alice','iam','gold'),H.lk('iam','logs','green'),H.lk('iam','sec','red'),H.lk('grp','iam','violet',{dash:true}),H.lk('ec2','iam','blue',{dash:true})],
 controls:{title:'Policies on group developers',groups:[{items:Object.keys(P).map(function(k){return {label:P[k][0],wide:true,on:function(S){return S[k]},click:function(S,A){S[k]=!S[k];S.ran=false;S.rid=(S.rid||0)+1;A.set('info',{title:P[k][0]+(S[k]?' (attached)':' (removed)'),rows:JSONP(k),hl:[2]});A.fx('grp','pulse');A.refresh()}}}).concat([{label:'test requests',wide:true,click:function(S,A){test(S,A)}}])}]},
 goal:function(S){var ok=S.ran&&good(S);if(ok)return [true,'Done. alice can read logs and nothing else: least privilege. Deletes and secrets fall to the default deny (or your explicit deny).'];
  if(S.ran&&S.p2)return [false,'admin *:* gives alice everything, even with a deny for deletes she can still read secrets. Remove it.'];return [false,'Goal: alice may read the logs bucket, but must not delete logs or read secrets. Attach policies, then test the three requests.']},
 learn:[['Know what IAM controls',0],['Use users and groups',1],['Read a policy',2],['Know how AWS evaluates',3],['Use roles for machines',4],['Apply least privilege',5],['Test who you are',6]],
 steps:[
  {t:'Who can do what',b:'IAM answers one question for every API call: is this identity allowed to do this action on this resource? Identities are people, groups and roles.',k:['problem','Watch out','The root user can do everything and cannot be limited. Turn on MFA, delete its keys and never use it day to day.'],pill:'setup',tt:'IAM',focus:['alice','iam','logs','sec'],S:{p1:false,p2:false,p3:false,p4:false,ran:false},
   set:{info:{title:'how AWS decides',rows:EVAL,hl:[]}},termClear:true,term:{term:['$ aws sts get-caller-identity','"Arn": "arn:aws:iam::1234:user/alice"']},
   once:[{path:['alice','iam'],label:'?',tone:'gold'}]},
  {t:'Users and groups',b:'Give people their own identity and put them in groups like developers or ops. Attach policies to the group, not to each person, so access stays consistent.',k:['tip','Remember','In larger companies people sign in through IAM Identity Center (SSO) instead of separate IAM users.'],pill:'idea',tt:'Groups',focus:['alice','grp','iam'],
   set:{info:{title:'account safety',rows:BEST,hl:[2]}},termClear:true,term:{term:['$ aws iam add-user-to-group \\','    --user-name alice --group-name developers']},
   once:[{path:['grp','iam'],label:'pol',tone:'violet'}]},
  {t:'Reading a policy',b:'A policy is JSON. Each statement has an Effect (Allow or Deny), the Actions it covers and the Resources it applies to, as ARNs.',k:['idea','Key idea','Read it as a sentence: Allow s3:GetObject on every object in logs-bucket.'],pill:'idea',tt:'Policy',focus:['iam','logs'],S:{p1:true},
   set:{info:{title:'read logs',rows:JSONP('p1'),hl:[2,3,4]}},termClear:true,term:{term:['$ aws iam list-attached-group-policies \\','    --group-name developers','"PolicyName": "read-logs"']}},
  {t:'How AWS evaluates',b:'Everything starts denied. A matching Allow opens the door. A matching Deny closes it again, no matter what else allows it.',k:['problem','Watch out','Deny always wins. Use explicit Deny for hard rules, like "nobody deletes backups".'],pill:'problem',tt:'Evaluate',focus:['alice','iam','logs','sec'],S:{p1:true,p3:true},
   set:{info:{title:'how AWS decides',rows:EVAL,hl:[1,2,3]}},termClear:true,term:{term:['✓ GetObject logs-bucket: ALLOW','! DeleteObject logs-bucket: DENY (explicit)','! GetObject secrets-bucket: DENY (implicit)']},
   once:[{path:['alice','iam','logs'],label:'Get',tone:'green'},{path:['alice','iam','logs'],label:'Del',tone:'red',ok:false,denyAt:'iam',delay:900},{path:['alice','iam','sec'],label:'Get',tone:'red',ok:false,denyAt:'iam',delay:1800}]},
  {t:'Roles for machines',b:'A role is an identity without a password or long-lived keys. EC2, Lambda or a CI pipeline assumes the role and receives temporary credentials that rotate on their own.',k:['idea','Key idea','Keys on a server get copied, leaked and forgotten. Roles expire by themselves.'],pill:'idea',tt:'Roles',focus:['ec2','iam','logs'],S:{p3:false},
   set:{info:{title:'roles',rows:ROLE,hl:[4,5,7]}},termClear:true,term:{term:['# on the EC2 instance:','$ aws sts get-caller-identity','"Arn": ".../assumed-role/app-server-role"']},
   once:[{path:['ec2','iam','logs'],label:'role',tone:'blue'}]},
  {t:'Least privilege',b:'Grant only the actions and resources a job really needs, and add more when asked. Admin access "just for now" is how small mistakes become big incidents.',k:['tip','Remember','IAM Access Analyzer can suggest a tight policy from what an identity actually used.'],pill:'idea',tt:'Least',focus:['alice','iam'],
   set:{info:{title:'account safety',rows:BEST,hl:[1,3,4]}},termClear:true,term:{term:['$ # review: who has AdministratorAccess?','$ aws iam list-entities-for-policy \\','    --policy-arn arn:aws:iam::aws:policy/\\','AdministratorAccess']}},
  {t:'Test before you trust',b:'aws sts get-caller-identity shows who you are right now. The IAM policy simulator, or a quick dry run, shows whether a call would be allowed.',k:['tip','Remember','AccessDenied errors name the action that failed. Read it, then add exactly that action.'],pill:'idea',tt:'Test',focus:['alice','iam'],
   set:{info:{title:'how AWS decides',rows:EVAL,hl:[]}},termClear:true,term:{term:['$ aws s3 rm s3://logs-bucket/app.log','! An error occurred (AccessDenied) when','! calling the DeleteObject operation']}},
  {t:'Try it: least privilege for alice',b:'alice should read the logs bucket, but not delete logs and not read secrets. Attach policies to her group, then test her three requests.',k:['tip','Challenge','Try admin *:* with deny deletes. Why can she still read secrets? Then find the smallest set that works.'],pill:'problem',tt:'Try it',S:{p1:false,p2:false,p3:false,p4:false,ran:false},goal:true,focus:null,
   set:{info:{title:'how AWS decides',rows:EVAL,hl:[]}},termClear:true,term:{term:['$ # group developers: no policies yet']}},
  {t:'Recap',b:'Identities get policies, policies say Allow or Deny for actions on resources, and explicit Deny beats everything. People use groups and MFA, machines use roles.',k:['idea','Next up','EC2, AMIs and EBS: your first virtual servers.'],pill:'recap',tt:'Recap',S:{p1:true,p2:false,p3:true,p4:false,ran:true},
   set:{info:{title:'account safety',rows:BEST,hl:[]}},termClear:true,term:{term:['# explicit Deny > Allow > default deny']}}
 ]});
})();
