const express = require('express');

const app = express();
const PORT = process.env.PORT || 9090;
const mongoose = require('mongoose');
const amqplib = require('amqplib');
const isAuthenticated = require('../isAuthenticated');
const Order = require('./Order');
app.use(express.json());

var channel;

mongoose.connect("mongodb://localhost/order-service", () => {
  console.log(`Order-Service db connected`);
});

async function connect() {
  const connection = await amqplib.connect('amqp://localhost:5672');
  channel = await connection.createChannel();
  await channel.assertQueue('ORDER');
}

function createOrder(products, userEmail) {
  let total = 0;
  total = products.reduce((acc, item) => {
    return acc + item.price;
  }, 0);
  const newOrder = new Order({
    products,
    user: userEmail,
    total_price: total
  });
  newOrder.save();
  return newOrder;
}

connect().then(() => {
  channel.consume("ORDER", (data) => {
    const { products, userEmail } = JSON.parse(data.content);
    console.log("Consuming ORDER queue");
    const newOrder = createOrder(products, userEmail);
    channel.ack(data);
    channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })));
  })
});


app.listen(PORT, () => {
  console.log(`Order-Service listen at port ${PORT}`);
})