var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/:feature', function (req, res, next) {
	res.render(req.params.feature)
})

// var ws = require("nodejs-websocket")

// // Scream server example: "hi" -> "HI!!!"
// var server = ws.createServer(function (conn) {
// 	setInterval(function () {
// 		conn.sendText('welcome: ' + Date.now())
// 	}, 2000)
// 	console.log("New connection")
// 	conn.on("text", function (str) {
// 		console.log("Received "+str)
// 		conn.sendText(str.toUpperCase()+"!!!")
// 	})
// 	conn.on("close", function (code, reason) {
// 		console.log("Connection closed")
// 	})
// }).listen(3001);


module.exports = router;
