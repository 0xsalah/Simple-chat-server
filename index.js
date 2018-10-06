var MongoClient = require('mongodb')
var url = 'mongodb://localhost:27017'

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

/*var data = {
  t: 13313113, //tiempo en el que se envia el msg
  oid: "ksldklsd@dklsflk.com",  //id del cliente origen
  oname: "chef1", //nombre del cliente origen
  did: "f@f.com", //id del destinatario del msg
  msg: "olakase", //msg
  plate: "aros", //nombre del plato
  plateid: 3231 //id del plato
}*/

var sUsers = {}


io.on('connection', function(socket) {

  let userID = socket.handshake.query.loggeduser
  sUsers[userID]=socket

  console.log("Connected user: "+userID);

  sendCachedMsgByDid(userID, socket)

  socket.on('sendThat', function(data, callback) {
    if (isConnected(data.did)) {
      sUsers[data.did].emit('incomingMsg', [data]);
    }
    else {
      add2db(data)
    }
    callback(true)
  });

  socket.on('disconnect', function() {
    delete sUsers[userID]
    console.log(userID);
  });

});

function isConnected(id) {
  if (sUsers[id]!=undefined) {
    return true
  }
  return false
}

function sendCachedMsgByDid(did, s) {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client){
    if (err)
      throw err

    console.log("Connected to db");
    const db =  client.db('chatserver')
    const collection = db.collection('PendingMessages');
    collection.find({}, { query: { did: did } }).toArray(function(err, result) {
      if (err) throw err;
      console.log("emit");
      s.emit('incomingMsg', result, function(success) {
        if (success) {
          deleteCachedMsgByDid(did, s)
        }
      });
    });
  })
}

function deleteCachedMsgByDid(did, s){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client){
    if (err)
      throw err

    console.log("Connected to db");
    const db =  client.db('chatserver')
    const collection = db.collection('PendingMessages');
    collection.deleteMany({did:did}, function(err, obj){
      if (err) throw err
    })
  })
}

function add2db(data) {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client){
    if (err)
      throw err

    console.log("Connected to db");
    const db =  client.db('chatserver')
    const collection = db.collection('PendingMessages');
    collection.insertOne(data, (err, result)=>{
      if (err) throw err
    })
  })
}

server.listen(80, function() {
	console.log('Servidor corriendo en http://localhost:80');
});

/*

app.get('/', function (req,res) {
   res.send('Hello');
});
*/
