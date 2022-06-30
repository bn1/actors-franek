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

    let bamato_categories = await Apify.openDataset('bamato-categories');
    let bamato_products = await Apify.openDataset('bamato-products');

    let categories = {};
    let products = {};

    // noinspection ES6MissingAwait
    await bamato_categories.forEach(async category => categories[category.code] = category);
    // noinspection ES6MissingAwait
    await bamato_products.forEach(async product => products[product.code] = product);

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
