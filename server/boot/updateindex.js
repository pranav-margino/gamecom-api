var debug = require('debug')('updateindex');
var colors = require('colors');

module.exports = function(server) {
    server.dataSources.mongoDs.autoupdate('Favourite', function(err, data) {
        if (err) {
            debug(err);
        } else {
            debug("Favourite index udated".green);
        }
    });
    server.dataSources.mongoDs.autoupdate('Manifest', function(err, data) {
        if (err) {
            debug(err);
        } else {
            debug("Manifest index updated".green);
        }
    });
    server.dataSources.mongoDs.autoupdate('Consumer', function(err, data) {
        if (err) {
            debug(err);
        } else {
            debug("Consumer index updated".green);
        }
    });
    server.dataSources.mongoDs.autoupdate('Preference', function(err, data) {
        if (err) {
            debug(err);
        } else {
            debug("Preference index updated".green);
        }
    });
};
