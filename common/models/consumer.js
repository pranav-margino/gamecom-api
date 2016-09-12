module.exports = function(Consumer) {
    Consumer.getFacebookUser = function(id, cb) {
    	cb(true,true);
    };
    Consumer.remoteMethod('getFacebookUser', {
        http: {
            path: '/getFacebookUser',
            verb: 'get'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'user',
            type: 'object'
        }
    });
    Consumer.getTwitterUser = function(twitterId, cb) {};
    Consumer.getGoogleUser = function(googleId, cb) {};
    Consumer.getLinkedinUser = function(linkedinId, cb) {};

}
