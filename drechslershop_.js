const Apify = require("apify");


const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);


async function run_crawler() {
    const SITEMAP_URL = 'https://drechslershop.de/sitemap_index.xml';

    // Open the default request queue associated with the actor run
    const requestQueue = await Apify.openRequestQueue();

    const crawler = new Apify.CheerioCrawler({
        requestQueue,

        minConcurrency: 5,
        maxConcurrency: 10,

        maxRequestRetries: 5,

        handlePageTimeoutSecs: 30,

        maxRequestsPerCrawl: 500,

        handlePageFunction: async ({ request, $ }) => {
            log.debug(`Processing ${request.url}...`);

            switch (request.userData.page) {
                case 'product-detail':
                    await Apify.pushData({
                        url: request.url,
                    })
                    break;

                default:
                    log.debug(`Unhandled url ${request.url}`);
            }


            // // Store the results to the default dataset. In local configuration,
            // // the data will be stored as JSON files in ./apify_storage/datasets/default
            // await Apify.pushData({
            //     url: request.url,
            //     title,
            //     h1texts,
            // });
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            log.debug(`Request ${request.url} is failing.`);
        },
    });

    const sitemap_urls = [];

    async function run() {
        let url;
        for (url of sitemap_urls) {
            await requestQueue.addRequest({
                url,
                userData: {page: 'product-detail'}
            });
        }

        await crawler.run();
    }


    // sitemaps.parseSitemaps(
    //     [SITEMAP_URL],
    //
    //     (url) => {
    //         sitemap_urls.push(url);
    //     },
    //
    //     (err, sitemaps) => {
    //         if (err) {
    //             console.log({err})
    //         } else {
    //             console.log('All done!');
    //             console.log(sitemap_urls);
    //
    //             run.then()
    //         }
    // });

}


module.exports = {run: run_crawler};