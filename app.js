var app = require("express")();
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({extended: true});
var handlebars = require("express-handlebars");
const http = require('http').Server(app);
const io = require('socket.io')(http, { transports: ['websocket', 'polling'], cookie:true, secure: true });
app.engine("handlebars", handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ lextended:true}));
var port = 80;
/* set up sql con */
var mysql = require("mysql");
var con = mysql.createConnection({
    host            : process.env.MYSQL_HOST || "aqisens.cdez79drr72p.us-east-2.rds.amazonaws.com",
    port            : process.env.MYSQL_PORT  || 3306,
    user            : process.env.MYSQL_USER  || "admin",
    password        : process.env.MYSQL_PASSWORD  || "w8NM%t1cBxnHCGfIq1HGF",
    database        : process.env.MYSQL_DATABASE  || "aqidb"
});
var tries = 5;
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

app.get("/test", function(req, res){
	res.sendStatus(200);
});

app.post("/checkUnique", function(req, res){
	console.log(req)
	con.query(`SELECT COUNT(name) AS n FROM sensdata WHERE name = ? LIMIT 1`, [req.body.name], function(err, result){
		if (err) throw err;
		if (!result[0].n)
			res.sendStatus(200);
		else
			res.sendStatus(403);
	});
});


app.post("/in", function (req, res) {
	if (req.body.time != undefined){
		con.query(`INSERT INTO sensdata (id, time, name, temp, humidity, pressure, altitude) VALUES (${req.body.id}, "${req.body.time}", "${req.body.name}", ${req.body.temp}, ${req.body.humidity}, ${req.body.pressure}, ${req.body.altitude})`, function (err, result){
			if (err){
				res.sendStatus(500);
				throw err;
			} else {
			updateData();
			}
		});
	} else {
		con.query(`INSERT INTO sensdata (id, name, temp, humidity, pressure, altitude) VALUES (${req.body.id}, "${req.body.name}", ${req.body.temp}, ${req.body.humidity}, ${req.body.pressure}, ${req.body.altitude})`, function (err, result){
			if (err){
				res.sendStatus(500);
				throw err;
			} else {
			updateData();
			}
		});
	}
		res.sendStatus(200);
})
io.sockets.on('connection', function (socket) {
	initGraphs(socket);
	initAverages(socket);
});
function initGraphs(socket){
	var id = 1
	con.query('SELECT DISTINCT id, name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query(`SELECT UNIX_TIMESTAMP(time) * 1000, temp, humidity, pressure, altitude, name FROM sensdata WHERE id = ?`, [elem.id], function (err, results) {
					if (err) throw err;
					socket.emit("chartInit", {data:results.map(Object.values), id:elem.id, name:elem.name})
			});
		});
	});
};
function initAverages(socket){ // TODO make the averages not just alltime
	con.query('SELECT DISTINCT id, name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
					con.query(`SELECT AVG(temp), AVG(humidity), AVG(pressure), AVG(altitude) FROM sensdata WHERE id = ?`, [elem.id], function (err, results){
						if (err) throw err;
							socket.emit("averagesInit", {data:results.map(Object.values)[0], id:elem.id, name:elem.name});
							con.query(`SELECT AVG(temp), AVG(humidity), AVG(pressure), AVG(altitude) FROM sensdata WHERE id = ?`, [elem.id], function (err, results){
								if (err) throw err;
								socket.emit("averagesInit", {data:results.map(Object.values)[0], id:"all".id, name:"all"});
							});
					});
			});
	});
}


function updateData() {
	con.query('SELECT DISTINCT id, name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query("SELECT UNIX_TIMESTAMP(time) * 1000, temp, humidity, pressure,altitude FROM sensdata WHERE id = ? ORDER BY time DESC LIMIT 1", [elem.id], function (err, results) {
					if (err) throw err;
						io.emit("chartUpdate", {data:results.map(Object.values), id:elem.id, name:elem.name});
			});
		});
	});
}

http.listen(port, function(){
	console.log("app listening on port: " + port);
});
