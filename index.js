var Device = require('./lib/device')
var util = require('util')
var stream = require('stream')
var configHandlers = require('./lib/config-handlers')
var rfxcom = require('rfxcom');
var rfxtrx = new rfxcom.RfxCom("/dev/ttyUSB0", {debug: true});


// Give our driver a stream interface
util.inherits(rfxtrx433,stream);

function rfxtrx433(opts,app) {
  var self = this;
  this._devices = {};
  this.opts = opts;
  this._app = app;
this._rfxtrx = rfxtrx;
  this._app.log.info("RFX Device initialisation started");
  this._rfxtrx.on("ready", function(){
  this._app.log.info("RfxCom initialised");
  this._rfxtrx.reset(function(){
    this._rfxtrx.delay(500);
    this._rfxtrx.flush();
    this._rfxtrx.getStatus(function(){
      this._app.log.info("Status completed.");
    });
  });
});

this._rfxtrx.open();

  app.on('client::up',function(){
    this.opts.devices.forEach(this.loadDevice.bind(this));
  }.bind(this));
  
  

};

rfxtrx433.prototype.loadDevice = function(device) {
this._app.log.info('Loading Device');
this._app.log.info(device.device_name);
  if (this._devices[device.device_name]) return;
  this._devices[device.device_name] = new Device(device,this);
  this._app.log.info('Registering Device');
    this.emit('register',this._devices[device.device_name]);
};

rfxtrx433.prototype.config = function(rpc,cb) {

  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,cb);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};

// Export it
module.exports = rfxtrx433;
