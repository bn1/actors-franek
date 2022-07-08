const Apify = require("apify");
const {translate} = require("../utils/translations");
const {queue_with_key_indexes} = require("../utils/queue_with_key_indexes");
const config = require("../utils/config");


const {log} = Apify.utils;


module.exports = async () => {
    log.debug('bamato.transform');

    let bamato_categories_parsed = await queue_with_key_indexes('bamato-categories-parsed');
    let bamato_products_parsed = await queue_with_key_indexes('bamato-products-parsed');

    let bamato_categories = await Apify.openKeyValueStore('bamato-categories');
    let bamato_products = await Apify.openKeyValueStore('bamato-products');

    let categories_pool = new Apify.AutoscaledPool({
        maxConcurrency: 50,
        isTaskReadyFunction: async () => {
            let info = await bamato_categories_parsed.getInfo();
            return !!info.pendingCount;
        },
        isFinishedFunction: async () => {
            let info = await bamato_categories_parsed.getInfo();
            return !info.pendingCount;
        },

        runTaskFunction: async () => {
            let category = await bamato_categories_parsed.fetchNext();
            if (!category) {
                return
            }

            category.active_yn = true;
            category.type = 'siteWithProducts';
            category.type_of_items = 'withoutSubcategories';

            for (let description of category.descriptions) {
                description.language = 'cs';
                description.name = await translate(description.name, 'CS');
                description.name_h1 = description.name;
            }

            await bamato_categories.setValue(category.code, category);
            await bamato_categories_parsed.markHandled(category.url);
        }
    });

    let products_pool = new Apify.AutoscaledPool({
        maxConcurrency: 50,
        isTaskReadyFunction: async () => {
            let info = await bamato_products_parsed.getInfo();
            return !!info.pendingCount;
        },
        isFinishedFunction: async () => {
            let info = await bamato_products_parsed.getInfo();
            return !info.pendingCount;
        },

        runTaskFunction: async () => {
            let product = await bamato_products_parsed.fetchNext();
            if (!product) {
                return
            }

            product.active_yn = true;
            product.archived_yn = false;

            // TODO: tohle bude potreba resit podle toho, jak to budeme tahat z upgates
            product.can_add_to_basket_yn = true;

            product.adult_yn = false;
            product.vats = [
                {
                    "vat": 21,
                    "language": "cs",
                }
            ];

            product.images = product.images.map(url => { return {url} });

            product.related_products = product.related_products.map(url => { return {url} });
            for (let related_p of product.related_products) {
                let related_product = await bamato_products_parsed.getValue(related_p.url);
                if (related_product) {
                    related_p.code = related_product.code;
                }
            }

            product.descriptions = [{
                language: 'cs',
                title: await translate(product.title, 'CS'),
                long_description: await translate(product.description, 'CS'),
            }];

            product.prices = [{
                "currency": "CZK",
                "language": "cs",
                "pricelists": [
                    {
                        "price_original": product.price * config.get('EUR_RATIO'),
                    }
                ],
            }]

            product.availability = await translate(product.availability, 'CS');

            for (let parameter of product.parameters) {
                parameter.language = 'cs';
                parameter.name = await translate(parameter.name, 'CS');
                parameter.value = await translate(parameter.value, 'CS');
            }

            await bamato_products.setValue(product.code, product);
            await bamato_products_parsed.markHandled(product.url);
        }
    });

    await categories_pool.run();
    await products_pool.run();

    // await Promise.allSettled([
    //     categories_pool.run(),
    //     products_pool.run()
    // ])

    log.debug('bamato.transform - done');
}