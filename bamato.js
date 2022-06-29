const Apify = require('apify');
const axios = require('axios');


const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);


async function run_crawler({upgates_data, update_product, keys_to_override, upgates_xml_output}) {
    // Open the default request queue associated with the actor run
    const requestQueue = await Apify.openRequestQueue();
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

        minConcurrency: 5,
        maxConcurrency: 10,

        maxRequestRetries: 5,

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
                    const product_data = {
                        "code": "BCS-500PRO",
                        "code_supplier": null,
                        "ean": null,
                        "product_id": 7796,
                        "active_yn": true,
                        "archived_yn": false,
                        "replacement_product_code": null,
                        "can_add_to_basket_yn": true,
                        "adult_yn": false,
                        "descriptions": [
                            {
                                "language": "cs",
                                "title": "BAMATO  BCS-500PRO (400V) kotoučová stolní pila",
                                "short_description": "Kotoučová stolní pila BAMATO řady BTS-250PRO je vybavena stabilním paralelním dorazem, který je veden na vysoce kvalitní vodicí kolejnici. Spolu s pevným odlévacím stolem to vede k dokonalému výsledku řezání. Pro dokonalé snadné použití lze pilový kotouč nastavit výškově nebo sklonem až na 45° pomocí ručních kol a Slaka. Posuvný stůl je také vyráběn jako stůl s plným litým tělesem a má mimo jiné úhlově nastavitelnou dorazovou lištu s přidržením.",
                                "long_description": null,
                                "url": "https://bonado.upgates.shop/p/bamato-bcs-500pro-400v-kotoucova-stolni-pila",
                                "unit": "ks"
                            }
                        ],
                        "manufacturer": "BAMATO",
                        "stock": null,
                        "stock_position": null,
                        "availability": null,
                        "availability_type": null,
                        "weight": null,
                        "shipment_group": null,
                        "images": [],
                        "categories": $('.tagCloud a').map(
                        (index, el) => {
                                return {
                                    "code": el.attribs.href.split('/').slice(-2)[0],
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
                                            "name": el.text,
                                            "name_h1": $(el).text(),
                                            // "description_text": null,
                                            "url": el.attribs.href,
                                            // "link_url": null
                                        }
                                    ],
                                    // "images": [],
                                    // "creation_time": "2022-06-21T14:13:46+0200",
                                    // "last_update_time": "2022-06-21T14:13:46+0200",
                                    // "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2325"
                                }
                            }
                        ).toArray(),
                        "groups": [],
                        "prices": [
                            {
                                "currency": "CZK",
                                "language": "cs",
                                "pricelists": [
                                    {
                                        "name": "Výchozí",
                                        "price_original": 0,
                                        "product_discount": null,
                                        "product_discount_real": 0,
                                        "price_sale": null,
                                        "price_with_vat": 0,
                                        "price_without_vat": 0
                                    }
                                ],
                                "price_purchase": null,
                                "price_common": 0,
                                "vat": 21,
                                "recycling_fee": null
                            }
                        ],
                        "variants": [],
                        "metas": [
                            {
                                "key": "col",
                                "type": "input",
                                "value": ""
                            },
                            {
                                "key": "cont",
                                "type": "input",
                                "value": ""
                            }
                        ],
                        "creation_time": "2022-06-22T10:56:47+0200",
                        "last_update_time": "2022-06-22T11:15:14+0200",
                        "admin_url": "https://bonado.admin.upgates.com/manager/products/main/default/7796"
                    };

                    if (upgates_xml_output) {
                        for (let category of product_data.categories) {
                            await categories_queue.addRequest({
                                url: category.descriptions[0].url,
                                userData: category
                            })
                            let category_rq = await categories_queue.fetchNextRequest();
                            if (category_rq) {
                                await categories_queue.markRequestHandled(category_rq);
                                await categories_dataset.pushData(category_rq.userData);
                            }
                        }
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
}


module.exports = {run: run_crawler};