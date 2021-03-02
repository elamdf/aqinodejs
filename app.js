var express = require("express")
const bcrypt = require('bcrypt');
var app = express();
var bodyParser = require("body-parser");
var session = require('express-session');
var urlencodedParser = bodyParser.urlencoded({extended: true});
var handlebars = require("express-handlebars");
var router = express.Router();
var port = 80;
const saltRounds = 10;
const http = require('http').Server(app);
const io = require('socket.io')(http, { transports: ['websocket', 'polling'], cookie:true, secure: true });
app.engine("handlebars", handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ lextended:true}));
app.use(bodyParser.json())
app.use(session({
    secret: 'BiJPakTz@@4Z^7O2h8fWAL&0c@pJmp',
    resave: true,
    saveUninitialized: true
}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* set up sql con */
var mysql = require("mysql");
var con = mysql.createConnection({
    host            : process.env.MYSQL_HOST,
    port            : process.env.MYSQL_PORT,
    user            : process.env.MYSQL_USER,
    password        : process.env.MYSQL_PASSWORD,
    database        : process.env.MYSQL_DATABASE,
});
con.connect(function(err){if (err) throw err;});
var register = async function(req,res){
    const password = req.body.password;
    const encryptedPassword = await bcrypt.hash(password, saltRounds);
    var creds={
      "username":req.body.username,
      "password":encryptedPassword
    };

    con.query('SELECT * FROM users WHERE username = ?',[req.body.username], async function (error, results, fields) {
        if (results[0] == undefined) {
          con.query('INSERT INTO users SET ?',creds, function (error, results, fields) {
            if (error) {
            res.send({
                "code":400,
                "failed":"error ocurred"
            });
            } else {
        if (req.body.browser) {
            req.session.loggedin = true;
            req.session.username = req.body.username;
            res.redirect('/');
        } else {

            res.send({
            "code":200,
            "success":"user registered sucessfully"
              });
              }
            }
          });
      } else {
          res.send({
              "code":206,
              "success":"user already exists"
          })
      }

  })
};
var regsens = async function(req, res) {
    var sensorname = req.body.sensorname
    if (req.body.username === undefined){
	var username = null;
	var password = null
    } else{
	var username = req.body.username
	var password = req.body.password
    }
  con.query('SELECT * FROM users WHERE username = ?',[username], async function (error, results, fields) {
    if (error) {
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
	    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
	console.log(sensorname)
      if(sensorname != undefined){ // results[0] sometimes still undef if no user even if this passes
        const comparision = await bcrypt.compare(password, results[0].password)
        if(comparision) {
          con.query('SELECT * FROM sensors WHERE sensorname = ?',[sensorname], async function (error, results, fields) {
              if (results[0] != undefined ) {
                  res.send({
                      "code":206,
                      "success":"sensor name is not unique"
                  })
              } else {


                var newsens = {
                      "belongsto":username,
                      "sensorname": sensorname
                }
                con.query('INSERT into sensors SET ?',[newsens], async function (err, results, fields) {
                    if (err){
                          res.send({
                        "code":400,
                        "failed":"error ocurred"
                          })
                        console.log(error)
                    } else {
                        res.send({
                        "code":200,
                        "success":"sensor registered sucessfully"
                        });
                    }
                });
              }
            });
    }
        else{
          res.send({
               "code":204,
               "success":"Username and password does not match"
          })
        }
      }
      else{
	      console.log('what')
        res.send({
          "code":206,
          "success":"Username does not exist"
            });
      }
    }
    });
}

var login = async function(req,res){
  if (req.session.loggedin){
      res.send({
        "code":200,
    "success":"you are already logged in",
    "username":req.session.username
      })
    return 0;
  }

  var username= req.body.username;
  var password = req.body.password;
  if (username === undefined || password === undefined) {
            res.send({
              "code":400,
              "success":"please enter both a username and a password!"
            })
	  return
  }

  con.query('SELECT * FROM users WHERE username = ?',[username], async function (error, results, fields) {
    if (error) {
      res.send({
        "code":402,
        "failed":"error ocurred"
      })
    }else{
      if(results[0] != undefined){
        const comparision = await bcrypt.compare(password, results[0].password)
        if(comparision){
        if (req.body.browser) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/')
        } else {
            res.send({
              "code":200,
              "success":"login sucessfull"
            })
        }
        }
        else{
          res.send({
               "code":204,
               "success":"Username and password do not match"
          })
        }
      }
      else{
        res.send({
          "code":206,
          "success":"Username does not exits"
            });
      }
    }
    });
}

var new_data = async function(req,res){
    var sensorname = req.body.sensorname
    var username = req.body.username
    var password = req.body.password
    req.body.temp = (req.body.temp === undefined) ? null : req.body.temp; // there's gotta be a better way to do this but I don't want to if statement through the possible sensor configurations and do a special query for each so here we are
    req.body.humidity = (req.body.humidity === undefined) ? null : parseFloat(req.body.humidity);
    req.body.pressure = (req.body.pressure === undefined) ? null : parseFloat(req.body.pressure);
    req.body.altitude = (req.body.altitude === undefined) ? null : parseFloat(req.body.altitude);
    req.body.NO2 = (req.body.NO2 === undefined) ? null : parseFloat(req.body.NO2);
    req.body.NH3 = (req.body.NH3 === undefined) ? null : parseFloat(req.body.NH3);
    req.body.CO = (req.body.CO === undefined) ? null : parseFloat(req.body.CO);
    req.body.CO2 = (req.body.CO2 === undefined) ? null : parseFloat(req.body.CO2);
  con.query('SELECT * FROM users WHERE username = ?',[username], async function (error, results, fields) {
    if (error) {
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      if(results[0] != undefined){
        const comparision = await bcrypt.compare(password, results[0].password)
        if(comparision){
          con.query('SELECT * FROM sensors WHERE sensorname = ?',[sensorname], async function (error, results, fields) {
              if (results[0] == undefined) {
                  res.send({
                      "code":206,
                      "success":"sensor doesn't exist"
                  })
              } else {
                con.query(`INSERT INTO sensdata (sensorname, temp, humidity, pressure, altitude, NO2, NH3, CO, CO2) VALUES ("${req.body.sensorname}", ${req.body.temp}, ${req.body.humidity}, ${req.body.pressure}, ${req.body.altitude}, ${req.body.NO2}, ${req.body.NH3}, ${req.body.CO}, ${req.body.CO2})`, function (err, result){
                if (err){
                      res.send({
                          "code":206,
                          "success":"data insert failed"
                      })
                    console.log(err)
                } else {
                    updateData();
		    console.log("b")
                    res.send({
                        "code":200,
                        "success":"data pushed!"
                    })
                }
            });
    }
            });
      }
        else{
          res.send({
               "code":204,
               "success":"Username and password does not match"
          })
        }
      }
      else{
        res.send({
          "code":206,
          "success":"Username does not exist"
            });
      }
    }
    });
};

var checkUnique = async function(req,res){
    con.query(`SELECT COUNT(sensorname) AS n FROM sensdata WHERE sensorname = ? LIMIT 1`, [req.body.name], function(err, result){
        if (err) console.log(err);
        if (!result[0].n)
            res.sendStatus(200);
        else
            res.sendStatus(403);
    });
};
router.post('/register',register);
router.post('/login',login);
router.post('/regsens',regsens);
router.post('/in',new_data);
router.post('/checkUnique', checkUnique);


app.use('/api', router);
app.get('/', function(req, res){
    res.sendFile("index.html", {root:__dirname})
});
app.get("/login", function(req, res) {
    if (req.session.loggedin) {
        res.redirect('/')
    } else {
        res.sendFile("login.html", {root:__dirname});
    }
});
app.get("/register", function(req, res) {
    if (req.session.loggedin) {
        res.redirect('/')
    } else {
        res.sendFile("register.html", {root:__dirname});
    }
});
app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        response.send('Please login to view this page!');
    }
    response.end();
});

