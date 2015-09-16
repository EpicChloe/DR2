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
        if (socket.characterName == null) {

        } else {
            var index = app.onlineCharacters.indexOf(socket.characterName);
            if (index > -1) {
                app.onlineCharacters.splice(index, 1);
            }
        }
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
        var id = '';
        db.get('SELECT * FROM users WHERE accessToken = ?', UUID, function (err, row) {
            if (row == null) {
                socket.emit('invalidAccessToken');
            } else {
                id = row['ID'];
                db.get('SELECT * FROM characters WHERE accountOwner = ?', id, function (err, row) {
                    if (row == null) {
                        socket.emit('createCharacter');
                    } else {
                        socket.emit('pushCharacterData', row);
                        app.onlineCharacters.push(row.name);
                        io.emit('updateChatList', app.onlineCharacters);
                        socket.characterName = row.name;
                    }
                });
            }
        });
    });

    socket.on('creatingCharacter', function(data) {
        db.get('SELECT * FROM users WHERE accessToken = ?', data.UUID, function (err, row) {
            if (row == null) {
                socket.emit('invalidAccessToken');
            } else {
                data.id = row['ID'];
                console.log('Attempting to create Character for Account: '+row['ID']);
                db.get('SELECT * FROM characters WHERE name = ?', data.name, function (err, row) {
                    if (row == null) {
                        data.inventory = JSON.stringify({gold: 0, backpack: {size: 4, items: []}});
                        data.equipment = JSON.stringify({
                            weapon: [0, 0, 0, 0, 0, 0, 0, 0],
                            weaponMod: 0,
                            helm: [0, 0, 0, 0, 0, 0, 0, 0],
                            chest: [0, 0, 0, 0, 0, 0, 0, 0],
                            pants: [0, 0, 0, 0, 0, 0, 0, 0],
                            boots: [0, 0, 0, 0, 0, 0, 0, 0],
                            ring1: [0, 0, 0, 0, 0, 0, 0, 0],
                            ring2: [0, 0, 0, 0, 0, 0, 0, 0],
                            amulet: [0, 0, 0, 0, 0, 0, 0, 0]
                        });
                        data.talents = JSON.stringify([0, 0, 0, 0, 0]);
                        switch (data.class) {
                            case 'brawler':
                                data.skills = JSON.stringify(['TestSpell_1', 'TestSpell_2', 'TestSpell_3', 'TestSpell_4', 'TestPassive']);
                                break;
                            case 'paladin':
                                data.skills = JSON.stringify(['TestSpell_1', 'TestSpell_2', 'TestSpell_3', 'TestSpell_4', 'TestPassive']);
                                break;
                            case 'fireMage':
                                data.skills = JSON.stringify(['TestSpell_1', 'TestSpell_2', 'TestSpell_3', 'TestSpell_4', 'TestPassive']);
                                break;
                            case 'archer':
                                data.skills = JSON.stringify(['TestSpell_1', 'TestSpell_2', 'TestSpell_3', 'TestSpell_4', 'TestPassive']);
                                break;
                        }
                        console.log('Data for new Character: '+data.characterName);
                        console.log(data);
                        db.run('INSERT INTO characters (name, class, inventory, equipment, talents, skills, accountOwner) VALUES ($name, $class, $inventory, $equipment, $talents, $skills, $accountOwner)',
                            {
                                $name: data.characterName,
                                $class: data.class,
                                $inventory: data.inventory,
                                $equipment: data.equipment,
                                $talents: data.talents,
                                $skills: data.skills,
                                $accountOwner: data.id
                            },
                            function () {
                                socket.emit('characterCreationSuccess');
                                console.log('Character Created!');
                            });
                    } else {
                        socket.emit('characterNameTaken');
                    }
                });
            }
        });
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

});