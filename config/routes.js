const axios = require('axios');
const { authenticate } = require('./middlewares');
const bcrypt = require("bcryptjs");
const db = require("../data/dbConfig");
const jwtKey = require("../_secrets/keys").jwtKey;
const jwt = require("jsonwebtoken");

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

// REGISTER

function register(req, res) {
  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 4); 
  creds.password = hash;

  db('users')
    .insert(creds)
    .then(ids => {
      res.status(201).json(ids);
    })
    .catch(err => json(err));
}

// TOKEN GENERATOR

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const secret = jwtKey;
  const options = {
    expiresIn: "30m"
  };
  return jwt.sign(payload, secret, options);
}

// LOGIN

function login(req, res) {
  const creds = req.body;

  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({ message: 'Hola amigo!', token });
      } else {
        res.status(401).json({ message: 'Stop in the name of love <3!!' });
      }
    })
    .catch(err => res.json(err));
}

function getJokes(req, res) {
  axios
    .get('https://safe-falls-22549.herokuapp.com/random_ten')
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
