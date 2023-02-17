const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const mongoose = require('mongoose');
const amqplib = require('amqplib');
const isAuthenticated = require('../isAuthenticated');
const Product = require('./Product');
app.use(express.json());

mongoose.connect("mongodb://localhost/product-service", () => {
  console.log(`Product-Service db connected`);
});

var channel;
var order;

async function connect() {
  const connection = await amqplib.connect('amqp://localhost:5672');
  channel = await connection.createChannel();
  await channel.assertQueue('PRODUCT');
}

connect();

app.post("/product/create", isAuthenticated, async (req, res) => {
  const { name, description, price } = req.body;
  const newProduct = new Product({
    name,
    description,
    price,
  });
  newProduct.save();
  return res.json(newProduct);
});

// User sends list of product Ids to buy
app.post("/product/buy", isAuthenticated, async (req, res) => {
  const { ids } = req.body;
  const products = await Product.find({ _id: { $in: ids } });

  channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({ products, userEmail: req.user.email })));
  channel.consume("PRODUCT", data => {
    console.log('Consuming PRODUCT queue');
    console.log(JSON.parse(data.content));
    order = JSON.parse(data.content);
    channel.ack(data);
  });
  console.log('sent');
  return res.json(order);
})

app.listen(PORT, () => {
  console.log(`Product-Service listen at port ${PORT}`);
})