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
    log.debug('drechslershop.output');

    let drechslershop_categories = await Apify.openDataset('drechslershop-categories');
    let drechslershop_products = await Apify.openDataset('drechslershop-products');

    let categories = {};
    let products = {};

    // noinspection ES6MissingAwait
    await drechslershop_categories.forEach(async category => categories[category.code] = category);
    // noinspection ES6MissingAwait
    await drechslershop_products.forEach(async product => products[product.code] = product);

    let storage = await Apify.openKeyValueStore();

    let categories_xml = xml_output_categories(dict_values(categories));
    let products_xml = xml_output_products(dict_values(products));

    await storage.setValue(
        'drechslershop-categories',
        categories_xml,
        {contentType: 'text/xml;charset=UTF-8'}
    );
    await storage.setValue(
        'drechslershop-products',
        products_xml,
        {contentType: 'text/xml;charset=UTF-8'}
    );

    log.debug('drechslershop.output - done');
}
