import { QueueManager, Message, Producer, MessageManager } from 'redis-smq';
import config from '../../config/redis_smq';

enum EQueueType {
  LIFO_QUEUE = 0,
  FIFO_QUEUE = 1,
  PRIORITY_QUEUE = 2,
}
const QUEUE_NAME = 'trigger_queue';

export const sendMessagesToQueue = (messages: Record<string, unknown>[]) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  QueueManager.createInstance(config, (err, queueManager) => {
    if (err) console.error(err);
    else {
      if (queueManager) {
        queueManager.queue.exists(QUEUE_NAME, (err, reply) => {
          if (err) console.log(err);
          else {
            if (reply) {
              console.log(`${QUEUE_NAME} already exists`);
            } else {
              queueManager.queue.save(QUEUE_NAME, EQueueType.FIFO_QUEUE, err => console.error(err));
            }
            // creates messages and pushes them to the queue
            createMessagesProducer(messages);
            showMessages();
          }
        });
      }
    }
  });
};

export const deleteQueue = () => {
  QueueManager.prototype.queue.exists(QUEUE_NAME, (err, _reply) => {
    if (err) console.error(err);
    else {
      if (_reply) QueueManager.prototype.queue.delete(QUEUE_NAME, err => console.error(err));
    }
  });
};

export const createMessage = (data: Record<string, unknown>) => {
  const message = new Message();
  message
    .setBody(data)
    .setTTL(3600000) // message expiration (in millis)
    .setQueue(QUEUE_NAME); // setting up a direct exchange

  return message;
};

export const createMessagesProducer = (messages: Record<string, unknown>[]) => {
  const producer = new Producer();
  producer.run(err => {
    if (err) throw err;
    messages.forEach(data => {
      const message = createMessage(data);
      producer.produce(message, err => {
        if (err) console.log(err);
        else {
          const msgId = message.getId();
          console.log('Successfully produced. Message ID is ', msgId);
        }
      });
    });
  });
};

export const showMessages = () => {
  MessageManager.createInstance(config, (err, messageManager) => {
    if (err) console.error(err);
    else {
      if (messageManager) {
        messageManager.pendingMessages.count(QUEUE_NAME, (err, reply) => {
          if (err) console.error(err);
          else {
            if (!reply) console.log('No messages in queue');
            else {
              console.log(`There are ${reply} messages in queue`);
              messageManager.pendingMessages.list(QUEUE_NAME, 0, reply, (err, reply) => {
                if (err) console.error(err);
                else {
                  if (reply) {
                    reply.items.forEach(item => {
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

sendMessagesToQueue([{ test: 'test' }, { test: 'test2' }]);
