'use strict';
 
const WebSocket = require('ws');
var loginMessagesMap = new Map();

 
var wss = new WebSocket.Server({ port: 4000 })
 
wss.on('connection', ws => {

    //inform the newly connected client about all the users who are currently logged in the service
    loginMessagesMap.forEach(function each(message) {
        ws.send(JSON.stringify(message));
      });

})

module.exports.sendAllClients = function sendAllClients(message) {
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(message));
      });
};

module.exports.saveMessage = function saveMessage(userId, message) {
    loginMessagesMap.set(parseInt(userId), message);
};

module.exports.getMessage = function getMessage(userId) {
    return loginMessagesMap.get(parseInt(userId));
};

module.exports.deleteMessage = function deleteMessage(userId) {
    loginMessagesMap.delete(userId);
};

