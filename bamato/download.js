const Apify = require("apify");
const {log} = Apify.utils;


module.exports = async () => {
    log.debug('bamato.download');

    const requestQueue = await Apify.openRequestQueue('bamato');
    await requestQueue.addRequest({url: 'https://www.bamato-maschinen.de/', userData: {page: 'main'}});

    let product_pages = await Apify.openDataset('bamato-pages');
    let bamato_failed = await Apify.openRequestQueue();

    let product_pages_info = await product_pages.getInfo();
    if (product_pages_info.itemCount) {
        log.debug('bamato.download - skipped');
        return
    }

    const crawler = new Apify.CheerioCrawler({
        requestQueue,

        minConcurrency: 1,
        maxConcurrency: 1,
        // minConcurrency: 5,
        // maxConcurrency: 10,

        maxRequestRetries: 10,

        handlePageTimeoutSecs: 30,

        maxRequestsPerCrawl: 500,

        handlePageFunction: async ({ request, $ }) => {
            log.debug(`Processing ${request.url}...`);

            switch (request.userData.page) {
                case 'main':
                    $('#navigation a:not([data-toggle="dropdown"])').each((index, el) => {
                        requestQueue.addRequest({
                            url: el.attribs.href,
                            userData: {page: 'subcat-list'}
                        })
                    });
                    break;

                case 'subcat-list':
                    $('.subcatList .panel-heading a').each((index, el) => {
                        requestQueue.addRequest({
                            url: el.attribs.href,
                            userData: {page: 'product-list'}
                        })
                    });
                    break;

                case 'product-list':
                    $('#productList .title a').each((index, el) => {
                        requestQueue.addRequest({
                            url: el.attribs.href,
                            userData: {page: 'product-detail'}
                        })
                    });
                    break;

                case 'product-detail':
                    await product_pages.pushData({
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

    log.debug('bamato.download - done');
}