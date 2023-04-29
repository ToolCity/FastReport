"use strict";
exports.__esModule = true;
exports.showMessages = exports.createMessagesProducer = exports.createMessage = exports.deleteQueue = exports.sendMessagesToQueue = void 0;
var redis_smq_1 = require("redis-smq");
var redis_smq_2 = require("../../config/redis_smq");
var EQueueType;
(function (EQueueType) {
    EQueueType[EQueueType["LIFO_QUEUE"] = 0] = "LIFO_QUEUE";
    EQueueType[EQueueType["FIFO_QUEUE"] = 1] = "FIFO_QUEUE";
    EQueueType[EQueueType["PRIORITY_QUEUE"] = 2] = "PRIORITY_QUEUE";
})(EQueueType || (EQueueType = {}));
var QUEUE_NAME = 'trigger_queue';
exports.sendMessagesToQueue = function (messages) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    redis_smq_1.QueueManager.createInstance(redis_smq_2["default"], function (err, queueManager) {
        if (err)
            console.error(err);
        else {
            if (queueManager) {
                queueManager.queue.exists(QUEUE_NAME, function (err, reply) {
                    if (err)
                        console.log(err);
                    else {
                        if (reply) {
                            console.log(QUEUE_NAME + " already exists");
                        }
                        else {
                            queueManager.queue.save(QUEUE_NAME, EQueueType.FIFO_QUEUE, function (err) { return console.error(err); });
                        }
                        // creates messages and pushes them to the queue
                        exports.createMessagesProducer(messages);
                        exports.showMessages();
                    }
                });
            }
        }
    });
};
exports.deleteQueue = function () {
    redis_smq_1.QueueManager.prototype.queue.exists(QUEUE_NAME, function (err, _reply) {
        if (err)
            console.error(err);
        else {
            if (_reply)
                redis_smq_1.QueueManager.prototype.queue["delete"](QUEUE_NAME, function (err) { return console.error(err); });
        }
    });
};
exports.createMessage = function (data) {
    var message = new redis_smq_1.Message();
    message
        .setBody(data)
        .setTTL(3600000) // message expiration (in millis)
        .setQueue(QUEUE_NAME); // setting up a direct exchange
    return message;
};
exports.createMessagesProducer = function (messages) {
    var producer = new redis_smq_1.Producer();
    producer.run(function (err) {
        if (err)
            throw err;
        messages.forEach(function (data) {
            var message = exports.createMessage(data);
            producer.produce(message, function (err) {
                if (err)
                    console.log(err);
                else {
                    var msgId = message.getId();
                    console.log('Successfully produced. Message ID is ', msgId);
                }
            });
        });
    });
};
exports.showMessages = function () {
    redis_smq_1.MessageManager.createInstance(redis_smq_2["default"], function (err, messageManager) {
        if (err)
            console.error(err);
        else {
            if (messageManager) {
                messageManager.pendingMessages.count(QUEUE_NAME, function (err, reply) {
                    if (err)
                        console.error(err);
                    else {
                        if (!reply)
                            console.log('No messages in queue');
                        else {
                            console.log("There are " + reply + " messages in queue");
                            messageManager.pendingMessages.list(QUEUE_NAME, 0, reply, function (err, reply) {
                                if (err)
                                    console.error(err);
                                else {
                                    if (reply) {
                                        reply.items.forEach(function (item) {
                                            console.log(item.message);
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    });
};
exports.sendMessagesToQueue([{ test: 'test' }, { test: 'test2' }]);
