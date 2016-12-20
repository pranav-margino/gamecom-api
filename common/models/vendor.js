var _ = require('lodash');
var async = require('async');
var app = require('../../server/server');
var debug = require('debug')('favourite');
var colors = require('colors');


module.exports = function(Vendor) {
    Vendor.getNames = function(ids, cb) {
        ids = Object.prototype.toString.call(ids) == '[object Array]' ? ids : [ids];
        async.map(ids, function(id, callback) {
            Vendor.findById(id, {
                fields: {
                    id: true,
                    name: true,
                    displayName: true,
                    legalName: true,
                    _brandLogo: true
                }
            }, function(err, vendor) {
                callback(null, vendor);
            })
        }, function(err, result) {
            return cb(err, result);
        });
    }


    Vendor.getConsumers = function(id, cb) {
        app.models.Favourite.find({ where: { 'product.vendorId': id }, order: 'createdAt DESC' }, function(err, favourites) {
            var consumers = _.map(favourites, function(favourite) {
                return _.merge(favourite.user, { product: favourite.product, lastSeen: favourite.createdAt });
            });


            return cb(err, _.uniqBy(consumers, function(consumer) {
                return consumer.id;
            }));
        })
    }

    Vendor.getProducts = function(id, cb) {
        app.models.Favourite.find({ where: { 'product.vendorId': id }, order: 'createdAt DESC' }, function(err, favourites) {
            var products = _.map(favourites, function(favourite) {
                return favourite.product;
            });


            return cb(err, _.uniqBy(products, function(product) {
                return product.id;
            }));

        })
    }

    Vendor.remoteMethod('getProducts', {
        http: {
            path: '/getProducts',
            verb: 'GET'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'products',
            type: 'array'
        }
    });

    Vendor.remoteMethod('getConsumers', {
        http: {
            path: '/getConsumers',
            verb: 'GET'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'consumers',
            type: 'array'
        }
    });

    Vendor.getProductsConsumers = function(id, cb) {
        app.models.Favourite.find({ where: { 'product.vendorId': id } }, function(err, favourites) {
            return cb(err, _.groupBy(favourites, function(favourite) {
                return favourite.product.id;
            }));
        })
    }

    Vendor.remoteMethod('getProductsConsumers', {
        http: {
            path: '/getProductsConsumers',
            verb: 'GET'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'consumers',
            type: 'array'
        }
    });

    Vendor.remoteMethod('getNames', {
        http: {
            path: '/getNames',
            verb: 'post'
        },
        accepts: {
            arg: 'idsArray',
            type: 'array'
        },
        returns: {
            arg: 'vendors',
            type: 'array'
        }
    });
};
