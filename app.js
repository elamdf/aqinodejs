var express = require("express");
var bodyParser = require("body-parser");

var app = express();
var urlencodedParser = bodyParser.urlencoded({extended: false});

var handlebars = require("express-handlebars");
app.engine("handlebars", handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.urlencoded());
app.use(express.json());

/* set up sql con */
var mysql = require("mysql");
var con = mysql.createConnection({
    host            : process.env.MYSQL_HOST,
    port            : process.env.MYSQL_PORT,
    user            : process.env.MYSQL_USER,
    password        : process.env.MYSQL_PASSWORD,
    database        : process.env.MYSQL_DATABASE
});

/* throw an error if sql connect fails. it should fail a couple times in docker
 before successfully connecting. the container takes longer to boot up, essentially.
 */
con.connect(function(err){
	if(err){
		console.error("error connecting: " + err.stack);
		return process.exit(22); //consistently exit so the Docker container will restart until it connects to the sql db
	}
	console.log("connected as id " + con.threadId);
});

app.get('/', function(req, res){
	res.sendFile("index.html", {root:__dirname})
});


app.post("/", function (req, res) {
	const body = req.body.Body
	con.query(`INSERT INTO sensdata (id,temp) VALUES (${req.body.id}, ${req.body.temp})`, function (err, result){
		if (err) throw err;
		console.log(result);
	});
	con.query('SELECT * from sensdata', function (err, result){
		if (err) throw err;
		console.log(result);
	});
})
var port = 3257;

app.listen(port, function(){
	console.log("app listening on port: " + port);
});
