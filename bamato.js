const Apify = require('apify');


const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);


async function run_crawler({upgates_data, update_product, keys_to_override, upgates_xml_output, translate}) {
    // Open the default request queue associated with the actor run
    const requestQueue = await Apify.openRequestQueue('bamato');
    await requestQueue.addRequest({url: 'https://www.bamato-maschinen.de/', userData: {page: 'main'}});

    let categories_dataset, products_dataset, categories_queue, products_queue;

    if (upgates_xml_output) {
        categories_dataset = await Apify.openDataset('bamato-categories');
        products_dataset = await Apify.openDataset('bamato-products');

        categories_queue = await Apify.openRequestQueue('bamato-categories-queue');
        products_queue = await Apify.openRequestQueue('bamato-products-queue');
    }


    const crawler = new Apify.CheerioCrawler({
        requestQueue,

        minConcurrency: 1,
        maxConcurrency: 1,
        // minConcurrency: 5,
        // maxConcurrency: 10,

        maxRequestRetries: 1,

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
                    let categories = $('#breadcrumb li a').map(
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

                    let parameters = $('.attributes > div').map(async (index, el) => {
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

                    const product_data = {
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
                                "long_description": $('#description').html(),
                                // "url": "https://bonado.upgates.shop/p/bamato-bcs-500pro-400v-kotoucova-stolni-pila",
                                // "unit": "ks"
                            }
                        ],
                        "parameters": parameters,
                        "manufacturer": $('.brandLogo a')[0].attribs.title,
                        // "stock": null,
                        // "stock_position": null,
                        "availability": $('.deliverytime').text(),
                        "availability_type": 'InStock',
                        "weight": parseFloat($('.weight').text().replace(/([a-zA-Z]|\s)/g, '')) * 1e3,
                        // "shipment_group": null,
                        "images": $('.slides img').map((index, el) => {
                            let url = el.attribs.src.replace('generated', 'master');
                            url = url.split('/');
                            url = [].concat(url.slice(0, -2), url.slice(-1)).join('/');

                            return { url }
                        }).toArray(),
                        "categories": categories.map(category => {return {code: category.code}}),
                        // "groups": [],
                        "prices": [
                            {
                                "currency": "EUR",
                                "language": "cs",
                                "pricelists": [
                                    {
                                        // "name": "Výchozí",
                                        "price_original":
                                            parseFloat(
                                                $('#productPrice .price').text()
                                                    .replace(/([a-zA-Z€]|\s)/g, '')
                                                    .replace(',', '.') / (1 + 0.01 * parseInt($('.pricebox').text().match(/(\d+%)/)[0].replace(/\D/, '')))
                                            ),
                                        // "product_discount": null,
                                        // "product_discount_real": 0,
                                        // "price_sale": null,
                                        // "price_with_vat": 0,
                                        // "price_without_vat": 0
                                    }
                                ],
                                // "price_purchase": null,
                                // "price_common": 0,
                                "vat": 21,
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
                    };

                    if (upgates_xml_output) {
                        for (let category of categories) {
                            await categories_queue.addRequest({
                                url: category._id,
                                userData: category
                            })
                            let category_rq = await categories_queue.fetchNextRequest();
                            if (category_rq) {
                                await categories_queue.markRequestHandled(category_rq);
                                let category = category_rq.userData;
                                let category_name = category.descriptions[0].name;

                                category_name = await translate(category_name, 'CS');
                                category.descriptions[0].name = category_name;
                                category.descriptions[0].name_h1 = category_name;

                                await categories_dataset.pushData(category);
                            }
                        }

                        await products_dataset.pushData(product_data);
                    }

                    if (update_product) {
                        const upgates_product = upgates_data[product_data.code] || product_data;
                        for (let key of keys_to_override) {
                            upgates_product[key] = product_data[key];
                        }

                        let response = await update_product(upgates_product);
                    }
                    break;

                default:
                    log.debug(`Unhandled url ${request.url}`);
            }

            // if (upgates_xml_output && await requestQueue.isEmpty()) {
            if (upgates_xml_output) {
                let storage = await Apify.openKeyValueStore();
                let xml_output;

                const cd = (text) => `<![CDATA[\n${ text }\n]]>`

                // bamato-categories.xml
                xml_output = '<CATEGORIES version="1">'
                // noinspection ES6MissingAwait
                await categories_dataset.forEach(async (category, index) => {
                    let descriptions = ''
                    for (let description of category.descriptions) {
                        descriptions += `
                            <DESCRIPTION language="${ description.language }">
                                <NAME>${ cd(description.name) }</NAME>
                                <NAME_H1>${ cd(description.name_h1) }</NAME_H1>
                            </DESCRIPTION>`
                    }

                    xml_output += `
                        <CATEGORY>
                            <CODE>${ category.code }</CODE>
                            <CATEGORY_ID>${ category.category_id }</CATEGORY_ID>
                            <PARENT_ID>${ category.parent_id }</PARENT_ID>
                            <ACTIVE_YN>${ Number(category.active_yn) }</ACTIVE_YN>
                            <TYPE>${ category.type }</TYPE>
                            <TYPE_OF_ITEMS>${ category.type_of_items }</TYPE_OF_ITEMS>
                            <DESCRIPTIONS>${ descriptions }</DESCRIPTIONS>
                        </CATEGORY>`
                });

                xml_output += '</CATEGORIES>';

                await storage.setValue(
                    'bamato-categories',
                    xml_output,
                    {contentType: 'text/xml;charset=UTF-8'}
                );

                // bamato-products.xml
                xml_output = '<PRODUCTS version="2.0">';
                // noinspection ES6MissingAwait
                await products_dataset.forEach(async (product, index) => {
                    let descriptions = '';
                    for (let description of product.descriptions) {
                        descriptions += `
                            <DESCRIPTION language="${ description.language }">
                                <TITLE>${ cd(description.title) }</TITLE>
                                <LONG_DESCRIPTION>${ cd(description.long_description) }</LONG_DESCRIPTION>
                            </DESCRIPTION>
                        `
                    }

                    let parameters = '';
                    for (let parameter of product.parameters) {
                        parameters += `
                            <PARAMETER language="${ parameter.language }">
                                <NAME>${ cd(parameter.name) }</NAME>
                                <VALUE>${ cd(parameter.value) }</VALUE>
                            </PARAMETER>
                        `
                    }

                    let images = '';
                    for (let image of product.images) {
                        images += `
                            <IMAGE>
                                <URL>${ image.url }</URL>
                            </IMAGE>
                        `
                    }

                    let categories = '';
                    for (let category of product.categories) {
                        categories += `
                            <CATEGORY>
                                <CODE>${ category.code }</CODE>
                            </CATEGORY>
                        `
                    }

                    let prices = '';
                    for (let price of product.prices) {
                        let pricelists = '';
                        for (let pricelist of price.pricelists) {
                            pricelists += `
                                <PRICELIST>
                                    <PRICE_ORIGINAL>${ pricelist.price_original }</PRICE_ORIGINAL>
                                </PRICELIST>
                            `
                        }

                        prices += `
                            <PRICE language="${ price.language }">
                                <CURRENCY>${ price.currency }</CURRENCY>
                                <PRICELISTS>${ pricelists }</PRICELISTS>
                                <VAT>${ price.vat }</VAT>
                            </PRICE>
                        `
                    }

                    xml_output += `
                        <PRODUCT>
                            <CODE>${ product.code }</CODE>
                            <ACTIVE_YN>${ Number(product.active_yn) }</ACTIVE_YN>
                            <ARCHIVED_YN>${ Number(product.archived_yn) }</ARCHIVED_YN>
                            <CAN_ADD_TO_BASKET_YN>${ Number(product.can_add_to_basket_yn) }</CAN_ADD_TO_BASKET_YN>
                            <ADULT_YN>${ Number(product.adult_yn) }</ADULT_YN>
                            <DESCRIPTIONS>${ descriptions }</DESCRIPTIONS>
                            <PARAMETERS>${ parameters }</PARAMETERS>
                            <MANUFACTURER>${ cd(product.manufacturer) }</MANUFACTURER>
                            <AVAILABILITY>${ cd(product.availability) }</AVAILABILITY>
                            <AVAILABILITY_TYPE>${ product.availability_type }</AVAILABILITY_TYPE>
                            <WEIGHT>${ product.weight }</WEIGHT>
                            <IMAGES>${ images }</IMAGES>
                            <CATEGORIES>${ categories }</CATEGORIES>
                            <PRICES>${ prices }</PRICES>
                        </PRODUCT>
                    `
                });

                xml_output += '</PRODUCTS>';

                await storage.setValue(
                    'bamato-products',
                    xml_output,
                    {contentType: 'text/xml;charset=UTF-8'}
                );
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

    await crawler.run();

    // TODO: drop queues etc. here
}


module.exports = {run: run_crawler};