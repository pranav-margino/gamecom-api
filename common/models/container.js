module.exports = function(Container) {
    Container.afterRemote('upload', function(ctx, res, next) {
        //console.log(ctx);
        next();
    });
};