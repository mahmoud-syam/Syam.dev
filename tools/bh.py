# usage: bh.py lesson step "btn|btn|..." [waitms]
import asyncio,sys,os
from playwright.async_api import async_playwright
les,step,seq=sys.argv[1],int(sys.argv[2]),sys.argv[3].split(os.environ.get('SEP','|')); w=int(sys.argv[4]) if len(sys.argv)>4 else 1300
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('app.html'))+'#'+les); await pg.wait_for_timeout(600)
        await pg.evaluate(f'go({step})'); await pg.wait_for_timeout(500)
        for t in seq:
            ok=await pg.evaluate("t=>{var b=[...document.querySelectorAll('#sw button')].find(b=>b.textContent===t);if(!b)return false;b.click();return true}",t)
            await pg.wait_for_timeout(w)
            print(('' if ok else 'MISSING ')+t,'|',(await pg.inner_text('#hud')).replace('\n',' '),'|',(await pg.inner_text('#goal'))[:60])
        print('errors',errs); await pg.screenshot(path=f'/tmp/bh_{les}.png'); await b.close()
asyncio.run(main())
