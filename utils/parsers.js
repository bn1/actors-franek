

module.exports = {
    parse_price: (price_string) => {
        let match = price_string.match(/([0-9,.]+)/);

        if (!match) {
            return 0;
        } else {
            price_string = match[1];
        }

        // format X,XXX,XXX.XX
        if (price_string.match(/^(((((\d)?\d)?\d,)*\d)?\d)?\d(\.\d{2})$/)) {
            price_string = price_string.replace(/,/g, '');
        }
        // format X.XXX.XXX,XX
        else if (price_string.match(/^(((((\d)?\d)?\d\.)*\d)?\d)?\d(,\d{2})$/)) {
            price_string = price_string.replace(/\./g, '');
            price_string = price_string.replace(',', '.');
        }

        else {
            throw new Error('invalid price format');
        }

        return parseFloat(price_string);
    },
}
