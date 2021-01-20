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

io.sockets.on('connection', function (socket) {
	initGraphs(socket);
	initAverages(socket);
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
		req.body.temp = (req.body.temp === undefined) ? null : req.body.temp; // there's gotta be a better way to do this but I don't want to if statement through the possible sensor configurations and do a special query for each so here we are
		req.body.humidity = (req.body.humidity === undefined) ? null : req.body.humidity;
		req.body.pressure = (req.body.pressure === undefined) ? null : req.body.pressure;
		req.body.altitude = (req.body.altitude === undefined) ? null : req.body.altitude;
		req.body.NO2 = (req.body.NO2 === undefined) ? null : req.body.NO2;
		req.body.NH3 = (req.body.NH3 === undefined) ? null : req.body.NH3;
		req.body.CO = (req.body.CO === undefined) ? null : req.body.CO;
		req.body.CO2 = (req.body.CO2 === undefined) ? null : req.body.CO2;
		con.query(`INSERT INTO sensdata (name, temp, humidity, pressure, altitude, NO2, NH3, CO, CO2) VALUES ("${req.body.name}", ${req.body.temp}, ${req.body.humidity}, ${req.body.pressure}, ${req.body.altitude}, ${req.body.NO2}, ${req.body.NH3}, ${req.body.CO}, ${req.body.CO2})`, function (err, result){
			if (err){
				res.sendStatus(500);
				throw err;
			} else {
			updateData();
			res.sendStatus(200)
			}
		});
});

function initGraphs(socket){
	con.query('SELECT DISTINCT name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query(`SELECT UNIX_TIMESTAMP(time) * 1000, temp, humidity, pressure, altitude, name FROM sensdata WHERE name = ?`, [elem.name], function (err, results) {
					if (err) throw err;
					socket.emit("chartInit", {data:results.map(Object.values), id:elem.name, name:elem.name})
			});
		});
	});
};

function initAverages(socket){ // TODO make the averages not just alltime
	con.query('SELECT DISTINCT name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
					con.query(`SELECT AVG(temp), AVG(humidity), AVG(pressure), AVG(altitude) FROM sensdata WHERE name = ?`, [elem.name], function (err, results){
						if (err) throw err;
							socket.emit("averagesInit", {data:results.map(Object.values)[0], id:elem.name, name:elem.name});
							con.query(`SELECT AVG(temp), AVG(humidity), AVG(pressure), AVG(altitude) FROM sensdata WHERE name = ?`, [elem.name], function (err, results){
								if (err) throw err;
								socket.emit("averagesInit", {data:results.map(Object.values)[0], id:"all", name:"all"});
							});
					});
			});
	});
}

function updateData() {
	con.query('SELECT DISTINCT name from sensdata', function (err, results){
			if (err) throw err;
			results.forEach(elem =>{
				con.query("SELECT UNIX_TIMESTAMP(time) * 1000, temp, humidity, pressure, altitude FROM sensdata WHERE name = ? ORDER BY time DESC LIMIT 1", [elem.name], function (err, results) {
					if (err) throw err;
						io.emit("chartUpdate", {data:results.map(Object.values), id:elem.name, name:elem.name});
			});
		});
	});
}

http.listen(port, function(){
	console.log("app listening on port: " + port);
});
