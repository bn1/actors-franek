

function update_product_factory(upgates_connection) {
    return function update_product(product_data) {
        return upgates_connection.put('/api/v2/products', {products: [product_data]});
    };
}


module.exports = async () => {}
