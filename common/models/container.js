var app = require('../../server/server');
module.exports = function(Container) {
    Container.afterRemote('upload', function(ctx, res, next) {
        var result = res.result;
        var file = result.files.file[0];
        var fields = result.fields;
        var model = app.models[fields.model.toString()];
        if (model) {
            model.findById(fields.id.toString(), function(err, instance) {
                if (!err) {
                    var fileModel = instance[fields.type.toString()];
                    fileModel.create({
                        format: file.type,
                        size: file.size,
                        name: file.name
                    }, function(err, data) {});
                }
            });
        }
        next();
    });


};
