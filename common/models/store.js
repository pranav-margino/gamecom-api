var _ = require('lodash');
module.exports = function(Store) {
    Store.addCoupon = function(idArray, coupon) {
        _.forEach(idArray, function(id) {
            Store.findById(id, function(err, store) {
                store.storeCoupons.exists({
                    "where": {
                        "modelName": "Coupon"
                    }
                }, function(err, coupon) {
                    console.log(coupon);
                });
            });
        });
    }
}