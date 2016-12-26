var _ = require('lodash');
var app = require('../../server/server');
var moment = require('moment');
var debug = require('debug')('util');
var colors = require('colors');

var util = function() {

}

util.prototype.getValues = function(points, maxValue, minValue, stepsOf, xtimeValue, xtimeExpiresOn) {

    debug('xtimeValue : %d', xtimeValue);

    var range;
    var values = [];
    if (points < minValue) {
        range = null;
    }
    if (points > maxValue) {
        range = [minValue, maxValue];
    }

    if (points >= minValue && points <= maxValue) {
        range = [minValue, points];
    }
    if (range) {
        values.push(range[0]);
        while (values[values.length - 1] < range[1]) {
            values.push(values[values.length - 1] + stepsOf);
        }
    }

    debug('xtimeExpiresOn %s', xtimeExpiresOn);

    if (new Date(xtimeExpiresOn).getTime() > new Date().getTime()) {
        values = _.map(values, function(value) {
            return value * xtimeValue;
        });
    }





    return values;


}

util.prototype.validateManifest = function(err) {

    if (!this.manifestId) {
        err();
    }

}

util.prototype.getManifestCache = function(favouriteId, userId, model, cb) {
    var self = this;

    app.models.Blacklist.isListedCache(userId, function(err, flag) {
        if (flag) {
            return cb("BLACKLISTED_USER", null);
        } else {

            app.models.Favourite.getManifestVarsCache(favouriteId, function(err, favourite) {
                if (err || favourite == null) {
                    return cb(err, null);
                }
                if (model == "Overbid" && favourite.userId !== userId) {
                    return cb("mismatched favourite and user", null);
                }
                //debug('favourite %s', JSON.stringify(favourite));
                console.log(favourite);
                app.models.Preference.getManifestVarsCache(favourite.preferenceId, function(err, preference) {
                    if (err || preference == null) {
                        return cb(err, null);
                    }
                    app.models.Favourite.getModelStatsCache(favouriteId, model, function(err, stats) {

                        debug(err);
                        debug(stats);
                        if (err || stats == null) {
                            return cb(err, null);
                        }

                        var interval = parseInt(preference[model.toLowerCase() + "Interval"]);
                        debug('interval %d', interval);


                        var manifest = {
                            context: model.toLowerCase(),
                            userId: userId,
                            productId: favourite.productId,
                            favouriteId: favouriteId,
                            expiresIn: preference.expiresManifestIn,
                            xtimeValue: (new Date(favourite.xtimeExpiresOn).getTime() > new Date().getTime()) ? favourite.xtimeValue : 1
                        };


                        var maxCount = preference["max" + model + "Count"];

                        debug(maxCount);

                        if (stats.count && stats.count >= ((maxCount == -1) ? Number.POSITIVE_INFINITY : maxCount)) {
                            manifest.hasVacant = false;
                            debug('exceeded max allowed %s', model);
                            app.models.Manifest.create(manifest, function(err, manifest) {
                                return cb(err, manifest);
                            });
                        } else {
                            app.models.Consumer.getPointsCache(userId, function(err, points) {
                                debug("hasVacant %s", model);
                                if (err) {
                                    return cb(err, null);
                                }
                                var values = self.getValues((model == "Underbid") ? parseInt(favourite.bid) : parseInt(points), parseInt(preference["max" + model + "Value"]), parseInt(preference["min" + model + "Value"]), parseInt(preference["stepsOf" + model]), parseInt(favourite.xtimeValue), favourite.xtimeExpiresOn);

                                debug('values %s', values.toString());

                                if (stats.count == 0) {
                                    manifest.values = values;
                                    app.models.Manifest.create(manifest, function(err, manifest) {
                                        return cb(err, manifest);
                                    });
                                }

                                if (stats.count > 0) {
                                    debug("lastAt %d", new Date(stats.lastAt));
                                    debug("lastAtThreshhold %d", new Date().getTime() - (interval * 1000));
                                    if (new Date(stats.lastAt).getTime() > (new Date().getTime() - (interval * 1000))) {
                                        debug("hasRecent %s", model);
                                        var nextPossible = moment(moment(stats.lastAt).add((interval / 60), 'minutes')).toDate();
                                        manifest.hasRecent = true;
                                        manifest.nextPossible = nextPossible;
                                        app.models.Manifest.create(manifest, function(err, manifest) {
                                            return cb(err, manifest);
                                        });
                                    } else {
                                        debug("noRecent %s", model);
                                        manifest.values = values;
                                        app.models.Manifest.create(manifest, function(err, manifest) {
                                            return cb(err, manifest);
                                        });
                                    }

                                }




                            });
                        }



                    });
                });

            });

        }
    });



}




util.prototype.getManifest = function(favouriteId, userId, model, cb) {

    var self = this;
    var _model = model.toLowerCase() + "s";
    app.models.Favourite.findById(favouriteId, function(err, favourite) {

        if (err || favourite == null) {
            return cb(err, null);
        }
        if (model == "Overbid" && favourite.userId !== userId) {
            return cb("mismatched favourite and user", null);
        }
        app.models.Preference.findById(favourite.preferenceId, function(err, preference) {
            if (err) {
                return cb(err, null);
            }
            favourite[model.toLowerCase() + "s"]({}, function(err, docs) {
                if (err) {
                    return cb(err, null);
                }
                var interval = preference[model.toLowerCase() + "Interval"];
                var expiresIn = preference.expiresManifestIn;


                var manifest = {
                    context: model.toLowerCase(),
                    userId: userId,
                    productId: favourite.productId,
                    favouriteId: favouriteId,
                    expiresIn: expiresIn
                };

                var maxCount = preference["max" + model + "Count"];


                if (docs && docs.length >= ((maxCount == -1) ? Number.POSITIVE_INFINITY : maxCount)) {
                    manifest.hasVacant = false;
                    app.models.Manifest.create(manifest, function(err, manifest) {
                        return cb(err, manifest);
                    });
                } else {

                    app.models.Consumer.getPoints(userId, function(err, points) {
                        if (err) {
                            return cb(err, null);
                        }

                        var values = self.getValues((model == "Underbid") ? favourite.bid : points, preference["max" + model + "Value"], preference["min" + model + "Value"], preference["stepsOf" + model]);


                        var userDocs = docs;

                        if (userDocs.length == 0) {
                            //has no doc
                            manifest.values = values;
                            app.models.Manifest.create(manifest, function(err, manifest) {
                                return cb(err, manifest);
                            });
                        }
                        if (userDocs.length > 0) {
                            //has docs
                            var lastDoc = _.sortBy(userDocs, 'createdAt').pop();
                            if (new Date(lastDoc.createdAt).getTime() > new Date().getTime() - (interval * 1000)) {
                                var nextPossible = moment(moment(lastDoc.createdAt).add((interval / 60), 'minutes')).toDate();
                                //has recent doc
                                manifest.hasRecent = true;
                                manifest.nextPossible = nextPossible;
                                app.models.Manifest.create(manifest, function(err, manifest) {
                                    return cb(err, manifest);
                                });
                            } else {
                                // does not have recent doc
                                manifest.values = values;
                                app.models.Manifest.create(manifest, function(err, manifest) {
                                    return cb(err, manifest);
                                });
                            }

                        }
                    });
                }


            });
        });
    });


}

module.exports = new util;
