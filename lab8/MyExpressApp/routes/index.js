var express = require('express');
var cors = require('cors');
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var app = express();
var assert = require('assert');
var url = 'mongodb://localhost:27017/juegos';
var redis = require("redis");
var cache = require('express-redis-cache')({
  host: 'localhost', port: 6379
});
var db;

cache.on('error', function (error) {
  console.log('Cache error!' + error);
  return
});



const redis_url = process.env.redis_url;
const client = redis.createClient(redis_url);

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
//app.engine('handlebars', exphbs({ defaultlayout: 'main'}));
//app.set('cache',cache);
//app.use(bodyparser.json());
//app.use('/', juegos)



app.get('/api/juegos/', cache.route({ expire: 60, name: 'getAll' }), function (req, res, next) {
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
  console.log(JSON.stringify(req.body))
  
  const juego = {
    name: req.body.name
    , platform: req.body.platform
    , rate: req.body.rate
    , photo: req.body.photo
  };

  mongo.connect(url, function (err, client) {
    db = client.db('juegos');
    if (!err) {
      console.log("We are connected");

    }
    db.collection('juegos').insertOne(juego, function (err, result) {
      cache.del('getAll', (err, juego) => {
        assert.equal(null, err);
        if (err) return console.log(err);
        console.log("Item inserted");
        res.status(201).json(data)
      });
      client.close();
    });
  });
});

app.put('/api/juegos/', function (req, res, next) {
  var id = req.body._id;
  const item = {
    name: req.body.name
    , platform: req.body.platform
    , rate: req.body.rate
    , photo: req.body.photo
  }
  console.log("id " + id);
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
  mongo.connect(url, function (err, client) {
    if (!err) {
      console.log("We are connected");
      db = client.db('juegos');
    }

    console.log("id: " + req.params.id);
    console.log("err: " + err);
    db.collection('juegos').deleteOne({ "_id": objectId(id) }, function (err, result) {
      console.log("result: " + result);
      if (err) return console.log(err)
      console.log('Item deleted');
      res.status(204).send(result);
      client.close();
    });
  });
});
