'use strict'
/*==========================
 *
 *	DEPENDENCIES & GLOBAL VARIABLES
 *
==========================*/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http,{transport:['websocket','polling']});
var uuid = require('node-uuid');
var redis = require('redis'),
    client = redis.createClient();
//middleware
var bodyParser = require('body-parser');
var session = require('express-session');

var port = process.env.PORT || 3000;

//routes
var index = require('./routes/index');



/*==========================
 *
 * 	MIDDLEWARE
 *
==========================*/


//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended:false}));

// parse application/json
app.use(bodyParser.json());

// session
app.use(session({
	secret: 'sendUrL',
	cookie:{secure:true}
}));

//js css img
app.use(express.static(__dirname+'/public'));

//jade
app.set('view engine','jade');

//views
app.set('views',__dirname+'/views');

// redis
client.on('error', function(err){
    console.log("Error "+err);
});


/*==========================
 *
 *	ROUTES
 *
==========================*/

app.get('/',index.home);

app.post('/session', function(req, res){
    var username = req.body.username;
    var pass = req.body.password;
    var myId = uuid.v1();
    req.session.username = username;
    req.session.myId = myId;
    client.set(myId, JSON.stringify(new User(username, pass, myId)));
    client.get(myId, function(err, reply){
        if(err) console.error("Redis err "+err);
        if(reply)
            console.log(reply);
        else
            console.log("Key not found")
        
        res.render('session', {
            id: myId
        });
    });
});

app.get('/session',function(req,res){
    if(req.session.myId && req.session.username){
        res.render('session',{
            id: req.session.myId
        });
    }else{
        res.redirect('/');
    }
});

function User(username, pass, id){
    this.username = username;
    this.pass = pass;
    this.id = id;
    this.roomCount = 0;
}

function changeRoomCount(id, amt, cb){
    var userObj;
    client.get(id, function(err, reply){
        if(err) console.error("Redis err "+err);
        else{
            if(reply){
                userObj = JSON.parse(reply);
                userObj.roomCount += amt;
                client.set(id, JSON.stringify(userObj));
                cb(userObj);
            }
        }
    });
}


/*==========================
 *
 *	socket.io	
 *
==========================*/



io.on('connection', function(socket){
    socket.emit("joint");
    socket.on("gotId", function(id){
        socket.id = id;
        changeRoomCount(id, 1, function(userObj){
            if(userObj.roomCount === 2)
                socket.emit("bothConnected");
        });
    });
    socket.on("disconnect", function(){
        changeRoomCount(socket.id, -1, function(userObj){
            if(userObj.roomCount === 0){
                socket.emit("roomDestroyed");
                client.del(socket.id)
            }
        });
    });
});


/*==========================
 *
 *	LISTENING ON PORT 3000
 *
==========================*/
http.listen(port, function(){
	console.log("listening on port "+port);
});
