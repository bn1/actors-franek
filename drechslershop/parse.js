const Apify = require("apify");
const cheerio = require('cheerio');
const {translate} = require("../utils/translations");
const config = require("../utils/config");


const {log} = Apify.utils;


module.exports = async () => {
    return
    log.debug('drechslershop.parse');

    let drechslershop_pages = await Apify.openDataset('drechslershop-pages');

    let drechslershop_categories = await Apify.openDataset('drechslershop-categories');
    let drechslershop_products = await Apify.openDataset('drechslershop-products');

    let drechslershop_pages_info = await drechslershop_pages.getInfo();
    let drechslershop_products_info = await drechslershop_products.getInfo();

    if (drechslershop_products_info.itemCount) {
        log.debug('drechslershop.parse - skipped');
        return
    }

    // noinspection ES6MissingAwait
    await drechslershop_pages.forEach(async (page, index) => {
        log.debug(`drechslershop.parse - ${ index + 1 } / ${ drechslershop_pages_info.itemCount }`)
        let $ = cheerio.load(page.html);

        let categories = $('.breadcrumb--list li a').map(
            (index, el) => {
                return {
                    "_id": el.attribs.href,
                    "code": el.attribs.href.split('/').slice(-2)[0].toLowerCase(),
                    // "category_id": 2325,
                    // "parent_id": 2318,
                    // "position": 4,
                    "active_yn": true,
                    "type": "siteWithProducts",
                    "type_of_items": "withoutSubcategories",
                    // "manufacturer": null,
                    // "label": null,
                    // "show_in_menu_yn": true,
                    "descriptions": [
                        {
                            "language": "cs",
                            "name": $(el).text(),
                            "name_h1": $(el).text(),
                            // "description_text": null,
                            // "url": null,
                            // "link_url": null
                        }
                    ],
                    // "images": [],
                    // "creation_time": "2022-06-21T14:13:46+0200",
                    // "last_update_time": "2022-06-21T14:13:46+0200",
                    // "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2325"
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

            for (let description of category.descriptions) {
                description.name = await translate(description.name, 'CS');
                description.name_h1 = await translate(description.name_h1, 'CS');
            }
        }
        for (let category of categories) {
            await drechslershop_categories.pushData(category);
        }

        let parameters = $('.attributes > div').map((index, el) => {
            return {
                "language": "cs",
                "name": $(el).find('dt').text().trim(),
                "value": $(el).find('dd').text().trim()
            }
        }).toArray();
        for (let parameter of parameters) {
            parameter.name = await translate(parameter.name, 'CS');
            parameter.value = await translate(parameter.value, 'CS');
        }

        let vat_string = $('.pricebox').text().match(/(\d+%)/);
        let vat = 0;

        if (vat_string) {
            vat = parseInt(vat_string[0].replace(/\D/, ''));
        }

        let price_string = $('#productPrice .price').text()
            .replace(/([a-zA-Z€]|\s)/g, '')
            .replace('.', '')
            .replace(',', '.');

        let price = parseFloat(price_string) / (1 + 0.01 * vat);
        price = price || 0;
        price *= config.get('EUR_RATIO');

        await drechslershop_products.pushData({
            "code": $('#productTitle').next().text().trim().split('Artikelnummer: ').slice(-1)[0],
            // "code_supplier": null,
            // "ean": null,
            // "product_id": null,
            "active_yn": true,
            "archived_yn": false,
            // "replacement_product_code": null,
            "can_add_to_basket_yn": true,
            "adult_yn": false,
            "descriptions": [
                {
                    "language": "cs",
                    "title": await translate($('h1#productTitle').text().trim(), 'CS'),
                    // "short_description": null,
                    "long_description": await translate($('#description').html(), 'CS'),
                    // "url": "https://bonado.upgates.shop/p/drechslershop-bcs-500pro-400v-kotoucova-stolni-pila",
                    // "unit": "ks"
                }
            ],
            "parameters": parameters,
            "manufacturer": $('.brandLogo a')[0].attribs.title,
            // "stock": null,
            // "stock_position": null,
            "availability": $('.deliverytime').text(),
            "availability_type": 'InStock',
            "weight": parseFloat($('.weight').text().replace(/([a-zA-Z:]|\s)/g, '')) * 1e3,
            // "shipment_group": null,
            "images": $('.slides img').map((index, el) => {
                let url = el.attribs.src.replace('generated', 'master');
                url = url.split('/');
                url = [].concat(url.slice(0, -2), url.slice(-1)).join('/');

                return { url }
            }).toArray(),
            "categories": categories.map(category => {return {code: category.code}}),
            "vats": [
                {
                    "vat": 21,
                    "language": "cs",
                }
            ],
            // "groups": [],
            "prices": [
                {
                    "currency": "EUR",
                    "language": "cs",
                    "pricelists": [
                        {
                            // "name": "Výchozí",
                            "price_original": price,
                            // "product_discount": null,
                            // "product_discount_real": 0,
                            // "price_sale": null,
                            // "price_with_vat": 0,
                            // "price_without_vat": 0
                        }
                    ],
                    // "price_purchase": null,
                    // "price_common": 0,
                    // "recycling_fee": null
                }
            ],
            // "variants": [],
            // "metas": [
            //     {
            //         "key": "col",
            //         "type": "input",
            //         "value": ""
            //     },
            //     {
            //         "key": "cont",
            //         "type": "input",
            //         "value": ""
            //     }
            // ],
            // "creation_time": "2022-06-22T10:56:47+0200",
            // "last_update_time": "2022-06-22T11:15:14+0200",
            // "admin_url": "https://bonado.admin.upgates.com/manager/products/main/default/7796"
        });
    });
}
