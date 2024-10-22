// import amqp from "amqplib"

class RabbitmqService {
  // async sendMessage(exchange, routingKey, message) {
  //   try {
  //     const connection = await amqp.connect("amqp://localhost");
  //     const channel = await connection.createChannel();

  //     await channel.assertExchange(exchange, "fanout", { durable: true });
  //     await channel.publish(exchange, routingKey, Buffer.from(message));

  //     console.log(`Message published to exchange ${exchange} with routing key ${routingKey}: ${message} `)

  //     await channel.close()
  //     await connection.close()
  //   }
  //   catch (e) {
  //     console.log("Ошибка отправки", e)
  //   }
  // }

  // async consumerFromQueue(exchange, routingKey) {
  //   try {
  //     const connection = await amqp.connect("amqp://localhost");
  //     const channel = await connection.createChannel();

  //     const queue = "A"
  //     await channel.assertQueue(queue, { durable: true });

  //     console.log(` [*] Waiting for messages in ${queue}. To exit press CTRL+C`)
  //     channel.consume(queue, (message) => {
  //       console.log(` [x] Received ${message.content.toString()}`)
  //     }, { noAck: true })
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }
}


export const messageService = new RabbitmqService();