import asyncio,sys
from playwright.async_api import async_playwright
les,step,btns,out=sys.argv[1],int(sys.argv[2]),sys.argv[3],sys.argv[4]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1440,'height':900})
        await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('app.html'))+'#'+les); await pg.wait_for_timeout(500)
        await pg.evaluate(f'go({step})'); await pg.wait_for_timeout(800)
        for t in [x for x in btns.split(__import__('os').environ.get('SEP','|')) if x]:
            await pg.get_by_role('button',name=t,exact=True).first.click(); await pg.wait_for_timeout(500)
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=out); await b.close()
asyncio.run(main())
