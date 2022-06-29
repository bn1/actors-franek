// This is the main Node.js source code file of your actor.

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require('apify');
const axios = require('axios');

const {log} = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);


let bamato_crawler = require('./bamato.js');
let drechslershop_crawler = require('./drechslershop.js');


let UPGATES_BASE_URL = 'https://bonado.admin.upgates.com';
let UPGATES_USERNAME = '85530321';
let UPGATES_PASSWORD = 'g5f/l2uODtd3Z9sqhPeC';

let UPGATES_XML_OUTPUT = true;
let UPDATE_UPGATES = false;
let KEYS_TO_OVERRIDE = [];


function create_upgates_connection() {
    return axios.create({baseURL: UPGATES_BASE_URL, auth: {username: UPGATES_USERNAME, password: UPGATES_PASSWORD}})
}


async function get_upgates_categories(upgates_connection) {
    // get data and paginate
    let categories = {};
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
            categories[category.code] = category;
        }
    }

    return categories;
}


async function get_upgates_products(upgates_connection) {
    // get data and paginate
    let products = {};
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
            products[product.code] = product;
        }
    }

    return products;
}


async function get_upgates_data(upgates_connection) {
    let upgates_data = await Promise.allSettled([
        get_upgates_categories(upgates_connection),
        get_upgates_products(upgates_connection)
    ]);

    if (upgates_data.some(item => item.status === 'rejected')) {
        throw new Error('Upgates data were not obtained');
    }

    return {
        categories: upgates_data[0].value,
        products: upgates_data[1].value
    };
}


function update_product_factory(upgates_connection) {
    return function update_product(product_data) {
        return upgates_connection.put('/api/v2/products', {products: [product_data]});
    };
}

