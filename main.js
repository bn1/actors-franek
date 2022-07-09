require('./utils');


// This is the main Node.js source code file of your actor.

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require("apify");

const upgates = require('./upgates');
const bamato = require('./bamato');
const drechslershop = require('./drechslershop');
const holzmann = require('./holzmann');

const {log} = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);


const config = require("./utils/config");

const EUR_RATIO = 24.74;

const DEEPL_API_KEY = 'b4cd58c7-0740-f6a0-7dcd-f218afd76f10:fx';

const UPGATES_BASE_URL = 'https://bonado.admin.upgates.com';
const UPGATES_USERNAME = '85530321';
const UPGATES_PASSWORD = 'g5f/l2uODtd3Z9sqhPeC';

const UPGATES_XML_OUTPUT = true;
const UPDATE_UPGATES = false;
const KEYS_TO_OVERRIDE = [];

config.set('EUR_RATIO', EUR_RATIO);

config.set('UPGATES_BASE_URL', UPGATES_BASE_URL);
config.set('UPGATES_USERNAME', UPGATES_USERNAME);
config.set('UPGATES_PASSWORD', UPGATES_PASSWORD);

config.set('DEEPL_API_KEY', DEEPL_API_KEY);


Apify.main(async () => {
    // Get input of the actor (here only for demonstration purposes).
    let input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    // let results = await Promise.allSettled([
    //     (async () => {
            await upgates.download();
    //     // })(),
    //     // (async () => {
            await bamato.download();
            await bamato.parse();
    //     // })(),
    //     // (async () => {
    //         await drechslershop.download();
    //         await drechslershop.parse();
    //     // })(),
    //     // (async () => {
    //         await holzmann.download();
    //         await holzmann.parse();
    //     // })()
    // // ])
    //
    // await upgates.update()
    //
    await bamato.transform();
    await bamato.output()
    // await drechslershop.output()
    // await holzmann.output()
    // await Promise.allSettled([
    //     upgates.update(),
    //
    //     bamato.output(),
    //     drechslershop.output(),
    //     holzmann.output()
    // ])

    log.debug('Crawler finished.');
});
