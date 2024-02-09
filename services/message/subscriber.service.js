const amqplib = require("amqplib");
const { env } = require("../../db/constant");
const amqpUrl = `amqp://${env.queue_user}:${env.queue_password}@${env.queue_host}:${env.queue_port}/`;
const InventoryService = require("../inventory.service");
async function processMessage(msg) {
  console.log(msg.content,msg.content.toString(), "Received Message");
  let message =  JSON.parse(msg.content.toString())
  if (message.process === "UPLOAD_INVENTORY") {
    await InventoryService.processRequest(message.userId)
  }
}

const amqpConnectAndConsume = async () => {
  const connection = await amqplib.connect(amqpUrl, "heartbeat=60");
  const channel = await connection.createChannel();
  channel.prefetch(10);
  const queue = env.queue_name;
  process.once("SIGINT", async () => {
    console.log("got sigint, closing connection");
    await channel.close();
    await connection.close();
    process.exit(0);
  });

  await channel.assertQueue(queue, { durable: true });
  await channel.consume(
    queue,
    async (msg) => {
      console.log("processing messages");
      await processMessage(msg);
      channel.ack(msg);
    },
    {
      noAck: false,
      consumerTag: "inventory_consumer",
    }
  );
  console.log(" [*] Waiting for messages.");
};

module.exports = {
  amqpConnectAndConsume: amqpConnectAndConsume,
};
