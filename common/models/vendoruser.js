var nodemailer = require('nodemailer');
var app = require('../../server/server');
module.exports = function(VendorUser) {
    VendorUser.existsEmail = function(email, cb) {
        VendorUser.find({
            where: {
                email: email
            }
        }, function(err, result) {
            return cb(err, result)
        });
    };
    VendorUser.existsMobile = function(mobile, cb) {
        VendorUser.find({
            where: {
                mobile: mobile
            }
        }, function(err, result) {
            return cb(err, result)
        });
    };
    VendorUser.remoteMethod('existsEmail', {
        http: {
            path: '/existsEmail',
            verb: 'get'
        },
        accepts: {
            arg: 'email',
            type: 'string'
        },
        returns: {
            arg: 'users',
            type: 'object'
        }
    });
    VendorUser.remoteMethod('existsMobile', {
        http: {
            path: '/existsMobile',
            verb: 'get'
        },
        accepts: {
            arg: 'mobile',
            type: 'number'
        },
        returns: {
            arg: 'users',
            type: 'object'
        }
    });
    VendorUser.observe('before save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var Vendor = app.models.Vendor;
            var slug = parseInt(Math.random() * 100000);
            Vendor.create({
                name: 'Untitled Vendor ' + slug
            }, function(err, data) {
                ctx.instance.vendorId = data.id;
                next();
            });
        } else {
            next();
        }
    });
};