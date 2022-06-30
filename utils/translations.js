const Apify = require("apify");
const axios = require("axios");
const qs = require("qs");

const config = require("./config");


let _store;
async function translate(text, target_lang) {
    if (!_store) {
        _store = await Apify.openKeyValueStore('translations');
    }

    let translation_key = String(`(${target_lang}) ${text}`.hashCode());
    let translation = await _store.getValue(translation_key);

    if (!translation) {
        let auth_key = config.get('DEEPL_API_KEY');
        let response = await axios.post(
            'https://api-free.deepl.com/v2/translate',
            qs.stringify({auth_key, text, target_lang}),
            {params: {auth_key}}
        );
        translation = response.data.translations[0].text;

        await _store.setValue(translation_key, translation);
    }

    return translation;
}


module.exports = {translate}
