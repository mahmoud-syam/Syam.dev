import asyncio,sys
from playwright.async_api import async_playwright
les,step,vw,vh,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]),sys.argv[5]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':vw,'height':vh})
        await pg.goto(''+__import__('os').environ.get('SITE','file://'+__import__('os').path.abspath('index.html'))+'#'+les); await pg.wait_for_timeout(500)
        await pg.evaluate(f'go({step})'); await pg.wait_for_timeout(3300)
        await pg.screenshot(path=out); await b.close()
asyncio.run(main())
