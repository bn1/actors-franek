const Apify = require("apify");
const axios = require("axios");
const {ungzip} = require("node-gzip");
const cheerio = require("cheerio");


const {log} = Apify.utils;


const download_from_sitemap = async () => {
    log.debug('drechslershop.download');

    let drechslershop_pages = await Apify.openDataset('drechslershop-pages')
    let drechslershop_pages_info = await drechslershop_pages.getInfo();

    if (drechslershop_pages_info.itemCount) {
        log.debug('drechslershop.download - skipped');
        return
    }

    let requestQueue = await Apify.openRequestQueue('drechslershop');
    let sitemap = 'https://drechslershop.de/web/sitemap/shop-1/sitemap-1.xml.gz';

    sitemap = await axios.get(sitemap, {responseType: 'arraybuffer'});
    sitemap = (await ungzip(sitemap.data)).toString();

    let $ = cheerio.load(sitemap);
    let urls = $('url loc').map((index, element) => $(element).text()).toArray();

    for (let url of urls) {
        await requestQueue.addRequest({url})
    }

    const crawler = new Apify.CheerioCrawler({
        requestQueue,

        minConcurrency: 1,
        maxConcurrency: 10,
        // minConcurrency: 5,
        // maxConcurrency: 10,

        maxRequestRetries: 10,

        handlePageTimeoutSecs: 30,

        maxRequestsPerCrawl: 5000,

        handlePageFunction: async ({request, $}) => {
            log.debug(`Processing ${request.url}...`);

            await drechslershop_pages.pushData({html: $.html()});
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            await bamato_failed.addRequest(request);
            log.debug(`Request ${request.url} is failing.`);
        },
    });

    await crawler.run();
    log.debug('drechslershop.download - done');
};


const download_from_start_urls = async () => {
    log.debug('drechslershop.download');

    let drechslershop_pages = await Apify.openDataset('drechslershop-pages')
    let drechslershop_pages_info = await drechslershop_pages.getInfo();

    if (drechslershop_pages_info.itemCount) {
        log.debug('drechslershop.download - skipped');
        return
    }

    let requestQueue = await Apify.openRequestQueue('drechslershop');

    let start_list_urls = [
        'https://drechslershop.de/manpa-tools-korea/',
        'https://drechslershop.de/killinger-steinert-taiwandeutschland/'
    ]
    for (let url of start_list_urls) {
        await requestQueue.addRequest({
            url,
            userData: {page: 'list'}
        })
    }

    const crawler = new Apify.CheerioCrawler({
        requestQueue,

        minConcurrency: 1,
        maxConcurrency: 1,
        // minConcurrency: 5,
        // maxConcurrency: 10,

        maxRequestRetries: 10,

        handlePageTimeoutSecs: 30,

        maxRequestsPerCrawl: 5000,

        handlePageFunction: async ({request, $}) => {
            log.debug(`Processing ${request.url}...`);

            switch (request.userData.page) {
                case 'list':
                    await Promise.allSettled($('a.paging--link').map((index, el) => {
                        requestQueue.addRequest({
                            url: el.attribs.href,
                            userData: {page: 'list'}
                        });
                    }).toArray());

                    await Promise.allSettled($('.product--info a.product--image').map((index, el) => {
                        requestQueue.addRequest({
                            url: el.attribs.href,
                            userData: {page: 'product'}
                        })
                    }).toArray());
                    break;

                case 'product':
                    await drechslershop_pages.pushData({
                        url: request.url,
                        html: $.html()
                    });
                    break;

                default:
                    log.debug(`Unhandled url ${request.url}`);
            }
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            await bamato_failed.addRequest(request);
            log.debug(`Request ${request.url} is failing.`);
        },
    });

    await crawler.run();
    log.debug('drechslershop.download - done');
}

module.exports = download_from_start_urls;
