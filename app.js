var topics = require('./topics')
var express = require('express')
var mqtt = require('mqtt')
var path = require('path')
var cors = require('cors')

var app = express()
const server = require('http').createServer(app)
const io =  require('socket.io')(server)


const {spawn} = require('child_process');

var client  = mqtt.connect('mqtt://localhost')
app.use(express.static(path.join(__dirname, 'build')))
app.use(cors())

const socketEmit = (socket, topic, message) => {
  return socket.emit('clientSocket', {
    topic: topic,
    message: message.toString()
  })
}
const clientPublish = (topic,message) => {
  return client.publish(topic, message)
}
io.sockets.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  socket.on('apiSocket', (response) => {
    const { topic, message } = response
    console.log('topic', topic, 'message', message)
    return clientPublish(topic, message)
    // client.publish(topic, message)
  })
  client.on('message', async function (topic, message) {
    return socketEmit(socket, topic, message)
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
    client.subscribe(topics.ESP_CONNECTION_SENDSTATUS)
    client.subscribe(topics.ESP_BUTTON_SENDSTATUS)
    client.subscribe(topics.ESP_POT_SETCONTROL)
    client.subscribe(topics.ESP_POT_SENDCONTROL)
    client.subscribe(topics.ESP_POT_SENDSTATUS)
  })
  client.on('message', function (topic, message) {
    console.log('Topic: ' + topic + ' Message: ' + message.toString()+'')
  })
   console.log('listening on 3000')
})

  //Legacy
  // socket.on('closeServer', data => {
  //     console.log('Receiving order to close server')
  //     process.exit(1)
  // })
  // socket.on('restartServer', data => {
  //   console.log('Receiving order to restart server')
  //   setTimeout(function () {
  //     process.on("exit", function () {
  //         require("child_process").spawn(process.argv.shift(), process.argv, {
  //             cwd: process.cwd(),
  //             detached : true,
  //             stdio: "inherit"
  //         });
  //     });
  //     process.exit();
  // }, 5000);
  // })