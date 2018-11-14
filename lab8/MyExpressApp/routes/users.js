var express = require('express');
var router = express.Router();
var data =
/* GET users listing. */
router.get('/', function(req, res, next) {
  var id=req.id;

  res.send('respond with a resource');
});

module.exports = router;
