// Gateway Client - connects to the gateway
const EventEmitter = require('events');
const WebSocket = require('ws');
const OPCodes = require('./OPCodes.js');

class Worker extends EventEmitter {
  constructor({ use, address, secret }) {
    super();

    this.use = use;
    this.host = address;
    this.secret = secret;
    this.attempts = 0;

    this.id = null;
    this.shardStart = null;
    this.shardEnd = null;
    this.shardCount = null;

    this.connected = false;
    this.shutdown = false;
  }

  connect() {
    this.started = Date.now();
    if (!this.use) {
      this.id = 1;
      this.shardStart = 0;
      this.shardEnd = 0;
      this.shardCount = 1;
      this.emit('ready', 1, 0, 0, 1);
    } else {
      this.ws = new WebSocket(this.host);
      this.ws.on('open', this.onConnect.bind(this));
      this.ws.on('close', this.onDisconnect.bind(this));
      this.ws.on('error', this.onError.bind(this));
    }
  }

  onError(error) {
    this.emit('error', error);
  }

  onConnect() {
    this.attempts = 1;
    this.connected = true;
    this.emit('connect', Date.now() - this.started);
    this.ws.on('message', msg => {
      msg = JSON.parse(msg);
      this.onMessage(msg);
    });
  }

  onDisconnect(code, message) {
    this.emit('error', `Connection attempt failed: ${code} ${message}`);
    this.connected = false;
    this.attempts++;
    setTimeout(() => {
      this.emit('debug', `Attempting to reconnect, attempt #${this.attempts}...`);
      this.connect();
    }, 2500);
  }

  send(op, data, extras = {}) {
    if (!this.connected) return;
    this.ws.send(JSON.stringify(Object.assign(extras, { op, d: data })));
  }

  onMessage(packet) {
    this.emit('message', packet);
    switch(packet.op) {
      case OPCodes.HELLO: {
        this.identify();
        this.heartbeatInterval = setInterval(this.heartbeat.bind(this), packet.d.heartbeat_interval);
        return;
      }

      case OPCodes.IDENTIFY: {
        this.shardStart = packet.d.shard_start;
        this.shardEnd = packet.d.shard_end;
        this.shardCount = packet.d.shard_count;
        this.id = packet.d.id;
        this.emit('ready', this.id, this.shardStart, this.shardEnd, this.shardCount);
        return;
      }

      case OPCodes.RESOLVE: {
        this.emit(`resolve_${packet.id}`, packet.d.results);
        return;
      }

      case OPCodes.REQUEST: {
        this.emit('request', packet.id, packet.d);
        break;
      }

      case OPCodes.HEARTBEAT_ACK: {
        this.latency = Date.now() - this.lastSentHeartbeat;
        this.emit('latency', this.latency);
        break;
      }

      case OPCodes.SHUTDOWN: {
        process.exit();
        break;
      }
    }
  }

  async request(target, input) {
    if (!this.connected) return undefined;
    const id = (process.hrtime().reduce((a, b) => a + b) + Date.now()).toString(36);

    return new Promise((resolve) => {
      this.send(OPCodes.REQUEST, { input }, { to: target, id });
      this.once(`resolve_${id}`, resolve);
    });
  }

  resolve(id, data) {
    if (!this.connected) return;
    this.send(OPCodes.RESOLVE, { result: data }, { id });
  }

  heartbeat() {
    this.lastSentHeartbeat = Date.now();
    this.send(OPCodes.HEARTBEAT);
  }

  identify() {
    const payload = {
      type: 'cluster',
      id: this.id,
      shard_start: this.shardStart,
      shard_end: this.shardEnd,
      secret: this.secret
    };
    this.send(OPCodes.IDENTIFY, payload);
  }

}

module.exports = Worker;
