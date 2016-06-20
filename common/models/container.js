module.exports = function(Container) {
    Container.afterRemote('upload', function(ctx, res, next) {
        next();
    });
};