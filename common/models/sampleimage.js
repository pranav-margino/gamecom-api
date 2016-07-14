var fs = require('fs');
var request = require('request');
var uuid = require('node-uuid');
module.exports = function(SampleImage) {
    SampleImage.observe('before save', function(ctx, next) {
        console.log(ctx.instance);
        var instance = ctx.instance;
        var image = instance.image;
        var ext = image.url.split(".").pop();
        var fileName = (image.name || uuid.v1()) + "." + ext;
        console.log(fileName);
        instance.fileName = fileName;
        request.get(image.url).on('error', function(err) {
            console.log(err);
        }).pipe(fs.createWriteStream('./server/storage/container1/' + fileName));
        next();
    });
}