

let config = {
    _store: {},
    get: (key) => config._store[key],
    set: (key, value) => config._store[key] = value
};


module.exports = config
