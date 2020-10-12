var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost')
 
client.on('connect', function () {
  client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
  client.subscribe('ledStatus', function (err) {
    if(err) {
      client.publish('ledStatus', 'Error While subscribing to ledStatus')
    }
    if(!err) {
      client.publish('ledStatus', 'Listening to led Status')
    }
  })
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  console.log('Topic: ' + topic + ' Message: ' + message.toString()+'')
  // client.end()
})
