var express = require('express')
var app = express()
const server = require('http').createServer(app)
var mqtt = require('mqtt')
const io =  require('socket.io')(server)
var path = require('path')
var cors = require('cors')
const {spawn} = require('child_process');

var client  = mqtt.connect('mqtt://localhost')
app.use(express.static(path.join(__dirname, 'build')))
app.use(cors())


io.sockets.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  socket.on('closeServer', data => {
      console.log('Receiving order to close server')
      process.exit(1)
  })
  socket.on('restartServer', data => {
    console.log('Receiving order to restart server')
    setTimeout(function () {
      process.on("exit", function () {
          require("child_process").spawn(process.argv.shift(), process.argv, {
              cwd: process.cwd(),
              detached : true,
              stdio: "inherit"
          });
      });
      process.exit();
  }, 5000);
  })
  socket.on('FromClient', response => {
    client.publish('presence', response)
  })
  socket.on('esp/led/control', (response) => {
    client.publish('esp/led/control', response.status.toString())
  })
  socket.on('esp/led/status/get', () => {
    client.publish('esp/led/status/get', 'Requesting Led Status')
  })
  socket.on('rangeTest',(response) => {
    let responseValue = response*1
    let payload = Math.trunc((responseValue/100)*(1023))
    client.publish('esp/led/analogwrite', payload.toString())
  })
  socket.on('potControl', (response) => {
    console.log('potControl => ', response)
    client.publish('esp/pot/control', response)
  })
  client.on('message', async function (topic, message) {

    if(topic === 'esp/connection_status') {
      socket.emit('connectionStatus', message.toString())
    }
    if(topic === 'esp/led/status'){
      socket.emit('esp/led/status', message.toString())
    }
    if(topic === 'esp/pot/status'){
      socket.emit('potStatus', message.toString())
    }
    if(topic === 'esp/button/status'){
      socket.emit('buttonStatus', message.toString())
    }
  })
});

server.listen(3000, function (){
  client.on('connect', function () {
    client.subscribe('presence', function (err) {
      if (!err) {
        client.publish('presence', 'Hello from nodejs')
      }
    })
    client.subscribe('esp/led/status')
    client.subscribe('esp/led/control')
    client.subscribe('esp/connection_status')
    client.subscribe('esp/button/status')
    client.subscribe('esp/pot/control')
    client.subscribe('esp/pot/status')
  })
  client.on('message', function (topic, message) {
    // message is Buffer
    console.log('Topic: ' + topic + ' Message: ' + message.toString()+'')
    // client.end()
  })
   console.log('listening on 3000')
})
