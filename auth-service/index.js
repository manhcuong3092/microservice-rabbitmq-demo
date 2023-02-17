const express = require('express');

const app = express();
const PORT = process.env.PORT || 7070;
const mongoose = require('mongoose');;
const User = require('./User');
const jwt = require('jsonwebtoken');
app.use(express.json());

mongoose.connect("mongodb://localhost/auth-service", () => {
  console.log(`Auth-Service db connected`);
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: 'User does not exists' });
  } else {
    //Check password
    if (password !== user.password) {
      return res.json({ message: 'Password Incorrect' })
    }
    const payload = {
      email,
      name: user.name
    };
    jwt.sign(payload, "secret", (err, token) => {
      if (err) console.log(err);
      else {
        return res.json({ token })
      }
    })
  }
})

app.post("/auth/register", async (req, res) => {
  const { email, name, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.json({ message: 'User already exists' });
  } else {
    const newUser = new User({
      name,
      email,
      password
    });
    newUser.save();
    return res.json(newUser);
  }
})



app.listen(PORT, () => {
  console.log(`Auth-Service listen on port ${PORT}`);
})