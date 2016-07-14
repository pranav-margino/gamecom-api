var app = require('../../server/server');
var async = require('async');
module.exports = function(Coupon) {
    Coupon.observe('after save', function(ctx, next) {
        var instance = ctx.instance;
        var Vendor = app.models.Vendor;
        var Store = app.models.Store;
        Vendor.findById(instance.vendorId, {
            include: "stores"
        }, function(err, vendor) {
            var idArray = [];
            vendor.stores(function(err, stores) {
                for (var i = 0; i < stores.length; i++) {
                    idArray.push(stores[i].id);
                };
                Store.addCoupon(idArray, instance);
            });
        });
        next();
    });
    Coupon.getNames = function(ids, cb) {
        ids = Object.prototype.toString.call(ids) == '[object Array]' ? ids : [ids];
        async.map(ids, function(id, callback) {
            Coupon.findById(id, {
                fields: {
                    id: true,
                    title: true,
                    superTitle: true,
                    categories: true
                }
            }, function(err, coupon) {
                callback(null, coupon);
            })
        }, function(err, result) {
            return cb(err, result);
        });
    }
    Coupon.remoteMethod('getNames', {
        http: {
            path: '/getNames',
            verb: 'post'
        },
        accepts: {
            arg: 'idsArray',
            type: 'array'
        },
        returns: {
            arg: 'coupons',
            type: 'array'
        }
    });
}