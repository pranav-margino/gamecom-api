var app = require('../../server/server');
module.exports = function(Container) {
    Container.afterRemote('upload', function(ctx, res, next) {
        var result = res.result;
        var file = result.files.file[0];
        var fields = result.fields;
        var model = getModel(fields.model.toString());
        if (model) {
            model.findById(fields.id.toString(), function(err, instance) {
                if (!err) {
                    var fileModel = getFileModel(fields.type.toString(), instance);
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

    function getModel(modelName) {
        var model;
        switch (modelName) {
            case 'Vendor':
                model = app.models.Vendor;
                break;
            case 'Store':
                model = app.models.Store;
                break;
            case 'Coupon':
                model = app.models.Coupon;
                break;
            default:
                break;
        }
        return model;
    }

    function getFileModel(fileModelName, modelInstance) {
        var fileModel;
        switch (fileModelName) {
            case 'brandLogo':
                fileModel = modelInstance.brandLogo;
                break;
            case 'featuredImage':
                fileModel = modelInstance.featuredImage;
                break;
            default:
                break;
        }
        return fileModel;
    }
};