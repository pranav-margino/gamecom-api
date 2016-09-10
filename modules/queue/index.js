var kafka = require('kafka-node');
var _ = require('lodash');
var logger = require('../logger');

function getProducer(config) {
    var Producer = kafka.Producer,
        client = new kafka.Client(config.url),
        producer = new Producer(client);
    return producer;
};

var queue = function() {
    var self = this;
    self.url = process.env.KAFKA_BASE || "127.0.0.1:2181";
    self.isReady = false;
    self.producer = getProducer({ url: self.url });
    logger.log("Initialising Queue : Url " + self.url);
    self.producer.on('ready', function() {
        logger.log("Queue ready");
        self.isReady = true;
    });
    self.producer.on('error', function(error) {
        logger.log(error);
        self.isReady = false;
    });
};

queue.prototype.push = function(topic, msg) {
    var self = this;
    if (!self.producer) {
        logger.log("warning", "Queue not ready");
        return;
    }
    if (self.isReady) {
        logger.log("Queue ready : trying to push message to " + topic);
        self.producer.send([{ topic: topic, messages: [msg] }], function(err, data) {
            if (!err) {
                logger.log(data);
                logger.log(data);
            } else {
                logger.log(err);
            }
        });
    } else {
        logger.log("error", "Queue not ready : failed to push to " + topic);
    }
}


module.exports = new queue;
