let ipc = require('node-ipc');
let uuid = require('uuid');
let findListeningSocket = require('./find-listening-socket');

process.traceProcessWarnings = true;
ipc.config.silent = true;
let socketClient = null;
let replyHandlers = new Map();

function send(name, args) {
  return new Promise((resolve, reject) => {
    let id = uuid.v4();
    replyHandlers.set(id, { resolve, reject });
    if (socketClient) {
      socketClient.emit('message', JSON.stringify({ id, name, args }));
    }
  });
}

async function init(budgetId) {
  socketClient = await findListeningSocket();
  if (!socketClient) {
    // TODO: spawn actual
    console.log("Couldn't connect");
    return;
  }

  socketClient.on('message', data => {
    const msg = JSON.parse(data);

    if (msg.type === 'error') {
      // An error happened while handling a message so cleanup the
      // current reply handler. We don't care about the actual error -
      // a generic error handler can handle them
      const { id } = msg;
      replyHandlers.delete(id);
    } else if (msg.type === 'reply') {
      const { id, error, result } = msg;

      const handler = replyHandlers.get(id);
      if (handler) {
        replyHandlers.delete(id);

        if (error) {
          handler.reject(error);
        } else {
          handler.resolve(result);
        }
      }
    } else if (msg.type === 'push') {
      // const { name, args } = msg;
      // const listens = listeners.get(name);
      // if (listens) {
      //   listens.forEach(listener => {
      //     listener(args);
      //   });
      // }
    } else {
      throw new Error('Unknown message type: ' + JSON.stringify(msg));
    }
  });

  // return send('load-budget', { id: budgetId });
}

function disconnect() {
  ipc.disconnect(socketClient.id);
}

async function _run(func) {
  try {
    await init();
    await func();
  } catch (e) {
    if (e.type) {
      if (e.type === 'APIError') {
        console.log('*** APIError *** ', e.message);
      } else if (e.type === 'InternalError') {
        console.log('*** InternalError *** ', e.message);
      }
    } else {
      throw e;
    }
  } finally {
    disconnect();
  }
}

async function runWithBudget(id, func) {
  return _run(async () => {
    await send('api/load-budget', { id });
    await func();
  });
}

async function runImport(name, func) {
  return _run(async () => {
    await send('api/start-import', { budgetName });
    await func();
    await send('api/finish-import');
  });
}

module.exports = { init, send, disconnect, runWithBudget, runImport };
