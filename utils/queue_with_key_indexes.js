const Apify = require("apify");


const {log} = Apify.utils;


let STORE_ROUTER = {};


async function queue_with_key_indexes(store_name) {
    STORE_ROUTER[store_name] = {
        kv_store: await Apify.openKeyValueStore(store_name),
        queue: await Apify.openRequestQueue(store_name),
        _map: await Apify.openKeyValueStore(`_${ store_name }`)
    };

    let _get_url_key = (key) => `https://example.com/${ key }`;
    let _get_key_from_url = (url) => url.slice(20);
    let _get_request = async (key) => new Apify.Request(await STORE_ROUTER[store_name]._map.getValue(key));
    let _normalize_key = (key) => key.replace(/\//g, '').replace(/:/g, '');

    return {
        getValue: async (key) => await STORE_ROUTER[store_name].kv_store.getValue(_normalize_key(key)),
        setValue: async (key, value) => {
            key = _normalize_key(key);
            await STORE_ROUTER[store_name].queue.addRequest({url: _get_url_key(key)});
            await STORE_ROUTER[store_name].kv_store.setValue(key, value);
        },
        fetchNext: async () => {
            let next_request = await STORE_ROUTER[store_name].queue.fetchNextRequest();
            if (next_request) {
                log.debug(`key: ${ next_request.url }`);
                await STORE_ROUTER[store_name]._map.setValue(_get_key_from_url(next_request.url), next_request);
                return await STORE_ROUTER[store_name].kv_store.getValue(_get_key_from_url(next_request.url));
            }
        },
        markHandled: async (key) => await STORE_ROUTER[store_name].queue.markRequestHandled(await _get_request(_normalize_key(key))),
        reclaim: async (key) => await STORE_ROUTER[store_name].queue.reclaimRequest(await _get_request(_normalize_key(key))),
        getInfo: async () => {
            let info = await STORE_ROUTER[store_name].queue.getInfo();
            return {
                totalCount: info.totalRequestCount,
                handledCount: info.handledRequestCount,
                pendingCount: info.pendingRequestCount
            }
        }
    };
}


module.exports = {queue_with_key_indexes}
