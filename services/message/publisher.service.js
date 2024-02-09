const amqplib = require('amqplib');
const { env } = require("../../db/constant");
const CONN_URL = `amqp://${env.queue_user}:${env.queue_password}@${env.queue_host}:${env.queue_port}/`;
let ch = null;
module.exports = {
  publishMessages: async (msg) => {
    const connection = await amqplib.connect(CONN_URL, 'heartbeat=60');
    const channel = await connection.createChannel();
    try {
      console.log('Publishing');
      const exchange = env.queue_exchange;
      const queue = env.queue_name;
      const routingKey = env.queue_routingKey;
      
      await channel.assertExchange(exchange, 'direct', {durable: true});
      await channel.assertQueue(queue, {durable: true});
      await channel.bindQueue(queue, exchange, routingKey);      
      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)));
      console.log('Message published');
    } catch(e) {
      console.error('Error in publishing message', e);
    } finally {
      console.info('Closing channel and connection if available');
      await channel.close();
      await connection.close();
      console.info('Channel and connection closed');
    }
}
};
