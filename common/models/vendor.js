var _ = require('lodash');
var async = require('async');
module.exports = function(Vendor) {
    Vendor.getNames = function(idsArray, cb) {
    	console.log(idsArray);
        async.map(idsArray, function(id, callback) {
            Vendor.findById(id, {
                fields: {
                    id: true,
                    name: true,
                    displayName: true,
                    legalName: true
                }
            }, function(err, vendor) {
                callback(null, vendor);
            })
        }, function(err, result) {
            return cb(err, result);
        });
    }
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