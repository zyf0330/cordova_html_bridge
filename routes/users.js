var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('user get success');
});
router.post('/', function (req, res, next) {
	res.send('user post success')
})
module.exports = router;
