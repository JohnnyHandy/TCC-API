var topics = require('./topics')
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
  const socketEmit = (topic, message) => {
    return socket.emit('clientSocket', {
      topic: topic,
      message: message.toString()
    })
  }
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
  socket.on('apiSocket', (response) => {
    const { topic, message } = response
    client.publish(topic, message)
  })
  client.on('message', async function (topic, message) {
    switch(topic) {
      case topics.ESP_CONNECTION_SENDSTATUS :
        return socketEmit(topic, message)
        // return socket.emit('connectionStatus', message.toString());
      case topics.ESP_LED_SENDSTATUS : 
      return socketEmit(topic, message)
      // return socket.emit('esp/led/status', message.toString());
      case topics.ESP_POT_SENDSTATUS :
        return socketEmit(topic, message)
        // return socket.emit('potStatus', message.toString());
      case topics.ESP_BUTTON_SENDSTATUS :
        return socketEmit(topic, message)
        // return socket.emit('buttonStatus', message.toString());
      default :
    }
  })
});

server.listen(3000, function (){
  client.on('connect', function () {
    client.subscribe('+/presence', function (err) {
      if (!err) {
        client.publish(topics.API_PRESENCE, 'Hello from nodejs')
      }
    })
    client.subscribe(topics.ESP_LED_SENDSTATUS)
    client.subscribe(topics.ESP_LED_CONTROL)
    client.subscribe(topics.ESP_CONNECTION_SENDSTATUS)
    client.subscribe(topics.ESP_BUTTON_SENDSTATUS)
    client.subscribe(topics.ESP_POT_CONTROL)
    client.subscribe(topics.ESP_POT_SENDSTATUS)
  })
  client.on('message', function (topic, message) {
    console.log('Topic: ' + topic + ' Message: ' + message.toString()+'')
  })
   console.log('listening on 3000')
})
