var debug = true;
// ------------------------------ //
var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();
var colors = require('colors');
var moment = require('moment');
var bcrypt = require('bcrypt-node');

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database('research/db/main.db');

var httpServer = http.createServer(app);

var server = httpServer.listen(80, function(){
    if (debug) {
        console.log('Test Server created and listening on port 80'.yellow);
    } else {
        console.log('Server created and listening on port 80'.yellow);
    }
});

var io = require('socket.io').listen(server);

app.use(express.static('research/www/'));

app.onlineCharacters = [];

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

io.on('connection', function (socket) {
    console.log('Connection Established'.cyan);

    socket.on('disconnect', function(){
        console.log('Socket Disconnected');
    });

    socket.on('loginAttempt', function(data){

        var accessToken = generateUUID(),
            email = data[0],
            pass = data[1],
            reg = data[2],
            id = '',
            passHash = '';

        if (reg) {
            console.log('Registering Account: ' + email);
            db.get('SELECT * FROM users WHERE email = ?', email, function (err, row) {
                if (row == null) {
                    console.log('Making Account');
                    bcrypt.hash(pass, null, null, function(err, hash) {
                        db.run('INSERT INTO users (email, password, accessToken) VALUES ($email, $hash, $token)',
                            {$email: email, $hash: hash, $token:accessToken},
                            function() {
                                socket.emit('loginSuccess', accessToken);
                            }
                        );
                    });
                } else {
                    console.log('EMail Taken');
                    socket.emit('registrationFail');
                }
            });
        } else {
            console.log('Authorizing Account: ' + email);
            db.get('SELECT * FROM users WHERE email = ?', email, function (err, row) {
                    id = row['ID'];
                    passHash = row['password'];
                    bcrypt.compare(pass, passHash, function (err, res) {
                        if (res) {
                            db.run('UPDATE users SET accessToken = $token WHERE ID = $id',
                                {$id: id, $token: accessToken}, function () {
                                    socket.emit('loginSuccess', accessToken);
                                }
                            );
                        } else {
                            socket.emit('loginFailed');
                        }
                    });
                }
            );
        }
    });

    socket.on('fetchData', function(UUID) {
        socket.emit('createCharacter');
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

});