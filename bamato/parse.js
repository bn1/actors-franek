const Apify = require("apify");
const cheerio = require('cheerio');
const config = require("../utils/config");
const {parse_price} = require("../utils/parsers");
const {queue_with_key_indexes} = require("../utils/queue_with_key_indexes");


const {log} = Apify.utils;


module.exports = async () => {
    log.debug('bamato.parse');

    let bamato_pages = await Apify.openDataset('bamato-pages');

    let bamato_categories = await queue_with_key_indexes('bamato-categories-parsed');
    let bamato_products = await queue_with_key_indexes('bamato-products-parsed');

    let bamato_pages_info = await bamato_pages.getInfo();
    let bamato_products_info = await bamato_products.getInfo();

    if (bamato_products_info.totalCount) {
        log.debug('bamato.parse - skipped');
        return
    }

    // noinspection ES6MissingAwait
    await bamato_pages.forEach(async (page, index) => {
        log.debug(`bamato.parse - ${ index + 1 } / ${ bamato_pages_info.itemCount }`)
        let $ = cheerio.load(page.html);

        let categories = $('#breadcrumb li a').map(
            (index, el) => {
                return {
                    "url": el.attribs.href,
                    "code": el.attribs.href.split('/').slice(-2)[0].toLowerCase(),
                    "descriptions": [
                        {
                            "name": $(el).text(),
                        }
                    ],
                }
            }
        ).toArray();

        // add structure to categories and translate texts
        for (let index of categories.keys()) {
            let category = categories[index];

            category.category_id = category.code.hashCode();
            if (index) {
                category.parent_id = categories[index - 1].category_id;
            }
        }
        for (let category of categories) {
            await bamato_categories.setValue(category.url, category);
        }

        let vat_string = $('.pricebox').text().match(/(\d+%)/);
        let vat = 0;
        if (vat_string) {
            vat = parseInt(vat_string[0].replace(/\D/, ''));
        }
        vat = vat || 0;

        let price = parse_price($('#productPrice .price').text());
        price /= 1 + 0.01 * vat;

        let images = $('.otherPictures a img').map((index, el) => {
            let url = el.attribs.src.replace('generated', 'master');
            url = url.split('/');
            url = [].concat(url.slice(0, -2), url.slice(-1)).join('/');

            return url;
        }).toArray();

        if (!images.length) {
            let single_image = $('#zoom1')[0].attribs['data-img-original'];
            if (single_image) {
                images = [single_image];
            }
        }

        let code = $('#productTitle').next().text().trim().split('Artikelnummer: ').slice(-1)[0];
        await bamato_products.setValue(page.url, {
            url: page.url,
            code,

            "title": $('h1#productTitle').text().trim(),
            "description": $('#description').html(),

            "parameters": $('.attributes > div').map((index, el) => {
                return {
                    "name": $(el).find('dt').text().trim(),
                    "value": $(el).find('dd').text().trim()
                }
            }).toArray(),

            "manufacturer": $('.brandLogo a')[0].attribs.title,
            "availability": $('.deliverytime').text(),
            "weight": parseFloat($('.weight').text().replace(/([a-zA-Z:]|\s)/g, '')) * 1e3,
            images,
            "categories": categories.map(category => {return {code: category.code}}),
            "related_products": $('#similar a.title').map((index, el) => el.attribs.href).toArray(),
            price,
        });
    });

    log.debug('bamato.parse - done');
}
