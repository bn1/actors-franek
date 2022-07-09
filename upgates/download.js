const axios = require("axios");
const config = require('../utils/config')
const Apify = require("apify");


const {log} = Apify.utils;


function create_upgates_connection() {
    return  axios.create({
        baseURL: config.get('UPGATES_BASE_URL'),
        auth: {
            username: config.get('UPGATES_USERNAME'),
            password: config.get('UPGATES_PASSWORD')
        }
    });
}


async function get_upgates_categories(upgates_connection) {
    // get data and paginate
    let categories = [];
    let response = {
        status: 200,
        data: {
            current_page: 0,
            number_of_pages: 1
        }
    }

    while (response.status === 200 && response.data.current_page < response.data.number_of_pages) {
        response = await upgates_connection.get('/api/v2/categories', {params: {page: response.data.current_page + 1}});

        for (let category of response.data.categories) {
            categories.push(category);
        }
    }

    return categories;
}


async function get_upgates_products(upgates_connection) {
    // get data and paginate
    let products = [];
    let response = {
        status: 200,
        data: {
            current_page: 0,
            number_of_pages: 1
        }
    }

    while (response.status === 200 && response.data.current_page < response.data.number_of_pages) {
        response = await upgates_connection.get('/api/v2/products', {params: {page: response.data.current_page + 1}});

        for (let product of response.data.products) {
            products.push(product);
        }
    }

    return products;
}


module.exports = async () => {
    log.debug('upgates.download');

    let categories = await Apify.openKeyValueStore('upgates-categories');
    let products = await Apify.openKeyValueStore('upgates-products');

    let connection = create_upgates_connection();
    for (let category of (await get_upgates_categories(connection))) {
        await categories.setValue(category.code, category);
    }

    for (let product of (await get_upgates_products(connection))) {
        await products.setValue(product.code, product);
    }

    log.debug('upgates.download - done');
}
