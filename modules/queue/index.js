var kafka = require('kafka-node');
var _ = require('lodash');
var logger = require('../logger')();

function getProducer() {
    var Producer = kafka.Producer,
        client = new kafka.Client(process.env.KAFKA_BASE || "127.0.0.1:2181"),
        producer = new Producer(client);
    return producer;
};

function queue() {
    var isReady = false;
    var producer = getProducer();
    logger.log("Queue initialised");

    producer.on('ready', function() {
        logger.log("Queue ready");
        isReady = true;
    });

    producer.on('error', function(error) {
        isReady = false;
    });

    return {
        push: function(topic, data) {

            if (!producer) {
                logger.log('warning', "Queue not ready");
                return;
            }
            if (isReady) {
                producer.send([{ topic: topic, messages: [data] }], function(err, data) {
                    if (!err) {
                        logger.log(data);
                        logger.log('debug', data);
                    } else {
                        console.log(err);
                        logger.log('error', err.toString());
                    }
                });
            }
        }
    }
}
module.exports = queue;
