import glob,sys
r=lambda f:open(f,encoding='utf8').read()
lessons=''.join(r(f) for f in sorted(glob.glob('lessons/*.js')))
out=r('head.html')+'<style>'+r('all.css')+'</style>'+r('body.html')+'<script>'+r('core_pre.js')+lessons+'</script>'+r('tail.html')
open(sys.argv[1] if len(sys.argv)>1 else 'out.html','w',encoding='utf8').write(out)
