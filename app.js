var app = require("express")();
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({extended: true});
var handlebars = require("express-handlebars");
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.engine("handlebars", handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ lextended:true}));
var port = 3257;
/* set up sql con */
var mysql = require("mysql");
var con = mysql.createConnection({
    host            : process.env.MYSQL_HOST,
    port            : process.env.MYSQL_PORT,
    user            : process.env.MYSQL_USER,
    password        : process.env.MYSQL_PASSWORD,
    database        : process.env.MYSQL_DATABASE
});
var tries = 5;
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
while (tries < 5){
	con.connect(function(err){
		if(err){
			tries += 1
			console.error("error connecting: " + err.stack);
		}
	});
	sleep(1000);
}
app.get('/', function(req, res){
	res.sendFile("index.html", {root:__dirname})
});


app.post("/in", function (req, res) {
	con.query(`INSERT INTO sensdata (id,temp) VALUES (${req.body.id}, ${req.body.temp})`, function (err, result){
		if (err) throw err;
	});
	// con.query('SELECT * from sensdata', function (err, result){
	// 	if (err) throw err;
	// 	console.log(result);
	// });
	res.sendStatus(200);
})
// var pos = 0;
// var ids = 1
// io.sockets.on('connection', function (socket) {

//   var max = 100

//   // generate a sample every second
//     setInterval(function() {
//         var x = (new Date()).getTime(), // current time
//             y = Math.floor((Math.random() * max) + 1);
//         // socket.emit('sample', {
//         // 	x: x,
//         // 	y: y
//         // });
//             	  socket.emit('chart_data', {
// 		      id: pos,
// 		      x: x,
// 		      y: y
// 		  });
// //         console.info("emitted: [" + x + "," + y + "]");
//     }, 1000);
// });
io.sockets.on('connection', function (socket) {
	var pos = 0
		  wt = 1000;
	    setInterval(function() {
        con.query('SELECT * FROM sensdata WHERE id = 1', function (err, results) {
          if (err) {
            console.info(err);
          } else {
	var wt = 10;
		  if (pos < results.length){
		  var x = results[pos].time;
		  var y = results[pos].temp;
		  console.log("x " + x);
		  console.log("y " + y);
			  var data = []
		 for (var i=0; i < results.length; i++){
			data.push([results[i].time, results[i].temp]);
		 }
            	  socket.emit('chart_data', {
		      id: 1,
		      x: x,
		      y: y,
		      data: data
		    });
			pos++;}
		  else{
			  console.log("waiting for more data; pos="+ pos);
			  console.log("results size is " + results.length);
			  wt = 500;
          }
        }
      });
    }, wt);
  });
// io.sockets.on('connection', function (socket) {
// 	console.log("socket connected");
//     var timer = setInterval(function() {
//       if (pos++< ids) {
//         con.query('SELECT * FROM sensdata WHERE id = ?', [pos], function (err, results) {
//           if (err) {
//             console.info(err);
//           } else {
// 		  var x = [];
// 		  var y = []
// 		for (var i=0; i < results.length; i++){
// 			x.push(results[i].time);
// 			y.push(results[i].temp);
// 		}
// 		  console.log("x " + x);
// 		  console.log("y " + y);
//             socket.emit('chart_data', {
// 	      id: pos,
//               x: x,
//               y: y
//             });
//             console.info("emitted for id: "+ pos)
//           }
//         });
//       } else {
//         clearInterval(timer);
//       }
//     }, 1000);
//   });

http.listen(port, function(){
	console.log("app listening on port: " + port);
});
