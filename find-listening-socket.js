const net = require('net');
const os = require('os');
const { join } = require('path');
const ipc = require('node-ipc');

function isSocketTaken(name, fn) {
  return new Promise((resolve, reject) => {
    ipc.connectTo(name, () => {
      ipc.of[name].on('error', () => {
        ipc.disconnect(name);
        resolve(false);
      });

      ipc.of[name].on('connect', () => {
        resolve(ipc.of[name]);
      });
    });
  });
}

async function findListeningSocket() {
  let currentSocket = 1;
  let client = null;
  while (!(client = await isSocketTaken('actual' + currentSocket))) {
    currentSocket++;

    if (currentSocket >= 10) {
      return null;
    }
  }

  return client;
}

module.exports = findListeningSocket;
