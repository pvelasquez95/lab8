var express = require('express');
var cors = require('cors');
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var app = express();
var assert = require('assert');
var url = 'mongodb://localhost:27017/videogames';
var redis = require("redis");
var redis_client = redis.createClient();
var db;

var cache = require('express-redis-cache')({
  port:6379,
  host: 'localhost',
  auth_pass:null,
  
})

app.listen(3001)
console.log('Log listening on port 3001...')
app.use(express.json())
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Header", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,DELETE");
  next();
})

app.use(cors());



app.get('/api/juegos/', function (req, res, next) {
  mongo.connect(url, function (err, client) {
    if (!err) {
      console.log("We are connected");
      db = client.db('juegos');
    }
    db.collection('juegos').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.send({ games: result })
      client.close();
    })
  });
});

app.get('/api/juegos/:id', function (req, res, next) {
  mongo.connect(url, function (err, client) {
    if (!err) {
      console.log("We are connected");
      db = client.db('juegos');
    }
    db.collection('juegos').find({ id: req.params.id }).toArray((err, result) => {
      if (err) return console.log(err)
      res.send({ games: result })
    })
  });
});

app.post('/api/juegos/', function (req, res, next) {
  mongo.connect(url, function (err, client) {
    if (!err) {
      console.log("We are connected");
      db = client.db('juegos');
    }
    const juego = {
      name: req.body.name
      , platform: req.body.platform
      , memo: req.body.memo
      , rate: req.body.rate
      , photo: req.body.photo
    }
    db.collection('juegos').insertOne(juego, function (err, result) {
      assert.equal(null, err);
      if (err) return console.log(err);
      redis_insert(result.insertedId, result.ops[0]);
      console.log("Item inserted");
      res.status(201).send(result);
      client.close();
    });
  });
});

app.put('/api/juegos/', function (req, res, next) {
  var id = req.body.id;
  const item = {
    name: req.body.name
    , platform: req.body.platform
    , memo: req.body.memo
    , rate: req.body.rate
    , photo: req.body.photo
  }
  mongo.connect(url, function (err, client) {
    if (!err) {
      console.log("We are connected");
      db = client.db('juegos');
    }
    db.collection('juegos').updateOne({ "_id": objectId(id) }, { $set: item }, function (err, result) {
      assert.equal(null, err);
      console.log('Item updated');
      res.status(204).send(item);
      client.close();
    });
  });
});

app.delete('/api/juegos/:id', function (req, res, next) {
  var id = req.params.id;
  redis_delete(id);
  mongo.connect(url, function (err, client) {
    if (!err) {
      console.log("We are connected");
      db = client.db('juegos');
    }
    db.collection('juegos').deleteOne({ "_id": objectId(id) }, function (err, result) {
      assert.equal(null, err);
      if (err) return console.log(err)
      console.log('Item deleted');
      res.status(204).send(result);
      client.close();
    });
  });
});

function redis_insert(id,object)
{
  console.log("Record from redis inserted");
  redis_client.set(id, JSON.stringify(object), redis.print);
}

function redis_delete(id)
{
  console.log("Record from redis deleted"); 
  redis_client.del(id);
}
