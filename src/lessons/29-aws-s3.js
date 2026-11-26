(function(){
var OBJ=['s3://reports-bucket/',{t:'  2026/11/report.csv      18 KB',tone:'gold'},{t:'  2026/11/summary.pdf    240 KB',tone:'gold'},'  backups/db-2026-11-26.sql.gz','','A bucket holds objects. A key like','"2026/11/report.csv" only looks like a folder.'];
var CLS=['Storage classes (cheapest last)',{t:'Standard        hot data, ms access',tone:'gold'},{t:'Standard-IA     rarely read, still fast',tone:'gold'},{t:'Glacier Instant archive, ms access',tone:'gold'},{t:'Glacier Deep    archive, hours to read',tone:'gold'},'',{t:'Lifecycle: IA after 30 days,',tone:'green'},{t:'Glacier after 90, delete after 365',tone:'green'}];
var SEC=['Keep buckets private',{t:'✓ Block Public Access: ON (default)',tone:'green'},{t:'✓ encryption at rest: on by default',tone:'green'},{t:'✓ access via IAM roles and policies',tone:'green'},{t:'✓ share one file: presigned URL',tone:'green'},'',{t:'Public buckets are a classic data leak.',tone:'red'}];
function vlist(S){return S.vers.map(function(v,i){return {t:(i==S.vers.length-1&&!S.del?'* ':'  ')+v+(i==S.vers.length-1&&!S.del?'  (latest)':''),tone:i==S.vers.length-1&&!S.del?'green':undefined}}).concat(S.del?[{t:'* delete marker  (latest)',tone:'red'}]:[]).concat(S.ver?[]:[{t:'versioning: OFF',tone:'amber'}])}
var VL=[0,1,2,3,4,5].map(function(i){return function(S){return vlist(S)[i]||''}});
function vis(S,A){var n=S.vers.length;A.set('v1',{show:n>=1&&(S.ver||n==1),title:n?S.vers[0]:'',status:!S.del&&n==1?'run':'none'});A.set('v2',{show:n>=2,title:S.vers[1]||'',status:!S.del&&n==2?'run':'none'});A.set('v3',{show:n>=3,title:S.vers[2]||'',status:!S.del&&n==3?'run':'none'});A.set('dm',{show:!!S.del});A.set('info',{title:'report.csv versions',rows:VL});A.refresh()}
function act(S,A,a){
 if(a=='ver'){if(S.ver){A.term('term',['# versioning is already on'],true);return}S.ver=true;A.fx('bucket','ok');A.term('term',['$ aws s3api put-bucket-versioning \\','    --bucket reports-bucket \\','    --versioning-configuration Status=Enabled'],true)}
 if(a=='up'){if(S.gone){S.gone=false}var name='v'+(S.cnt+1)+' · '+['Nov 24','Nov 25','Nov 26','Nov 27'][Math.min(S.cnt,3)];S.cnt++;if(S.ver)S.vers.push(name);else S.vers=[name];if(S.vers.length>3)S.vers.shift();S.del=false;A.send(['you','bucket'],{label:'PUT',tone:'blue',ok:true});
  A.term('term',['$ aws s3 cp report.csv s3://reports-bucket/','upload: ./report.csv',S.ver?'# new version stored, old ones kept':'# old copy overwritten for good'],true)}
 if(a=='del'){if(!S.vers.length||S.del||S.gone){A.term('term',['! nothing to delete'],true);return}A.send(['you','bucket'],{label:'DEL',tone:'red',ok:true});if(S.ver){S.del=true;A.term('term',['$ aws s3 rm s3://reports-bucket/report.csv','delete: report.csv','# only a delete marker was added'],true)}else{S.vers=[];S.gone=true;A.term('term',['$ aws s3 rm s3://reports-bucket/report.csv','delete: report.csv','! versioning off: the object is gone'],true)}}
 if(a=='res'){if(S.del){S.del=false;S.restored=true;A.send(['bucket','you'],{label:'GET',tone:'green',ok:true});A.term('term',['$ aws s3api delete-object --bucket \\','    reports-bucket --key report.csv \\','    --version-id <delete-marker-id>','# marker removed: '+S.vers[S.vers.length-1]+' is back'],true)}
  else if(S.gone){A.send(['bucket','you'],{label:'?',tone:'red',ok:false});A.term('term',['$ aws s3api list-object-versions ...','{"Versions": []}','! no versions: versioning was off'],true)}
  else A.term('term',['# nothing was deleted, nothing to restore'],true)}
 vis(S,A)}
LESSON('aws','s3',{
 title:'S3: object storage',sub:'Store files as objects in buckets, choose the right storage class, keep versions and keep it private.',time:'14 min',level:'Beginner',
 S:{ver:false,vers:[],cnt:0,del:false,gone:false,restored:false},
 legend:[['#3fa456','current version'],['#e5534b','delete marker'],['#bdb4a8','older version']],
 hud:[{id:'v',l:'Versioning',v:function(S){return S.ver?'on':'off'},lv:function(S){return S.ver?'good':'warn'}},{id:'n',l:'Versions kept',v:function(S){return String(S.vers.length)},lv:'none'},{id:'o',l:'report.csv',v:function(S){return S.gone?'GONE':S.del?'deleted':S.vers.length?'present':'—'},lv:function(S){return S.gone?'bad':S.del?'warn':S.vers.length?'good':'none'}},{id:'p',l:'Public access',v:'blocked',lv:'good'}],
 nodes:[
  {t:'crowd',id:'you',x:66,y:70,tone:'gold',label:'you',n:1,w:48,anchor:[114,70]},
  H.box('bucket',224,40,'reports-bucket','amber',{center:true}),
  H.tile('v1',92,206,'v1','report.csv','slate',{w:118,show:false,status:'none'}),
  H.tile('v2',212,206,'v2','report.csv','slate',{w:118,show:false,status:'none'}),
  H.tile('v3',332,206,'v3','report.csv','slate',{w:118,show:false,status:'none'}),
  H.tile('dm',212,290,'delete marker','hides latest','red',{w:126,show:false}),
  H.tile('gl',92,372,'Glacier','after 90 days','blue',{w:118}),
  {t:'crowd',id:'net',x:310,y:390,tone:'red',label:'internet',n:2,w:50,anchor:[300,370]},
  {t:'panel',id:'info',x:392,y:14,w:316,h:170,title:'objects',rows:OBJ,fs:9.5},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'aws cli'}],
 links:[H.lk('you','bucket','gold'),H.lk('bucket','v1','slate',{dash:true}),H.lk('bucket','v2','slate',{dash:true}),H.lk('bucket','v3','slate',{dash:true}),H.lk('bucket','gl','blue',{dash:true})],
 controls:{title:'report.csv in reports-bucket',groups:[{items:[['ver','enable versioning'],['up','upload report.csv'],['del','delete report.csv'],['res','restore it']].map(function(g){return {label:g[1],wide:true,on:g[0]=='ver'?function(S){return S.ver}:undefined,click:function(S,A){act(S,A,g[0])}}})}]},
 goal:function(S){if(S.restored)return [true,'Done. Versioning turned the delete into a hidden marker, so removing the marker brought report.csv back.'];if(S.gone)return [false,'report.csv is gone for good: versioning was off. Enable versioning, then upload, delete and restore again.'];return [false,'Goal: survive an accidental delete. Upload report.csv a few times, delete it, then get it back.']},
 learn:[['Know buckets, objects and keys',0],['Upload and sync files',1],['Pick a storage class',2],['Use versioning',3],['Keep buckets private',4],['Save money with lifecycle',5],['Share with presigned URLs',6]],
 steps:[
  {t:'Buckets and objects',b:'S3 stores objects (any file plus metadata) in buckets. Each object has a key, its full name. The slashes in a key look like folders, but S3 is flat.',k:['idea','Key idea','S3 is built for 99.999999999% durability: your object is copied across several AZs automatically.'],pill:'setup',tt:'Objects',focus:['bucket','you'],S:{ver:false,vers:[],cnt:0,del:false,gone:false,restored:false},
   set:{v1:{show:false},v2:{show:false},v3:{show:false},dm:{show:false},info:{title:'objects',rows:OBJ,hl:[1]}},termClear:true,term:{term:['$ aws s3 mb s3://reports-bucket','make_bucket: reports-bucket','$ aws s3 ls s3://reports-bucket/2026/11/','  18432 report.csv']}},
  {t:'Upload, download, sync',b:'aws s3 cp copies one file, aws s3 sync copies only what changed in a whole folder. Bucket names are global: nobody else in the world can use yours.',k:['tip','Remember','aws s3 sync ./site s3://bucket --delete mirrors a folder, including deletions. Check with --dryrun first.'],pill:'idea',tt:'Sync',focus:['you','bucket'],
   set:{info:{rows:OBJ,hl:[1,2,3]}},termClear:true,term:{term:['$ aws s3 sync ./reports s3://reports-bucket/ \\','    --dryrun','(dryrun) upload: report.csv','$ aws s3 cp s3://reports-bucket/report.csv .']},
   once:[{path:['you','bucket'],label:'PUT',tone:'blue'},{path:['bucket','you'],label:'GET',tone:'green',delay:1000}]},
  {t:'Storage classes',b:'Pay less for data you rarely read. Standard for hot data, Infrequent Access for monthly reads, Glacier tiers for archives. Reading from Deep Archive takes hours.',k:['problem','Watch out','Cheaper classes charge per read and have a minimum storage time. Moving hot data there costs more, not less.'],pill:'idea',tt:'Classes',focus:['bucket','gl'],
   set:{info:{title:'storage classes',rows:CLS,hl:[1,2,4]}},termClear:true,term:{term:['$ aws s3 cp db.sql.gz s3://reports-bucket/ \\','    --storage-class GLACIER_IR']},
   once:[{path:['bucket','gl'],label:'90d',tone:'blue'}]},
  {t:'Versioning',b:'With versioning on, every overwrite keeps the old version and a delete only adds a delete marker. Accidents and ransomware become recoverable.',k:['tip','Remember','Pair versioning with a lifecycle rule that deletes old versions after N days, or storage keeps growing.'],pill:'idea',tt:'Versions',focus:['bucket','v1','v2','dm'],S:{ver:true,vers:['v1 · Nov 24','v2 · Nov 25'],cnt:2,del:true},
   set:{v1:{show:true,title:'v1 · Nov 24',status:'none'},v2:{show:true,title:'v2 · Nov 25',status:'none'},dm:{show:true},info:{title:'report.csv versions',rows:VL,hl:[2]}},termClear:true,term:{term:['$ aws s3api list-object-versions \\','    --bucket reports-bucket --prefix report','v2  IsLatest: false','v1  IsLatest: false','DeleteMarker  IsLatest: true']}},
  {t:'Keep it private',b:'New buckets block public access by default and encrypt data at rest. Give access through IAM roles and bucket policies, never by making the bucket public.',k:['problem','Watch out','Most S3 data leaks are a bucket someone made public "just for a minute".'],pill:'problem',tt:'Security',focus:['bucket','net'],S:{del:false},
   set:{dm:{show:false},info:{title:'security',rows:SEC,hl:[1,2,6]}},termClear:true,term:{term:['$ curl -sI https://reports-bucket.s3.\\','amazonaws.com/report.csv | head -1','HTTP/1.1 403 Forbidden']},
   once:[{path:['net','bucket'],label:'GET',tone:'red',ok:false,denyAt:'bucket'}]},
  {t:'Lifecycle rules',b:'A lifecycle rule moves or deletes objects automatically by age: to IA after 30 days, to Glacier after 90, gone after a year, and old versions cleaned up after 30 days.',k:['idea','Key idea','Lifecycle rules are the easiest S3 cost savings: set them once, they work forever.'],pill:'idea',tt:'Lifecycle',focus:['bucket','gl'],
   set:{info:{title:'storage classes',rows:CLS,hl:[6,7]}},termClear:true,term:{term:['$ aws s3api \\','  put-bucket-lifecycle-configuration \\','  --bucket reports-bucket \\','  --lifecycle-configuration file://rules.json']},
   flows:[{path:['bucket','gl'],label:'old',tone:'blue'}]},
  {t:'Presigned URLs',b:'To share one private file, create a presigned URL: a link signed with your credentials that works only for a short time. The bucket stays private.',k:['tip','Remember','Presigned URLs also let users upload directly to S3 without your server handling the file.'],pill:'idea',tt:'Share',focus:['bucket','net'],
   set:{info:{title:'security',rows:SEC,hl:[4]}},termClear:true,term:{term:['$ aws s3 presign \\','    s3://reports-bucket/report.csv \\','    --expires-in 3600','https://reports-bucket.s3...','  ...&X-Amz-Expires=3600&X-Amz-Signature=8f3a']},
   once:[{path:['bucket','net'],label:'1h',tone:'green'}]},
  {t:'Try it: undo an accidental delete',b:'Someone will delete report.csv by mistake. Prepare the bucket, upload the report a few times, delete it, then get it back.',k:['tip','Challenge','Try it with versioning off first. Then enable versioning and do it right.'],pill:'problem',tt:'Try it',S:{ver:false,vers:[],cnt:0,del:false,gone:false,restored:false},goal:true,focus:null,
   set:{v1:{show:false},v2:{show:false},v3:{show:false},dm:{show:false},info:{title:'report.csv versions',rows:VL,hl:[]}},termClear:true,term:{term:['$ aws s3 ls s3://reports-bucket/','# empty bucket']}},
  {t:'Recap',b:'S3 keeps objects in buckets with near-perfect durability. Turn on versioning, keep buckets private, use lifecycle rules to save money, and share with presigned URLs.',k:['idea','Next up','VPC networking: subnets, route tables, gateways and security groups.'],pill:'recap',tt:'Recap',S:{ver:true,vers:['v1 · Nov 24','v2 · Nov 25'],cnt:2,del:false,restored:true},
   set:{v1:{show:true,title:'v1 · Nov 24',status:'none'},v2:{show:true,title:'v2 · Nov 25',status:'run'},dm:{show:false},info:{title:'report.csv versions',rows:VL,hl:[]}},termClear:true,term:{term:['$ aws s3api get-bucket-versioning \\','    --bucket reports-bucket','"Status": "Enabled"']}}
 ]});
})();
