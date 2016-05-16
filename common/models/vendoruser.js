var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
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
        if (!ctx.isNewInstance) {
            next();
        };
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(ctx.instance.password, salt, function(err, hash) {
                ctx.instance.password = hash;
                next();
            });
        });
    });
    VendorUser.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'pranav.virgo.1989@gmail.com',
                    pass: 'newgmailpasswordP2'
                },
                debug: true
            });
            var mailOptions = {
                from: '"PK" <pranav.virgo.1989@gmail.com>',
                to: ctx.instance.email,
                subject: 'Welcome to Heaven',
                text: 'mWWWAAAHHHH XOXOX',
                html: '<b>Hello world</b>'
            };
            /*transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });
            */
        }
        next();
    });
};