const Apify = require("apify");
const cheerio = require("cheerio");


const {log} = Apify.utils;


module.exports = async () => {
    log.debug('drechslershop.parse');

    log.debug('drechslershop.parse - skipping');
    return;

    let drechslershop_pages = await Apify.openDataset('drechslershop-pages');
    let drechslershop_pages_info = await drechslershop_pages.getInfo();

    let counter = 0;
    let suppliers = {};

    await drechslershop_pages.forEach((page, index) => {
        let $ = cheerio.load(page.html);

        let supplier = $('.product--supplier a')[0];
        if (supplier) {
            supplier = supplier.attribs.title;
        }
        if (!suppliers[supplier]) {
            suppliers[supplier] = 0;
        }
        suppliers[supplier]++;

        log.debug(`drechslershop.parse - ${ counter } (${ index }/${ drechslershop_pages_info.itemCount })`);
    })

    log.debug('drechslershop.parse - done');
}
