var app = require('../../server/server');
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
}