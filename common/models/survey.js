var loopback = require('loopback');
module.exports = function(Survey) {
    Survey.addQuestion = function(question, cb) {
        var surveyId = loopback.getCurrentContext().active.http.req.url.split("/")[1];
		console.log({surveyId:surveyId,question:question});
        return cb(null, 'OK')
    };
    Survey.remoteMethod('addQuestion', {
        http: {
            path: '/:id/addQuestion',
            verb: 'post'
        },
        accepts: {
            arg: 'question',
            type: 'object'
        },
        returns: {
            arg: 'data',
            type: 'string'
        }
    });
};