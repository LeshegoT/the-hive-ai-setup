const queuePostFix = process.env.QUEUE_POSTFIX.toLowerCase();

const { logger } = require('@the-hive/lib-core');
const {  QueueServiceClient } = require('@azure/storage-queue');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

const serialise = (message) => {
  const json = JSON.stringify(message);
  const base64data = Buffer.from(json).toString('base64');

  return base64data;
};

const enqueue = async (queue_name, message) => {
  const envQueueName = `${queue_name}-${queuePostFix}`;
  const queueServiceClient =
    QueueServiceClient.fromConnectionString(connectionString);
  const queueClient = queueServiceClient.getQueueClient(envQueueName);

  try {
    await queueClient.createIfNotExists();
    try {
      await queueClient.sendMessage(serialise(message));
    } catch (error) {
      logger.error(error, `Error enqueuing message (queue: ${queue_name} with postfix ${queuePostFix} = ${envQueueName} ).`);
    }
  } catch (err) {
    logger.error(err, `Error creating queue ${envQueueName}`);
  }
};

module.exports = {
  enqueue,
};
