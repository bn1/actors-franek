

const cd = (text) => `<![CDATA[\n${ text }\n]]>`


module.exports = {
    xml_output_categories: (categories) => {
        let xml_output = '<CATEGORIES version="1">'

        for (let category of categories) {
            let descriptions = ''
            for (let description of category.descriptions) {
                descriptions += `
                    <DESCRIPTION language="${ description.language }">
                        <NAME>${ cd(description.name) }</NAME>
                        <NAME_H1>${ cd(description.name_h1) }</NAME_H1>
                    </DESCRIPTION>
                `
            }

            xml_output += `
                <CATEGORY>
                    <CODE>${ category.code }</CODE>
                    <CATEGORY_ID>${ category.category_id }</CATEGORY_ID>
                    <PARENT_ID>${ category.parent_id }</PARENT_ID>
                    <ACTIVE_YN>${ Number(category.active_yn) }</ACTIVE_YN>
                    <TYPE>${ category.type }</TYPE>
                    <TYPE_OF_ITEMS>${ category.type_of_items }</TYPE_OF_ITEMS>
                    <DESCRIPTIONS>${ descriptions }</DESCRIPTIONS>
                </CATEGORY>
            `
        }

        xml_output += '</CATEGORIES>';

        return xml_output;
    },

    xml_output_products: (products) => {
        let xml_output = '<PRODUCTS version="2.0">';

        for (let product of products) {
            let descriptions = '';
            for (let description of product.descriptions) {
                descriptions += `
                    <DESCRIPTION language="${ description.language }">
                        <TITLE>${ cd(description.title) }</TITLE>
                        <LONG_DESCRIPTION>${ cd(description.long_description) }</LONG_DESCRIPTION>
                    </DESCRIPTION>
                `
            }

            let parameters = '';
            for (let parameter of product.parameters) {
                parameters += `
                    <PARAMETER>
                        <NAME>${ cd(parameter.name) }</NAME>
                        <VALUE>${ cd(parameter.value) }</VALUE>
                    </PARAMETER>
                `
            }

            let images = '';
            for (let image of product.images) {
                images += `
                    <IMAGE>
                        <URL>${ image.url }</URL>
                    </IMAGE>
                `
            }

            let categories = '';
            for (let category of product.categories) {
                categories += `
                    <CATEGORY>
                        <CODE>${ category.code }</CODE>
                    </CATEGORY>
                `
            }

            let prices = '';
            for (let price of product.prices) {
                let pricelists = '';
                for (let pricelist of price.pricelists) {
                    pricelists += `
                        <PRICELIST>
                            <PRICE_ORIGINAL>${ pricelist.price_original }</PRICE_ORIGINAL>
                        </PRICELIST>
                    `
                }

                prices += `
                    <PRICE language="${ price.language }">
                        <PRICELISTS>${ pricelists }</PRICELISTS>
                        <CURRENCY>${ price.currency }</CURRENCY>
                    </PRICE>
                `
            }

            let related_products = '';
            for (let related_product of product.related_products) {
                if (related_product.code) {
                    related_products += `
                    <CODE>${ related_product.code }</CODE>
                `;
                }
            }

            let vats = '';
            for (let vat of product.vats) {
                vats += `<VAT language="${ vat.language }">${ vat.vat }</VAT>`
            }

            xml_output += `
                        <PRODUCT>
                            <CODE>${ product.code }</CODE>
                            <ACTIVE_YN>${ Number(product.active_yn) }</ACTIVE_YN>
                            <ARCHIVED_YN>${ Number(product.archived_yn) }</ARCHIVED_YN>
                            <CAN_ADD_TO_BASKET_YN>${ Number(product.can_add_to_basket_yn) }</CAN_ADD_TO_BASKET_YN>
                            <ADULT_YN>${ Number(product.adult_yn) }</ADULT_YN>
                            <DESCRIPTIONS>${ descriptions }</DESCRIPTIONS>
                            <PARAMETERS>${ parameters }</PARAMETERS>
                            <MANUFACTURER>${ cd(product.manufacturer) }</MANUFACTURER>
                            <AVAILABILITY>${ cd(product.availability) }</AVAILABILITY>
                            <WEIGHT>${ product.weight }</WEIGHT>
                            <IMAGES>${ images }</IMAGES>
                            <CATEGORIES>${ categories }</CATEGORIES>
                            <PRICES>${ prices }</PRICES>
                            <VATS>${ vats }</VATS>
                            <RELATED_PRODUCTS>${ related_products }</RELATED_PRODUCTS>
                        </PRODUCT>
                    `
        }

        xml_output += '</PRODUCTS>';

        return xml_output;
    }
}