io.sockets.on('connection', function (socket) {
    initGraphs(socket);
    initAverages(socket);
});

app.get("/test", function(req, res){
    res.sendStatus(200);
});




function initGraphs(socket){
    con.query('SELECT DISTINCT sensorname from sensdata', function (err, results){
	    if (results[0] == undefined) {
		    return
	    }
            if (err) console.log(err);
            results.forEach(elem =>{
                con.query(`SELECT UNIX_TIMESTAMP(time) * 1000, temp, humidity, CO2, NO2, NH3, CO, pressure, altitude, sensorname FROM sensdata WHERE sensorname = ?`, [elem.sensorname], function (err, results) {
                    if (err) console.log(err);
                    socket.emit("chartInit", {data:results.map(Object.values), id:elem.sensorname, name:elem.sensorname})
            });
        });
    });
};

function initAverages(socket){ // TODO make the averages not just alltime
    con.query(`SELECT AVG(temp), AVG(humidity), AVG(pressure), AVG(CO2) FROM sensdata`, function (err, results){
        if (err) console.log(err);
        socket.emit("averagesInit", {data:results.map(Object.values)[0], id:"all", sensorname:"all"});
    });
}

function updateData() {
    con.query('SELECT DISTINCT sensorname from sensdata', function (err, results){
            if (err) console.log(err);
            results.forEach(elem =>{
                con.query("SELECT UNIX_TIMESTAMP(time) * 1000, temp, humidity, CO2, NO2, NH3, CO, pressure, altitude, sensorname FROM sensdata WHERE sensorname = ? ORDER BY time DESC LIMIT 1", [elem.sensorname], function (err, results) {
                    if (err) console.log(err);
                        io.emit("chartUpdate", {data:results.map(Object.values), id:elem.sensorname, name:elem.sensorname});
            });
        });
    });
}

http.listen(port, function(){
    console.log("app listening on port: " + port);
});