//
// // TODO: remove
// let upgates_data = {
//     "categories": {
//         "C-356A192B7913B04C54574D18C28D46E6395428AB": {
//             "code": "C-356A192B7913B04C54574D18C28D46E6395428AB",
//             "category_id": 1,
//             "parent_id": 0,
//             "position": 2,
//             "active_yn": true,
//             "type": "site",
//             "type_of_items": "default",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Top menu",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": null,
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": null,
//             "last_update_time": null,
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/1"
//         },
//         "C-DA4B9237BACCCDF19C0760CAB7AEC4A8359010B0": {
//             "code": "C-DA4B9237BACCCDF19C0760CAB7AEC4A8359010B0",
//             "category_id": 2,
//             "parent_id": 0,
//             "position": 3,
//             "active_yn": true,
//             "type": "site",
//             "type_of_items": "default",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Left menu",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": null,
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": null,
//             "last_update_time": null,
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2"
//         },
//         "C-77DE68DAECD823BABBB58EDB1C8E14D7106E83BB": {
//             "code": "C-77DE68DAECD823BABBB58EDB1C8E14D7106E83BB",
//             "category_id": 3,
//             "parent_id": 0,
//             "position": 4,
//             "active_yn": true,
//             "type": "site",
//             "type_of_items": "default",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Bottom menu",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": null,
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": null,
//             "last_update_time": null,
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/3"
//         },
//         "C-1B6453892473A467D07372D45EB05ABC2031647A": {
//             "code": "C-1B6453892473A467D07372D45EB05ABC2031647A",
//             "category_id": 90,
//             "parent_id": 0,
//             "position": 1,
//             "active_yn": true,
//             "type": "contactMenu",
//             "type_of_items": "default",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [],
//             "images": [],
//             "creation_time": null,
//             "last_update_time": "2020-11-18T15:08:30+0100",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/90"
//         },
//         "62a45821f1c64e3b55301dcf": {
//             "code": "62a45821f1c64e3b55301dcf",
//             "category_id": 2260,
//             "parent_id": 2,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dílna",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dilna",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2260"
//         },
//         "62aa207919b1ff3be4066fb2": {
//             "code": "62aa207919b1ff3be4066fb2",
//             "category_id": 2261,
//             "parent_id": 2260,
//             "position": 9,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2261"
//         },
//         "62aa207919b1ff3be4066fb3": {
//             "code": "62aa207919b1ff3be4066fb3",
//             "category_id": 2262,
//             "parent_id": 2261,
//             "position": 9,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Brusky na sádrokarton",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/brusky-na-sadrokarton",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2262"
//         },
//         "62aa207919b1ff3be4066fb4": {
//             "code": "62aa207919b1ff3be4066fb4",
//             "category_id": 2263,
//             "parent_id": 2261,
//             "position": 8,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Brusky na vrtáky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/brusky-na-vrtaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2263"
//         },
//         "62aa207919b1ff3be4066fb5": {
//             "code": "62aa207919b1ff3be4066fb5",
//             "category_id": 2264,
//             "parent_id": 2261,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Excentrické brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/excentricke-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2264"
//         },
//         "62aa207919b1ff3be4066fb6": {
//             "code": "62aa207919b1ff3be4066fb6",
//             "category_id": 2265,
//             "parent_id": 2261,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Oscilační brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/oscilacni-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2265"
//         },
//         "62aa207919b1ff3be4066fb7": {
//             "code": "62aa207919b1ff3be4066fb7",
//             "category_id": 2266,
//             "parent_id": 2261,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ostatní brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ostatni-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2266"
//         },
//         "62aa207919b1ff3be4066fb8": {
//             "code": "62aa207919b1ff3be4066fb8",
//             "category_id": 2267,
//             "parent_id": 2261,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pásové brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pasove-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2267"
//         },
//         "62aa207919b1ff3be4066fb9": {
//             "code": "62aa207919b1ff3be4066fb9",
//             "category_id": 2268,
//             "parent_id": 2261,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Stolní brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/stolni-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2268"
//         },
//         "62aa207919b1ff3be4066fba": {
//             "code": "62aa207919b1ff3be4066fba",
//             "category_id": 2269,
//             "parent_id": 2261,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vibrační brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vibracni-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2269"
//         },
//         "62aa207919b1ff3be4066fbb": {
//             "code": "62aa207919b1ff3be4066fbb",
//             "category_id": 2270,
//             "parent_id": 2261,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Úhlové brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/uhlove-brusky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2270"
//         },
//         "62a459ce78487a66d630ab76": {
//             "code": "62a459ce78487a66d630ab76",
//             "category_id": 2271,
//             "parent_id": 2260,
//             "position": 8,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Elektrické nářadí",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/elektricke-naradi",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2271"
//         },
//         "62a4867135b0e5222a13cfe5": {
//             "code": "62a4867135b0e5222a13cfe5",
//             "category_id": 2272,
//             "parent_id": 2271,
//             "position": 10,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "AKU rázové utahováky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/aku-razove-utahovaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2272"
//         },
//         "62a48683412b5656bb22af3c": {
//             "code": "62a48683412b5656bb22af3c",
//             "category_id": 2273,
//             "parent_id": 2271,
//             "position": 9,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "AKU vrtačky, šroubováky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/aku-vrtacky-sroubovaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2273"
//         },
//         "62a48692bbb6a21b335de01e": {
//             "code": "62a48692bbb6a21b335de01e",
//             "category_id": 2274,
//             "parent_id": 2271,
//             "position": 8,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Akumulátory a nabíječky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/akumulatory-a-nabijecky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2274"
//         },
//         "62a486e63d4ce46384227f6d": {
//             "code": "62a486e63d4ce46384227f6d",
//             "category_id": 2275,
//             "parent_id": 2271,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Leštičky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/lesticky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2275"
//         },
//         "62a486f328113e1eb218edee": {
//             "code": "62a486f328113e1eb218edee",
//             "category_id": 2276,
//             "parent_id": 2271,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Nůžky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/nuzky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2276"
//         },
//         "62a4872bbbb6a21b335de022": {
//             "code": "62a4872bbbb6a21b335de022",
//             "category_id": 2277,
//             "parent_id": 2271,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pistole - horkovzdušné, pájecí, tavné",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pistole-horkovzdusne-pajeci-tavne",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2277"
//         },
//         "62a4872bbbb6a21b335de023": {
//             "code": "62a4872bbbb6a21b335de023",
//             "category_id": 2278,
//             "parent_id": 2277,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Horkovzdušné pistole",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/horkovzdusne-pistole",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2278"
//         },
//         "62a4872bbbb6a21b335de024": {
//             "code": "62a4872bbbb6a21b335de024",
//             "category_id": 2279,
//             "parent_id": 2277,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pájecí pistole, stanice",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pajeci-pistole-stanice",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2279"
//         },
//         "62a4872bbbb6a21b335de025": {
//             "code": "62a4872bbbb6a21b335de025",
//             "category_id": 2280,
//             "parent_id": 2277,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Tavné pistole",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/tavne-pistole",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2280"
//         },
//         "62a4873f13c5b70f6d7ceb65": {
//             "code": "62a4873f13c5b70f6d7ceb65",
//             "category_id": 2281,
//             "parent_id": 2271,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Příslušenství k elektrickému nářadí",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/prislusenstvi-k-elektrickemu-naradi",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2281"
//         },
//         "62a487484716315584418285": {
//             "code": "62a487484716315584418285",
//             "category_id": 2282,
//             "parent_id": 2271,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Sponkovačky a hřebíkovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/sponkovacky-a-hrebikovacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2282"
//         },
//         "62a48b1afde20412b94370d5": {
//             "code": "62a48b1afde20412b94370d5",
//             "category_id": 2283,
//             "parent_id": 2271,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářecí technika",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svareci-technika",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2283"
//         },
//         "62a48b1afde20412b94370d7": {
//             "code": "62a48b1afde20412b94370d7",
//             "category_id": 2284,
//             "parent_id": 2283,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pájení/ cínování/ letování",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pajeni-cinovani-letovani",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2284"
//         },
//         "62a48752bbb6a21b335de026": {
//             "code": "62a48752bbb6a21b335de026",
//             "category_id": 2285,
//             "parent_id": 2271,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vrtačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vrtacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2285"
//         },
//         "62a45f4217ce05666b0a9582": {
//             "code": "62a45f4217ce05666b0a9582",
//             "category_id": 2286,
//             "parent_id": 2,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dílenské vybavení",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dilenske-vybaveni",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2286"
//         },
//         "62a45f4217ce05666b0a9583": {
//             "code": "62a45f4217ce05666b0a9583",
//             "category_id": 2287,
//             "parent_id": 2286,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dílenský nábytek",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dilensky-nabytek",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2287"
//         },
//         "62a45f4217ce05666b0a9584": {
//             "code": "62a45f4217ce05666b0a9584",
//             "category_id": 2288,
//             "parent_id": 2287,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dílenské skříně",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dilenske-skrine",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2288"
//         },
//         "62a45f4217ce05666b0a9585": {
//             "code": "62a45f4217ce05666b0a9585",
//             "category_id": 2289,
//             "parent_id": 2287,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dílenské stoly a ponky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dilenske-stoly-a-ponky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2289"
//         },
//         "62a45f4217ce05666b0a9586": {
//             "code": "62a45f4217ce05666b0a9586",
//             "category_id": 2290,
//             "parent_id": 2287,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kufry a organizéry na nářadí",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kufry-a-organizery-na-naradi",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2290"
//         },
//         "62a45f4217ce05666b0a9587": {
//             "code": "62a45f4217ce05666b0a9587",
//             "category_id": 2291,
//             "parent_id": 2287,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Skladové regály",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/skladove-regaly",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2291"
//         },
//         "62a4c9fd54fb9300784e9126": {
//             "code": "62a4c9fd54fb9300784e9126",
//             "category_id": 2292,
//             "parent_id": 2260,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Hydraulické lisy",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/hydraulicke-lisy",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2292"
//         },
//         "62aa147814bca06a557dc36f": {
//             "code": "62aa147814bca06a557dc36f",
//             "category_id": 2293,
//             "parent_id": 2260,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Motorové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/motorove-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2293"
//         },
//         "62aa102ab027c34843528ed3": {
//             "code": "62aa102ab027c34843528ed3",
//             "category_id": 2294,
//             "parent_id": 2260,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2294"
//         },
//         "62aa102ab027c34843528ed4": {
//             "code": "62aa102ab027c34843528ed4",
//             "category_id": 2295,
//             "parent_id": 2294,
//             "position": 11,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kotoučové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kotoucove-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2295"
//         },
//         "62aa102ab027c34843528ed5": {
//             "code": "62aa102ab027c34843528ed5",
//             "category_id": 2296,
//             "parent_id": 2294,
//             "position": 10,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Okružní pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/okruzni-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2296"
//         },
//         "62aa102ab027c34843528ed6": {
//             "code": "62aa102ab027c34843528ed6",
//             "category_id": 2297,
//             "parent_id": 2294,
//             "position": 9,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ostřičky řetězů",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ostricky-retezu",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2297"
//         },
//         "62aa102ab027c34843528ed7": {
//             "code": "62aa102ab027c34843528ed7",
//             "category_id": 2298,
//             "parent_id": 2294,
//             "position": 8,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pily ocasky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pily-ocasky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2298"
//         },
//         "62aa102ab027c34843528ed8": {
//             "code": "62aa102ab027c34843528ed8",
//             "category_id": 2299,
//             "parent_id": 2294,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pokosové a kapovací pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pokosove-a-kapovaci-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2299"
//         },
//         "62aa102ab027c34843528ed9": {
//             "code": "62aa102ab027c34843528ed9",
//             "category_id": 2300,
//             "parent_id": 2294,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ponorné pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ponorne-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2300"
//         },
//         "62aa102ab027c34843528eda": {
//             "code": "62aa102ab027c34843528eda",
//             "category_id": 2301,
//             "parent_id": 2294,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pásové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pasove-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2301"
//         },
//         "62aa102ab027c34843528edb": {
//             "code": "62aa102ab027c34843528edb",
//             "category_id": 2302,
//             "parent_id": 2294,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Přímočaré pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/primocare-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2302"
//         },
//         "62aa102ab027c34843528edc": {
//             "code": "62aa102ab027c34843528edc",
//             "category_id": 2303,
//             "parent_id": 2294,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Stolní pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/stolni-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2303"
//         },
//         "62aa114198987c5e76470db8": {
//             "code": "62aa114198987c5e76470db8",
//             "category_id": 2304,
//             "parent_id": 2294,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vyvětvovací pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vyvetvovaci-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2304"
//         },
//         "62aa102ab027c34843528edd": {
//             "code": "62aa102ab027c34843528edd",
//             "category_id": 2305,
//             "parent_id": 2294,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Řetězové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/retezove-pily",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2305"
//         },
//         "62a4ca3878487a66d630ac31": {
//             "code": "62a4ca3878487a66d630ac31",
//             "category_id": 2306,
//             "parent_id": 2260,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískování, tryskání",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovani-tryskani",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2306"
//         },
//         "62a4ca3878487a66d630ac35": {
//             "code": "62a4ca3878487a66d630ac35",
//             "category_id": 2307,
//             "parent_id": 2306,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2307"
//         },
//         "62a4ca3878487a66d630ac36": {
//             "code": "62a4ca3878487a66d630ac36",
//             "category_id": 2308,
//             "parent_id": 2307,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Mobilní pískovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/mobilni-piskovacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2308"
//         },
//         "62a4ca3878487a66d630ac37": {
//             "code": "62a4ca3878487a66d630ac37",
//             "category_id": 2309,
//             "parent_id": 2307,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískovací boxy",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovaci-boxy",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2309"
//         },
//         "62aa092d98987c5e76470db0": {
//             "code": "62aa092d98987c5e76470db0",
//             "category_id": 2310,
//             "parent_id": 2260,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vysavače",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vysavace",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2310"
//         },
//         "62aa092d98987c5e76470daf": {
//             "code": "62aa092d98987c5e76470daf",
//             "category_id": 2311,
//             "parent_id": 2260,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vysokotlaké čističe",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vysokotlake-cistice",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2311"
//         },
//         "62a713c2469968328a253670": {
//             "code": "62a713c2469968328a253670",
//             "category_id": 2312,
//             "parent_id": 2260,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Zahradní stroje",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/zahradni-stroje",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2312"
//         },
//         "62a71fc001f71e513671e696": {
//             "code": "62a71fc001f71e513671e696",
//             "category_id": 2313,
//             "parent_id": 2312,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kultivátory",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kultivatory",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2313"
//         },
//         "62a4cd9dedcfa8484c62d10b": {
//             "code": "62a4cd9dedcfa8484c62d10b",
//             "category_id": 2314,
//             "parent_id": 2,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dřevoobráběcí stroje",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/drevoobrabeci-stroje",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2314"
//         },
//         "62a4d158d340aa36fb5e075d": {
//             "code": "62a4d158d340aa36fb5e075d",
//             "category_id": 2315,
//             "parent_id": 2314,
//             "position": 8,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Drtiče větví",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/drtice-vetvi",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2315"
//         },
//         "62a4d3563d4ce46384227fbd": {
//             "code": "62a4d3563d4ce46384227fbd",
//             "category_id": 2316,
//             "parent_id": 2314,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Hoblovací zařízení",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/hoblovaci-zarizeni",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2316"
//         },
//         "62a4d0b73c149a418977a0c6": {
//             "code": "62a4d0b73c149a418977a0c6",
//             "category_id": 2317,
//             "parent_id": 2314,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Motorové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/motorove-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2317"
//         },
//         "62aa14d18744c079e44e4783": {
//             "code": "62aa14d18744c079e44e4783",
//             "category_id": 2318,
//             "parent_id": 2314,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2318"
//         },
//         "62aa14d18744c079e44e4784": {
//             "code": "62aa14d18744c079e44e4784",
//             "category_id": 2319,
//             "parent_id": 2318,
//             "position": 10,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kotoučové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kotoucove-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2319"
//         },
//         "62aa14d18744c079e44e4785": {
//             "code": "62aa14d18744c079e44e4785",
//             "category_id": 2320,
//             "parent_id": 2318,
//             "position": 9,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Okružní pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/okruzni-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2320"
//         },
//         "62aa14d18744c079e44e4786": {
//             "code": "62aa14d18744c079e44e4786",
//             "category_id": 2321,
//             "parent_id": 2318,
//             "position": 8,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ostřičky řetězů",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ostricky-retezu-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2321"
//         },
//         "62aa14d18744c079e44e4787": {
//             "code": "62aa14d18744c079e44e4787",
//             "category_id": 2322,
//             "parent_id": 2318,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pily ocasky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pily-ocasky-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2322"
//         },
//         "62aa14d18744c079e44e4788": {
//             "code": "62aa14d18744c079e44e4788",
//             "category_id": 2323,
//             "parent_id": 2318,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pokosové a kapovací pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pokosove-a-kapovaci-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2323"
//         },
//         "62aa14d18744c079e44e4789": {
//             "code": "62aa14d18744c079e44e4789",
//             "category_id": 2324,
//             "parent_id": 2318,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ponorné pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ponorne-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2324"
//         },
//         "62aa14d18744c079e44e478a": {
//             "code": "62aa14d18744c079e44e478a",
//             "category_id": 2325,
//             "parent_id": 2318,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pásové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pasove-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2325"
//         },
//         "62aa14d18744c079e44e478b": {
//             "code": "62aa14d18744c079e44e478b",
//             "category_id": 2326,
//             "parent_id": 2318,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Přímočaré pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/primocare-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2326"
//         },
//         "62aa14d18744c079e44e478c": {
//             "code": "62aa14d18744c079e44e478c",
//             "category_id": 2327,
//             "parent_id": 2318,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Stolní pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/stolni-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2327"
//         },
//         "62aa14d18744c079e44e478d": {
//             "code": "62aa14d18744c079e44e478d",
//             "category_id": 2328,
//             "parent_id": 2318,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Řetězové pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/retezove-pily-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2328"
//         },
//         "62a4d258f1028c239e04f26e": {
//             "code": "62a4d258f1028c239e04f26e",
//             "category_id": 2329,
//             "parent_id": 2314,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pokosové a kapovací pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pokosove-a-kapovaci-pily-2",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2329"
//         },
//         "62a4d489f1c64e3b55301ece": {
//             "code": "62a4d489f1c64e3b55301ece",
//             "category_id": 2330,
//             "parent_id": 2314,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Sloupové vrtačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/sloupove-vrtacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2330"
//         },
//         "62aa14fd0e8fac1cb6747cc9": {
//             "code": "62aa14fd0e8fac1cb6747cc9",
//             "category_id": 2331,
//             "parent_id": 2314,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Stolní pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/stolni-pily-2",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2331"
//         },
//         "62aa20e1c612a313cd0d6c11": {
//             "code": "62aa20e1c612a313cd0d6c11",
//             "category_id": 2332,
//             "parent_id": 2314,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Úhlové brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/uhlove-brusky-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2332"
//         },
//         "62a45821f1c64e3b55301dce": {
//             "code": "62a45821f1c64e3b55301dce",
//             "category_id": 2333,
//             "parent_id": 2,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kovoobráběcí stroje",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kovoobrabeci-stroje",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2333"
//         },
//         "62a489e34716315584418289": {
//             "code": "62a489e34716315584418289",
//             "category_id": 2334,
//             "parent_id": 2333,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Hydraulické lisy",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/hydraulicke-lisy-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2334"
//         },
//         "62a489e3471631558441828a": {
//             "code": "62a489e3471631558441828a",
//             "category_id": 2335,
//             "parent_id": 2334,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dílenské hydraulické lisy",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dilenske-hydraulicke-lisy",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2335"
//         },
//         "62a4d267e2fc81522c0f4767": {
//             "code": "62a4d267e2fc81522c0f4767",
//             "category_id": 2336,
//             "parent_id": 2333,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pokosové a kapovací pily",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pokosove-a-kapovaci-pily-3",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2336"
//         },
//         "62a6e208332ae45519420908": {
//             "code": "62a6e208332ae45519420908",
//             "category_id": 2337,
//             "parent_id": 2333,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pásové pily na kov",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pasove-pily-na-kov",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2337"
//         },
//         "62a48aefa1a80e03be7e79bc": {
//             "code": "62a48aefa1a80e03be7e79bc",
//             "category_id": 2338,
//             "parent_id": 2333,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískování, tryskání",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovani-tryskani-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2338"
//         },
//         "62a48aefa1a80e03be7e79c0": {
//             "code": "62a48aefa1a80e03be7e79c0",
//             "category_id": 2339,
//             "parent_id": 2338,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovacky-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2339"
//         },
//         "62a48aefa1a80e03be7e79c1": {
//             "code": "62a48aefa1a80e03be7e79c1",
//             "category_id": 2340,
//             "parent_id": 2339,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Mobilní pískovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/mobilni-piskovacky-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2340"
//         },
//         "62a48aefa1a80e03be7e79c2": {
//             "code": "62a48aefa1a80e03be7e79c2",
//             "category_id": 2341,
//             "parent_id": 2339,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískovací boxy",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovaci-boxy-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2341"
//         },
//         "62a4d47c3d4ce46384227fbe": {
//             "code": "62a4d47c3d4ce46384227fbe",
//             "category_id": 2342,
//             "parent_id": 2333,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Sloupové vrtačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/sloupove-vrtacky-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2342"
//         },
//         "62a4d5dc5256e456482f29fc": {
//             "code": "62a4d5dc5256e456482f29fc",
//             "category_id": 2343,
//             "parent_id": 2333,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Soustruhy na kov",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/soustruhy-na-kov",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2343"
//         },
//         "62a4cd9dedcfa8484c62d10a": {
//             "code": "62a4cd9dedcfa8484c62d10a",
//             "category_id": 2344,
//             "parent_id": 2,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Stavební stroje",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/stavebni-stroje",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2344"
//         },
//         "62a4ce12abd34773f61e6c48": {
//             "code": "62a4ce12abd34773f61e6c48",
//             "category_id": 2345,
//             "parent_id": 2344,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Bourací kladiva",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/bouraci-kladiva",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2345"
//         },
//         "62a4ce35ce0dd539521b4242": {
//             "code": "62a4ce35ce0dd539521b4242",
//             "category_id": 2346,
//             "parent_id": 2344,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pískovací boxy",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/piskovaci-boxy-2",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2346"
//         },
//         "62a4cf94edcfa8484c62d10c": {
//             "code": "62a4cf94edcfa8484c62d10c",
//             "category_id": 2347,
//             "parent_id": 2344,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářecí technika",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svareci-technika-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2347"
//         },
//         "62a4cf94edcfa8484c62d10d": {
//             "code": "62a4cf94edcfa8484c62d10d",
//             "category_id": 2348,
//             "parent_id": 2347,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kukly a příslušenství",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kukly-a-prislusenstvi",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2348"
//         },
//         "62a4cf94edcfa8484c62d10f": {
//             "code": "62a4cf94edcfa8484c62d10f",
//             "category_id": 2349,
//             "parent_id": 2347,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Příslušenství ke strojům",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/prislusenstvi-ke-strojum",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2349"
//         },
//         "62a4cf94edcfa8484c62d111": {
//             "code": "62a4cf94edcfa8484c62d111",
//             "category_id": 2350,
//             "parent_id": 2347,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářečky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svarecky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2350"
//         },
//         "62a4cf94edcfa8484c62d113": {
//             "code": "62a4cf94edcfa8484c62d113",
//             "category_id": 2351,
//             "parent_id": 2350,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářecí invertor MMA",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svareci-invertor-mma",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2351"
//         },
//         "62a4cf94edcfa8484c62d114": {
//             "code": "62a4cf94edcfa8484c62d114",
//             "category_id": 2352,
//             "parent_id": 2350,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářečky CO2 (MIG/MAG)",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svarecky-co2-mig-mag",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2352"
//         },
//         "62a4cf94edcfa8484c62d115": {
//             "code": "62a4cf94edcfa8484c62d115",
//             "category_id": 2353,
//             "parent_id": 2350,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářečky TIG",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svarecky-tig",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2353"
//         },
//         "62a4cf94edcfa8484c62d116": {
//             "code": "62a4cf94edcfa8484c62d116",
//             "category_id": 2354,
//             "parent_id": 2350,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Svářečky plastů",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/svarecky-plastu",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2354"
//         },
//         "62a4ce8e0a081d093700fdc4": {
//             "code": "62a4ce8e0a081d093700fdc4",
//             "category_id": 2355,
//             "parent_id": 2344,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vysokotlaké čističe",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vysokotlake-cistice-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2355"
//         },
//         "62a4ce4e4f9f705c4c708a28": {
//             "code": "62a4ce4e4f9f705c4c708a28",
//             "category_id": 2356,
//             "parent_id": 2344,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Úhlové brusky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/uhlove-brusky-2",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2356"
//         },
//         "62a460555256e456482f2923": {
//             "code": "62a460555256e456482f2923",
//             "category_id": 2357,
//             "parent_id": 2,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vzduchotechnika",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vzduchotechnika",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2357"
//         },
//         "62a460555256e456482f2929": {
//             "code": "62a460555256e456482f2929",
//             "category_id": 2358,
//             "parent_id": 2357,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Kompresory",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/kompresory",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2358"
//         },
//         "62a460555256e456482f292a": {
//             "code": "62a460555256e456482f292a",
//             "category_id": 2359,
//             "parent_id": 2358,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Příslušenství kompresoru",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/prislusenstvi-kompresoru",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2359"
//         },
//         "62a460555256e456482f292b": {
//             "code": "62a460555256e456482f292b",
//             "category_id": 2360,
//             "parent_id": 2358,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Tlakové nádoby/ Vzdušníky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/tlakove-nadoby-vzdusniky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2360"
//         },
//         "62a460555256e456482f292c": {
//             "code": "62a460555256e456482f292c",
//             "category_id": 2361,
//             "parent_id": 2358,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vzduchové kompresory",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vzduchove-kompresory",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2361"
//         },
//         "62a460555256e456482f292d": {
//             "code": "62a460555256e456482f292d",
//             "category_id": 2362,
//             "parent_id": 2361,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ostatní kompresory",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ostatni-kompresory",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2362"
//         },
//         "62a460555256e456482f292e": {
//             "code": "62a460555256e456482f292e",
//             "category_id": 2363,
//             "parent_id": 2361,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Press-Hammer Classic",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/press-hammer-classic",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2363"
//         },
//         "62a460555256e456482f292f": {
//             "code": "62a460555256e456482f292f",
//             "category_id": 2364,
//             "parent_id": 2361,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Press-Hammer Super Classic",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/press-hammer-super-classic",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2364"
//         },
//         "62a460555256e456482f2930": {
//             "code": "62a460555256e456482f2930",
//             "category_id": 2365,
//             "parent_id": 2361,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pístové olejové kompresory",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pistove-olejove-kompresory",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2365"
//         },
//         "62a460555256e456482f2936": {
//             "code": "62a460555256e456482f2936",
//             "category_id": 2366,
//             "parent_id": 2357,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vzduchové nářadí",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vzduchove-naradi",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2366"
//         },
//         "62a460555256e456482f2937": {
//             "code": "62a460555256e456482f2937",
//             "category_id": 2367,
//             "parent_id": 2366,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Brusky a leštičky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/brusky-a-lesticky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2367"
//         },
//         "62a460555256e456482f2938": {
//             "code": "62a460555256e456482f2938",
//             "category_id": 2368,
//             "parent_id": 2366,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Hřebíkovačky a sponkovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/hrebikovacky-a-sponkovacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2368"
//         },
//         "62a460555256e456482f293d": {
//             "code": "62a460555256e456482f293d",
//             "category_id": 2369,
//             "parent_id": 2366,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pneumatické rázové utahováky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pneumaticke-razove-utahovaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2369"
//         },
//         "62a460555256e456482f293f": {
//             "code": "62a460555256e456482f293f",
//             "category_id": 2370,
//             "parent_id": 2366,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Ráčnové pneumatické utahovačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/racnove-pneumaticke-utahovacky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2370"
//         },
//         "62a460555256e456482f2941": {
//             "code": "62a460555256e456482f2941",
//             "category_id": 2371,
//             "parent_id": 2366,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Vrtačky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/vrtacky-1",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2371"
//         },
//         "62a460555256e456482f2942": {
//             "code": "62a460555256e456482f2942",
//             "category_id": 2372,
//             "parent_id": 2357,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Úprava vzduchu",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/uprava-vzduchu",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2372"
//         },
//         "62a460555256e456482f2943": {
//             "code": "62a460555256e456482f2943",
//             "category_id": 2373,
//             "parent_id": 2372,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Filtry/ Odlučovače",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/filtry-odlucovace",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2373"
//         },
//         "62a460555256e456482f2945": {
//             "code": "62a460555256e456482f2945",
//             "category_id": 2374,
//             "parent_id": 2372,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Regulátory tlaku",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/regulatory-tlaku",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2374"
//         },
//         "62a45b5f30145a57ff5aedc6": {
//             "code": "62a45b5f30145a57ff5aedc6",
//             "category_id": 2375,
//             "parent_id": 2,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Zdvihací a manipulační technika",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/zdvihaci-a-manipulacni-technika",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2375"
//         },
//         "62a4893a745e4718b530337f": {
//             "code": "62a4893a745e4718b530337f",
//             "category_id": 2376,
//             "parent_id": 2375,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Autozvedáky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/autozvedaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2376"
//         },
//         "62a48cb017ce05666b0a95db": {
//             "code": "62a48cb017ce05666b0a95db",
//             "category_id": 2377,
//             "parent_id": 2376,
//             "position": 7,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Dvousloupové zvedáky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/dvousloupove-zvedaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2377"
//         },
//         "62a48cbb35b0e5222a13d006": {
//             "code": "62a48cbb35b0e5222a13d006",
//             "category_id": 2378,
//             "parent_id": 2376,
//             "position": 6,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Jednosloupové zvedáky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/jednosloupove-zvedaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2378"
//         },
//         "62a4893a745e4718b5303380": {
//             "code": "62a4893a745e4718b5303380",
//             "category_id": 2379,
//             "parent_id": 2376,
//             "position": 5,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Nůžkové zvedáky na auto",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/nuzkove-zvedaky-na-auto",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2379"
//         },
//         "62a48cc8bbb6a21b335de034": {
//             "code": "62a48cc8bbb6a21b335de034",
//             "category_id": 2380,
//             "parent_id": 2376,
//             "position": 4,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Nůžkové zvedáky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/nuzkove-zvedaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:46+0200",
//             "last_update_time": "2022-06-21T14:13:46+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2380"
//         },
//         "62a48990c6ab2a400015b720": {
//             "code": "62a48990c6ab2a400015b720",
//             "category_id": 2381,
//             "parent_id": 2376,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Příslušenství ke zvedákům",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/prislusenstvi-ke-zvedakum",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2381"
//         },
//         "62a4893a745e4718b5303381": {
//             "code": "62a4893a745e4718b5303381",
//             "category_id": 2382,
//             "parent_id": 2376,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Sloupové zvedáky na auto",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/sloupove-zvedaky-na-auto",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2382"
//         },
//         "62a48d053d4ce46384227f79": {
//             "code": "62a48d053d4ce46384227f79",
//             "category_id": 2383,
//             "parent_id": 2376,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Čtyřsloupové zvedáky",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/ctyrsloupove-zvedaky",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2383"
//         },
//         "62a714c49899297ef539e6fe": {
//             "code": "62a714c49899297ef539e6fe",
//             "category_id": 2384,
//             "parent_id": 2375,
//             "position": 3,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Manipulační technika",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/manipulacni-technika",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2384"
//         },
//         "62a4894ca1a80e03be7e79b6": {
//             "code": "62a4894ca1a80e03be7e79b6",
//             "category_id": 2385,
//             "parent_id": 2375,
//             "position": 2,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Motocyklové zvedáky / stojany",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/motocyklove-zvedaky-stojany",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2385"
//         },
//         "62a4894ca1a80e03be7e79b7": {
//             "code": "62a4894ca1a80e03be7e79b7",
//             "category_id": 2386,
//             "parent_id": 2385,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Plošinové zvedáky na moto",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/plosinove-zvedaky-na-moto",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2386"
//         },
//         "62a4896de2fc81522c0f46fc": {
//             "code": "62a4896de2fc81522c0f46fc",
//             "category_id": 2387,
//             "parent_id": 2375,
//             "position": 1,
//             "active_yn": true,
//             "type": "siteWithProducts",
//             "type_of_items": "withoutSubcategories",
//             "manufacturer": null,
//             "label": null,
//             "show_in_menu_yn": true,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "name": "Pojízdné zvedáky / Hevery",
//                     "name_h1": null,
//                     "description_text": null,
//                     "url": "https://bonado.upgates.shop/pojizdne-zvedaky-hevery",
//                     "link_url": null
//                 }
//             ],
//             "images": [],
//             "creation_time": "2022-06-21T14:13:47+0200",
//             "last_update_time": "2022-06-21T14:13:47+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/manager-content/category/edit/default/2387"
//         }
//     },
//     "products": {
//         "BCS-500PRO": {
//             "code": "BCS-500PRO",
//             "code_supplier": null,
//             "ean": null,
//             "product_id": 7796,
//             "active_yn": true,
//             "archived_yn": false,
//             "replacement_product_code": null,
//             "can_add_to_basket_yn": true,
//             "adult_yn": false,
//             "descriptions": [
//                 {
//                     "language": "cs",
//                     "title": "BAMATO  BCS-500PRO (400V) kotoučová stolní pila",
//                     "short_description": "Kotoučová stolní pila BAMATO řady BTS-250PRO je vybavena stabilním paralelním dorazem, který je veden na vysoce kvalitní vodicí kolejnici. Spolu s pevným odlévacím stolem to vede k dokonalému výsledku řezání. Pro dokonalé snadné použití lze pilový kotouč nastavit výškově nebo sklonem až na 45° pomocí ručních kol a Slaka. Posuvný stůl je také vyráběn jako stůl s plným litým tělesem a má mimo jiné úhlově nastavitelnou dorazovou lištu s přidržením.",
//                     "long_description": null,
//                     "url": "https://bonado.upgates.shop/p/bamato-bcs-500pro-400v-kotoucova-stolni-pila",
//                     "unit": "ks"
//                 }
//             ],
//             "manufacturer": "BAMATO",
//             "stock": null,
//             "stock_position": null,
//             "availability": null,
//             "availability_type": null,
//             "weight": null,
//             "shipment_group": null,
//             "images": [],
//             "categories": [],
//             "groups": [],
//             "prices": [
//                 {
//                     "currency": "CZK",
//                     "language": "cs",
//                     "pricelists": [
//                         {
//                             "name": "Výchozí",
//                             "price_original": 0,
//                             "product_discount": null,
//                             "product_discount_real": 0,
//                             "price_sale": null,
//                             "price_with_vat": 0,
//                             "price_without_vat": 0
//                         }
//                     ],
//                     "price_purchase": null,
//                     "price_common": 0,
//                     "vat": 21,
//                     "recycling_fee": null
//                 }
//             ],
//             "variants": [],
//             "metas": [
//                 {
//                     "key": "col",
//                     "type": "input",
//                     "value": ""
//                 },
//                 {
//                     "key": "cont",
//                     "type": "input",
//                     "value": ""
//                 }
//             ],
//             "creation_time": "2022-06-22T10:56:47+0200",
//             "last_update_time": "2022-06-22T11:15:14+0200",
//             "admin_url": "https://bonado.admin.upgates.com/manager/products/main/default/7796"
//         }
//     }
// }

Apify.main(async () => {
    // Get input of the actor (here only for demonstration purposes).
    let input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    let upgates_connection, upgates_product, upgates_data;

    if (UPDATE_UPGATES) {
        upgates_connection = create_upgates_connection();

        update_product = update_product_factory(upgates_connection);
        upgates_data = await get_upgates_data(upgates_connection);
    } else {
        upgates_data = {};
        update_product = null;
    }

    await Promise.allSettled([
        bamato_crawler.run({
            upgates_data,
            update_product,
            upgates_xml_output: UPGATES_XML_OUTPUT,
            keys_to_override: KEYS_TO_OVERRIDE
        }),
        // drechslershop_crawler.run()
    ]);

    log.debug('Crawler finished.');
    /**
     * Actor code
     */
});
