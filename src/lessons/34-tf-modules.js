(function(){
var BK={local:['local file','! Bob had no idea Alice\'s VPC existed:','! two VPCs, two state files that disagree'],s3:['S3, no lock','! both read the same state, both wrote:','! last write won, Alice\'s change is lost'],lock:['S3 + lock','Bob: Error acquiring the state lock','✓ Bob waited, re-planned, applied safely']};
var MOD=[{t:'module "vpc" {',tone:'gold'},'  source  = "terraform-aws-modules/vpc/aws"',{t:'  version = "~> 5.0"',tone:'green'},'  name    = "prod"','  cidr    = "10.0.0.0/16"','  azs     = ["eu-west-1a", "eu-west-1b"]','}','',{t:'module.vpc.private_subnets   # its output',tone:'gold'}];
var OWN=['modules/web/',{t:'  main.tf        the resources',tone:'gold'},{t:'  variables.tf   inputs: name, size, subnets',tone:'gold'},{t:'  outputs.tf     outputs: url, sg_id',tone:'gold'},'  README.md','','envs/prod/main.tf:',{t:'  module "web" { source = "../../modules/web" }',tone:'green'}];
var BACK=[{t:'terraform {',tone:'gold'},'  backend "s3" {','    bucket       = "acme-tf-state"','    key          = "prod/network.tfstate"','    region       = "eu-west-1"','    encrypt      = true',{t:'    use_lockfile = true   # Terraform 1.10+',tone:'green'},'  }','}'];
var ENVS=['One state per environment',{t:'envs/dev/      backend key dev/...',tone:'gold'},{t:'envs/staging/  backend key staging/...',tone:'gold'},{t:'envs/prod/     backend key prod/...',tone:'gold'},'',{t:'CI: plan on every pull request,',tone:'green'},{t:'    apply only after merge to main',tone:'green'},'Workspaces work too, but folders are clearer.'];
var RS=[{t:'data "terraform_remote_state" "net" {',tone:'gold'},'  backend = "s3"','  config = {','    bucket = "acme-tf-state"','    key    = "prod/network.tfstate"','    region = "eu-west-1"','  }','}','# data.terraform_remote_state.net.outputs.vpc_id'];
function vis(S,A){var b=S.bk;A.set('st',{show:true,title:b=='local'?'2 local files':'state in S3',sub:b=='lock'?'locked while used':b=='s3'?'no locking':'alice + bob laptops',status:!S.ran?'none':b=='lock'?'run':'#e5534b'});A.set('code',{title:'backend.tf',rows:BACK,hl:b=='lock'?[6]:[]});A.refresh()}
function sim(S,A){var id=S.rid=(S.rid||0)+1;function L(ms,fn){A.after(ms,function(){if(S.rid===id)fn()})}S.ran=false;var b=S.bk,r=BK[b];
 L(100,function(){A.send(['alice','st'],{label:'apply',tone:'gold',ok:true})});L(300,function(){A.send(['bob','st'],{label:'apply',tone:b=='lock'?'amber':'blue',ok:b!='lock',denyAt:'st'})});
 L(1300,function(){A.send(['st','aws'],{label:'vpc',tone:'green',ok:true});if(b=='local')A.send(['bob','aws'],{label:'vpc',tone:'red',ok:true})});
 if(b=='lock')L(2100,function(){A.send(['bob','st'],{label:'retry',tone:'green',ok:true})});
 L(2800,function(){S.ran=true;S.ranB=b;A.term('term',['# alice and bob run terraform apply','# at the same moment, backend: '+r[0],r[1],r[2]],true);vis(S,A)})}
LESSON('terraform','modules',{
 title:'Modules & remote state',sub:'Reuse infrastructure as modules, keep state in one shared and locked place, and separate environments.',time:'15 min',level:'Intermediate',
 S:{bk:'local',ran:false,ranB:null},
 legend:[['#3fa456','safe'],['#e8a33a','waiting for lock'],['#e5534b','conflict']],
 hud:[{id:'b',l:'Backend',v:function(S){return BK[S.bk][0]},lv:function(S){return S.bk=='lock'?'good':'warn'}},{id:'l',l:'Locking',v:function(S){return S.bk=='lock'?'on':'off'},lv:function(S){return S.bk=='lock'?'good':'bad'}},{id:'r',l:'Last run',v:function(S){return !S.ran?'—':S.ranB=='lock'?'safe':'conflict'},lv:function(S){return !S.ran?'none':S.ranB=='lock'?'good':'bad'}},{id:'m',l:'Modules',v:'vpc, web',lv:'none'}],
 nodes:[
  {t:'crowd',id:'alice',x:64,y:66,tone:'gold',label:'alice',n:1,w:46,anchor:[110,66]},
  {t:'crowd',id:'bob',x:64,y:310,tone:'blue',label:'bob',n:1,w:46,anchor:[110,310]},
  H.tile('st',200,190,'2 local files','alice + bob laptops','violet',{w:150,status:'none'}),
  H.box('aws',326,40,'AWS','amber',{center:true}),
  H.tile('mv',326,300,'module vpc','registry ~> 5.0','blue',{w:118}),
  H.tile('mw',326,384,'module web','../modules/web','blue',{w:118}),
  {t:'panel',id:'code',x:392,y:14,w:316,h:170,title:'module call',rows:MOD,fs:9},
  {t:'term',id:'term',x:392,y:198,w:316,h:252,title:'terminal'}],
 links:[H.lk('alice','st','gold'),H.lk('bob','st','blue'),H.lk('st','aws','violet'),H.lk('mv','aws','blue',{dash:true}),H.lk('mw','mv','blue',{dash:true})],
 controls:{title:'Choose the backend',groups:[{items:Object.keys(BK).map(function(k){return {label:BK[k][0],wide:true,on:function(S){return S.bk==k},click:function(S,A){S.bk=k;S.ran=false;S.rid=(S.rid||0)+1;vis(S,A);A.term('term',['$ terraform init -migrate-state','# backend: '+BK[k][0]],true)}}}).concat([{label:'alice + bob apply',wide:true,click:function(S,A){sim(S,A)}}])}]},
 goal:function(S){if(S.ran&&S.ranB=='lock')return [true,'Done. One shared state in S3, and the lock made Bob wait for Alice instead of overwriting her work.'];if(S.ran)return [false,'That ended in a conflict. Which backend shares one state AND stops two people writing at once?'];return [false,'Goal: let Alice and Bob apply at the same time without breaking anything. Pick a backend and run the collision.']},
 learn:[['Call a module',0],['Use registry modules safely',1],['Write your own module',2],['Know why state goes remote',3],['Configure an S3 backend with locking',4],['Separate environments',5],['Read another stack\'s outputs',6]],
 steps:[
  {t:'Modules',b:'A module is a folder of Terraform files with inputs and outputs. You call it with a module block, like a function: give it values, get resources and outputs back.',k:['idea','Key idea','Every Terraform folder is already a module, the root module. Modules just let you reuse one inside another.'],pill:'setup',tt:'Modules',focus:['mv','aws'],S:{bk:'local',ran:false,ranB:null},
   set:{st:{title:'2 local files',sub:'alice + bob laptops',status:'none'},code:{title:'module call',rows:MOD,hl:[0,1,8]}},termClear:true,term:{term:['$ terraform init','- vpc in .terraform/modules/vpc','$ terraform plan | tail -1','Plan: 23 to add, 0 to change, 0 to destroy.']},
   once:[{path:['mv','aws'],label:'23',tone:'blue'}]},
  {t:'Registry modules',b:'The Terraform Registry has well-tested modules for common pieces, like a full VPC in a dozen lines. Pin the version so an upgrade never surprises you.',k:['problem','Watch out','A module runs with your credentials. Prefer verified publishers and read what it creates.'],pill:'idea',tt:'Registry',focus:['mv'],
   set:{code:{rows:MOD,hl:[1,2]}},termClear:true,term:{term:['$ # ~> 5.0 means 5.x, never 6.0','$ terraform init -upgrade']}},
  {t:'Your own modules',b:'Wrap a pattern your team repeats, like "web service behind a load balancer", into a module with clear inputs and outputs. Each environment calls it with different values.',k:['tip','Remember','Keep modules small and focused. A module that does everything is hard to change safely.'],pill:'idea',tt:'Own',focus:['mw','mv'],
   set:{code:{title:'module layout',rows:OWN,hl:[2,3,7]}},termClear:true,term:{term:['$ tree modules/web','modules/web','├── main.tf','├── outputs.tf','└── variables.tf']}},
  {t:'Why remote state',b:'Local state lives on one laptop. Teammates cannot see it, and if the laptop dies Terraform forgets what it built. Remote state keeps one shared truth.',k:['problem','Watch out','State can contain passwords. Store it encrypted, with versioning, and restrict who can read it.'],pill:'problem',tt:'Remote',focus:['alice','bob','st'],
   set:{st:{title:'2 local files',sub:'alice + bob laptops',status:'#e5534b'}},termClear:true,term:{term:['# bob: terraform plan','  + aws_vpc.main will be created','! (alice created it yesterday...)']},
   once:[{path:['bob','aws'],label:'vpc',tone:'red'}]},
  {t:'S3 backend with locking',b:'Store state in an S3 bucket with versioning and encryption. With locking, the first person to run plan or apply holds a lock, and everyone else waits.',k:['tip','Remember','Terraform 1.10+ can lock with a file in S3 (use_lockfile). Older setups use a DynamoDB table for the lock.'],pill:'idea',tt:'Backend',focus:['alice','bob','st'],S:{bk:'lock'},
   set:{st:{title:'state in S3',sub:'locked while used',status:'run'},code:{title:'backend.tf',rows:BACK,hl:[2,3,6]}},termClear:true,term:{term:['$ terraform init -migrate-state','Successfully configured the backend "s3"!','# bob, during alice\'s apply:','Error acquiring the state lock']},
   once:[{path:['alice','st'],label:'lock',tone:'gold'},{path:['bob','st'],label:'wait',tone:'amber',ok:false,denyAt:'st',delay:600}]},
  {t:'Environments',b:'Give dev, staging and prod separate state, usually separate folders that call the same modules. Then a mistake in dev can never touch prod.',k:['idea','Key idea','Run plan automatically on every pull request and apply only after review and merge. Terraform then changes infrastructure the way code is shipped.'],pill:'idea',tt:'Envs',focus:['st','mw'],
   set:{code:{title:'environments',rows:ENVS,hl:[1,2,3,5,6]}},termClear:true,term:{term:['$ cd envs/prod && terraform plan','# CI posts this plan on the pull request']}},
  {t:'Reading other stacks',b:'Split big systems into stacks, like network and app. The app stack can read the network stack\'s outputs with terraform_remote_state, or look things up with data sources.',k:['tip','Remember','Data source lookups by tag are often looser coupling than reading another state directly.'],pill:'idea',tt:'Stacks',focus:['st','aws'],
   set:{code:{title:'remote state data',rows:RS,hl:[0,4,8]}},termClear:true,term:{term:['$ cd ../network && terraform output vpc_id','"vpc-0f12ab"','$ # the app stack reads the same value','$ # through terraform_remote_state']}},
  {t:'Try it: two people, one apply',b:'Alice and Bob both run terraform apply at the same moment. Choose where the state lives, then run the collision.',k:['tip','Challenge','Try local first, then S3 without a lock. Each fails in a different way. Why?'],pill:'problem',tt:'Try it',S:{bk:'local',ran:false,ranB:null},goal:true,focus:null,
   set:{st:{title:'2 local files',sub:'alice + bob laptops',status:'none'},code:{title:'backend.tf',rows:BACK,hl:[]}},termClear:true,term:{term:['$ # same repo, two laptops']}},
  {t:'Recap',b:'Modules package reusable infrastructure with pinned versions. State lives remotely in S3, encrypted and locked, with one state per environment, and changes ship through pull requests.',k:['idea','Next up','Kubernetes: run containers across many machines.'],pill:'recap',tt:'Recap',S:{bk:'lock',ran:true,ranB:'lock'},
   set:{st:{title:'state in S3',sub:'locked while used',status:'run'},code:{title:'backend.tf',rows:BACK,hl:[6]}},termClear:true,term:{term:['✓ modules · remote state · locking · envs']}}
 ]});
})();
