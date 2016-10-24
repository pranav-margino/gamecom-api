var cheerio = require('cheerio');
var request = require('request');
module.exports = function(Product) {
    Product.scrape = function(link, cb) {
        request(link, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                return cb(null, {
                    link: link,
                    title: $('#productTitle').text().trim(),
                    price: $('#priceblock_ourprice').text().trim(),
                    description: $('#feature-bullets').text().trim().replace(/\n\t\t\t\t\t\n\t\t\t\t\t\t/g,"\n"),
                    pictureUrl: $('img.a-dynamic-image').data('oldHires')
                });
            }
        })

    }
    Product.remoteMethod('scrape', {
        http: {
            path: '/scrape',
            verb: 'get'
        },
        accepts: [{
            arg: 'link',
            type: 'string'
        }],
        returns: {
            arg: 'productData',
            type: 'object'
        }
    });
}
