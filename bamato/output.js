const Apify = require("apify");
const {xml_output_categories, xml_output_products} = require("../upgates/utils");


const {log} = Apify.utils;


const dict_values = (dict) => {
    let results = [];
    for (let key in dict) {
        results.push(dict[key]);
    }

    return results;
}


module.exports = async () => {
    log.debug('bamato.output');

    let bamato_categories = await Apify.openKeyValueStore('bamato-categories');
    let bamato_products = await Apify.openKeyValueStore('bamato-products');

    let categories = {};
    let products = {};

    // noinspection ES6MissingAwait
    await bamato_categories.forEachKey(async category_key => categories[category_key] = await bamato_categories.getValue(category_key));
    // noinspection ES6MissingAwait
    await bamato_products.forEachKey(async product_key => products[product_key] = await bamato_products.getValue(product_key));

    let storage = await Apify.openKeyValueStore();

    let categories_xml = xml_output_categories(dict_values(categories));
    let products_xml = xml_output_products(dict_values(products));

    await storage.setValue(
        'bamato-categories',
        categories_xml,
        {contentType: 'text/xml;charset=UTF-8'}
    );
    await storage.setValue(
        'bamato-products',
        products_xml,
        {contentType: 'text/xml;charset=UTF-8'}
    );

    log.debug('bamato.output - done');
}
