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
	con.query(`INSERT INTO sensdata (id, name, temp, humidity, pressure, altitude) VALUES (${req.body.id}, "${req.body.name}", ${req.body.temp}, ${req.body.humidity}, ${req.body.pressure}, ${req.body.altitude})`, function (err, result){
		if (err){
			throw err;
			res.sendStatus(500);
		}
		updateData();
	});
	res.sendStatus(200);
})
io.sockets.on('connection', function (socket) {
	var id = 1
	con.query('SELECT DISTINCT id, name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query('SELECT UNIX_TIMESTAMP(time), temp, humidity, pressure, altitude, name FROM sensdata WHERE id = ?', [elem.id], function (err, results) {
					if (err) throw err;
					socket.emit("chartinit", {data:results.map(Object.values), id:elem.id, name:elem.name})
			});
		});
	});
});

function updateData() {
	con.query('SELECT DISTINCT id, name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query("SELECT UNIX_TIMESTAMP(time), temp, humidity, pressure,altitude FROM sensdata WHERE id = ? ORDER BY time DESC LIMIT 1", [elem.id], function (err, results) {
					if (err) throw err;
						io.emit("update", {data:results.map(Object.values), id:elem.id, name:elem.name});
			});
		});
	});
}

http.listen(port, function(){
	console.log("app listening on port: " + port);
});
