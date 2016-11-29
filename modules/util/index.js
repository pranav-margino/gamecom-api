var _ = require('lodash');
var app = require('../../server/server');
var moment = require('moment');
var util = function() {

}

util.prototype.getValues = function(points, maxValue, minValue, stepsOf) {

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

    return values;


}

util.prototype.validateManifest = function(err) {

    if (!this.manifestId) {
        err();
    }

}


util.prototype.getManifest = function(favouriteId, userId, model, cb) {

    var self = this;
    app.models.Favourite.findById(favouriteId, function(err, favourite) {
        if (err) {
            return cb(err, null);
        }
        if (model == "Overbid" && favourite.user.id !== userId) {
            return cb("mismatched favourite and user", null);
        }
        app.models.Preference.findById(favourite.preferenceId, function(err, preference) {
            if (err) {
                return cb(err, null);
            }
            //* { where: { 'user.id': userId }
            favourite[model.toLowerCase() + "s"]({}, function(err, docs) {
                if (err) {
                    return cb(err, null);
                }
                var interval = preference[model.toLowerCase() + "Interval"];
                var expiresIn = preference.expiresManifestIn;


                var manifest = {
                    context: model.toLowerCase(),
                    userId: userId,
                    productId: favourite.product.id,
                    favouriteId: favouriteId,
                    expiresIn: expiresIn
                };

                //already enough overbids, endorsements etc
                var maxCount = preference["max" + model + "Count"];

                console.log(maxCount);

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

                        var userDocs = _.partition(docs, function(doc) {
                            return doc.user.id == userId;
                        })[0];

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
