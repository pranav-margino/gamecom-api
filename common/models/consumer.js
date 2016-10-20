var queue = require('../../modules/queue');
var _ = require('lodash');

module.exports = function(Consumer) {
    Consumer.getFacebookUser = function(id, cb) {
        cb(true, true);
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
    Consumer.observe('after save', function(ctx, next) {
        //if(ctx.isNewInstance){
        //console.log(ctx.instance);    
        //queue.push('mail0', JSON.stringify({ user: ctx.instance, type: 'newUser' }));
        //}
        next();
    });

    Consumer.getPoints = function(id, cb) {
        Consumer.findById(id, function(err, consumer) {
            if (!err) {
                return cb(null, consumer.points);
            } else {
                return cb(true, null);
            }
        });
    }

    Consumer.updatePoints = function(id, points, cb) {
        if (isNaN(points)) {
            return cb(true, null);
        }
        Consumer.findById(id, function(err, consumer) {
            consumer.points = consumer.points + points
            consumer.save();
            return cb(null, true);
        });
    }


    Consumer.remoteMethod('getPoints', {
        http: {
            path: '/points',
            verb: 'get'
        },
        accepts: {
            arg: 'id',
            type: 'string'
        },
        returns: {
            arg: 'data',
            type: 'object'
        }
    });

    /* var firstgamers = [ '57efb52a9013ab8f38ddf433',
  '57efbb4d9013ab8f38ddf468',
  '57efbd309013ab8f38ddf475',
  '57efba019013ab8f38ddf45f',
  '57efb7209013ab8f38ddf448',
  '5800adbe82b8dc12734496ec',
  '57efaaec9013ab8f38ddf431',
  '5800ae8382b8dc12734496f3',
  '57efd06f9013ab8f38ddf490',
  '57efb8959013ab8f38ddf452',
  '57f7c386e88fb33b0b58b831',
  '57f7b08be88fb33b0b58b816',
  '57efbd269013ab8f38ddf474',
  '57f75c93e88fb33b0b58b7eb',
  '5800b87a82b8dc127344970c',
  '5800b71f82b8dc1273449701',
  '5800ba6882b8dc1273449714',
  '5800bb2582b8dc1273449718',
  '57eff21f9013ab8f38ddf4a4',
  '57f7c370e88fb33b0b58b82e',
  '5800bdb482b8dc127344971f',
  '57efc71a9013ab8f38ddf485',
  '57efeddb9013ab8f38ddf4a0',
  '57f7cdb95059c92725df3caa',
  '5800be1382b8dc1273449722',
  '5800c18182b8dc1273449740',
  '5800c02c82b8dc1273449734',
  '5800c31c82b8dc1273449747',
  '57efb6dc9013ab8f38ddf43b',
  '5800c5bf82b8dc127344974f',
  '5800c6e382b8dc1273449753',
  '57efba649013ab8f38ddf463',
  '57efd1339013ab8f38ddf495',
  '57efbbe49013ab8f38ddf46d',
  '5800d03882b8dc1273449765',
  '5800d27282b8dc1273449769',
  '57f02cdb9013ab8f38ddf4a8',
  '57efb6c89013ab8f38ddf437',
  '57f51a6a9013ab8f38ddf4b1',
  '5800da7e82b8dc1273449773',
  '5800dc2f82b8dc127344977a',
  '57efb9279013ab8f38ddf45a',
  '57efb6fb9013ab8f38ddf442',
  '5800e88382b8dc1273449783',
  '57f7d9b95059c92725df3caf',
  '57efb6c99013ab8f38ddf438',
  '58010f1482b8dc1273449797',
  '57efcffb9013ab8f38ddf48d' ]




    Consumer.assignPoints = function() {
        Consumer.find({}, function(err, consumers) {
            _.forEach(consumers, function(consumer) {
                for (var i = 0; i < firstgamers.length; i++) {
                    if (consumer.id == firstgamers[i]) {
                        console.log(i);
                        console.log(consumer.points);
                        consumer.points = consumer.points + 200;
                        consumer.save(); 
                    }
                }

            });
        })

    }
    */

}
