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
		if (err){
			throw err;
			res.sendStatus(500);
		}
		updateData();
	});
	// con.query('SELECT * from sensdata', function (err, result){
	// con.query('SELECT * FROM sensdata WHERE id = ?', [id], function (err, results) { // maybe useful for individual sensor graphs
	// 	if (err) throw err;
	// 	console.log(result);
	// });
	res.sendStatus(200);
})
io.sockets.on('connection', function (socket) {
	var id = 1
	con.query('SELECT DISTINCT id from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query('SELECT time, temp FROM sensdata WHERE id = ?', [elem.id], function (err, results) {
					if (err) throw err;
					socket.emit("chartinit", {data:results.map(Object.values), id:elem.id})
			});
		});
	});
});

function updateData() {
	con.query('SELECT DISTINCT id from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query("SELECT time, temp FROM sensdata WHERE id = ? ORDER BY time DESC LIMIT 1", [elem.id], function (err, result) {
					if (err) throw err;
						io.emit("update", {data:result.map(Object.values), id:elem.id});
			});
		});
	});
}

http.listen(port, function(){
	console.log("app listening on port: " + port);
});
