/* MagicMirror²
 * Module: GPIO-Notifications
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const Gpio = require("onoff").Gpio;

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
    this.currentProfile = "";
    this.currentProfilePattern = new RegExp(".*");
    this.lastMessuresLow = {}
    this.lastMessuresHigh = {}
	this.lastMessuresCW = {}
    this.lastMessuresCCW = {}
	this.lastActionsRotary = {}
	this.lastValuesRotaryPins = {}
  },

  sendAllNotificationsOfSinglePins: function () {
	const self = this
	let curTimestamp = Date.now()
	console.log(self.name + ": Sending notifications of all pins...");
	for (curPin in self.config) {
		if (curPin.indexOf(",") == -1){
			let curDelay
			let pinLow
			let curMessures
			if (self.gpio[String(curPin)].readSync() == 0){
				curDelay = self.config[String(curPin)].delay_low
				pinLow = true
				curMessures = self.lastMessuresLow[String(curPin)]
			} else {
				curDelay = self.config[String(curPin)].delay_high
				pinLow = false
				curMessures = self.lastMessuresHigh[String(curPin)]
			}

			if (
				curTimestamp - curMessures >
				curDelay
			) {
				console.log(
					self.name + ": Sending notifications of pin " + curPin + "..."
				);

				if(pinLow){
					self.lastMessuresLow[String(curPin)] = curTimestamp;
				} else {
					self.lastMessuresHigh[String(curPin)] = curTimestamp;
				}

				let curNotifications = []
				if (typeof self.config[String(curPin)].notifications !== "undefined"){
				curNotifications = curNotifications.concat(self.config[String(curPin)].notifications)
				}

				if (typeof self.config[String(curPin)].notifications_low !== "undefined"){
				curNotifications = curNotifications.concat(self.config[String(curPin)].notifications_low)
				}

				if (typeof self.config[String(curPin)].notifications_high !== "undefined"){
				curNotifications = curNotifications.concat(self.config[String(curPin)].notifications_high)
				}
				curLength = curNotifications.length;
				for (i = 0; i < curLength; i++) {
				let curNotification = curNotifications[i];
				if (
					typeof curNotification.profiles === "undefined" ||
					self.currentProfilePattern.test(curNotification.profiles)
				) {
					self.sendSocketNotification(
					curNotification.notification,
					curNotification.payload
					);
				} else {
					console.log(
					self.name +
						": Skipped notifcation " +
						curNotification.notification +
						" because it is not active in the current profile!"
					);
				}
				}
			} else {
				console.log(
				self.name +
					": Skipping pin " +
					curPin +
					" because the delay is not exceeded !"
				);
			}
		}
	}
  },

  sendNotificationsOfSinglePin: function (curPin, curValue) {
    const self = this
    let curTimestamp = Date.now()

	console.log(
		self.name + ": Sending notifications of pin " + curPin + "..."
	);

	let curDelay
	let curMessures
	if (curValue === 0){
		curDelay = self.config[String(curPin)].delay_low
		curMessures = self.lastMessuresLow[String(curPin)]
	} else {
		curDelay = self.config[String(curPin)].delay_high
		curMessures = self.lastMessuresHigh[String(curPin)]
	}

	if (
		curTimestamp - curMessures >
		curDelay
		)
	{
		let toSendNotifications = []
		if ((typeof self.config[String(curPin)].gpio_state !== "undefined") &&
			(curValue === self.config[String(curPin)].gpio_state)
		){
			if (typeof self.config[String(curPin)].notifications !== "undefined"){
			toSendNotifications = toSendNotifications.concat(self.config[String(curPin)].notifications)
			}
		}

		if ((typeof self.config[String(curPin)].notifications_low !== "undefined") &&
		(curValue === 0)
		){
			toSendNotifications = toSendNotifications.concat(self.config[String(curPin)].notifications_low)
		}

		if ((typeof self.config[String(curPin)].notifications_high !== "undefined") &&
		(curValue === 1)
		){
			toSendNotifications = toSendNotifications.concat(self.config[String(curPin)].notifications_high)
		}

		let curLength = toSendNotifications.length

		if (curLength > 0) {
			if (curValue === 0){
			console.log(
				self.name + ": Sending notifications for low state of pin " + curPin + "..."
			);
			self.lastMessuresLow[String(curPin)] = curTimestamp;
			} else {
			console.log(
				self.name + ": Sending notifications for high state of pin " + curPin + "..."
			);
			self.lastMessuresHigh[String(curPin)] = curTimestamp;
			}

			for (let i = 0; i < curLength; i++) {
			let curNotification = toSendNotifications[i];
			// console.log("CurProfile: " + self.currentProfile);
			// console.log("CurProfileString: " + curNotification.profiles);
			if (
				typeof curNotification.profiles === "undefined" ||
				self.currentProfilePattern.test(curNotification.profiles)
			) {
				// console.log(
				// 	self.name +
				// 		": Sending notification: "+curNotification.notification
				// );
				self.sendSocketNotification(
					curNotification.notification,
					curNotification.payload
				);
			} else {
				console.log(
				self.name +
					": Skipped notifcation " +
					curNotification.notification +
					" because it is not active in the current profile!"
				);
			}
			}
		} else {
			console.log(
			self.name + ": Skipped notifications of pin " + curPin + " cause the state "+curValue+" has no notifications configured."
			);
		}
	} else {
		console.log(
			self.name +
			": Skipping pin " +
			curPin +
			" because the delay is not exceeded !"
		);
	}
  },

  sendNotificationsOfRotary: function (curRotary, directionCW) {
	const self = this
	if (directionCW){
		console.log(self.name +": Send notifications of rotary: "+curRotary+" of direction clockwise")
	} else {
		console.log(self.name +": Send notifications of rotary: "+curRotary+" of direction counterclockwise")
	}

	let curTimestamp = Date.now()
	let toSendNotifications = []
	if (directionCW){
		if (typeof self.config[String(curRotary)]["notifications_cw"] !== "undefined"){
			toSendNotifications = toSendNotifications.concat(self.config[String(curRotary)]["notifications_cw"])
		}
	} else {
		if (typeof self.config[String(curRotary)]["notifications_ccw"] !== "undefined"){
			toSendNotifications = toSendNotifications.concat(self.config[String(curRotary)]["notifications_ccw"])
		}
	}

	let curDelay
	if (directionCW){
		curDelay = self.config[String(curRotary)].delay_cw
		curMessures = self.lastMessuresCW[String(curRotary)]
	} else {
		curDelay = self.config[String(curRotary)].delay_ccw
		curMessures = self.lastMessuresCCW[String(curRotary)]
	}

	if (
		curTimestamp - curMessures >
		curDelay
		)
	{
		if (directionCW){
			self.lastMessuresCW[String(curRotary)] = curTimestamp
		} else {
			self.lastMessuresCCW[String(curRotary)] = curTimestamp
		}

		let curLength = toSendNotifications.length

		if (curLength > 0) {
			for (let i = 0; i < curLength; i++) {
				let curNotification = toSendNotifications[i];
				// console.log("CurProfile: " + self.currentProfile);
				// console.log("CurProfileString: " + curNotification.profiles);
				if (
					typeof curNotification.profiles === "undefined" ||
					self.currentProfilePattern.test(curNotification.profiles)
				) {
					// console.log(
					// 	self.name +
					// 		": Sending notification: "+curNotification.notification
					// );
					self.sendSocketNotification(
						curNotification.notification,
						curNotification.payload
					);
				} else {
					console.log(
					self.name +
						": Skipped notifcation " +
						curNotification.notification +
						" because it is not active in the current profile!"
					);
				}
			}
		} else {
			if (directionCW){
				console.log(
					self.name + ": Skipped rotary " + curRotary + " cause clockwise direction has no notifications configured."
				);
			} else {
				console.log(
					self.name + ": Skipped rotary " + curRotary + " cause counterclockwise direction has no notifications configured."
				);
			}
		}
	} else {
		console.log(
			self.name +
			": Skipping rotary " +
			curRotary +
			" because the delay is not exceeded !"
		);
	}
  },

  registerSinglePin: function(curPin) {
	const self = this
	console.log(self.name + ": Registering pin: " + curPin)
	let curDebounce = 0
	if (typeof self.config[String(curPin)].gpio_debounce !== "undefined"){
		curDebounce = self.config[String(curPin)].gpio_debounce
	}
	self.gpio[String(curPin)] = new Gpio(curPin, "in", "both", {
		debounceTimeout: curDebounce
	});
	console.log(
		self.name + ": Watched pin: " + curPin + " has debounce of "+curDebounce+"!"
	);
	self.lastMessuresLow[String(curPin)] = -1;
	self.lastMessuresHigh[String(curPin)] = -1;
	if (typeof self.config[String(curPin)].delay === "undefined") {
		self.config[String(curPin)].delay = 0;
	}
	if (typeof self.config[String(curPin)].delay_high === "undefined") {
		self.config[String(curPin)].delay_high = self.config[String(curPin)].delay;
	}
	if (typeof self.config[String(curPin)].delay_low === "undefined") {
		self.config[String(curPin)].delay_low = self.config[String(curPin)].delay;
	}

	console.log(
		self.name + ": Watched pin: " + curPin + " has low state delay of "+self.config[String(curPin)].delay_low+"!"
	);

	console.log(
		self.name + ": Watched pin: " + curPin + " has high state delay of "+self.config[String(curPin)].delay_high+"!"
	);

	(function (gpiox, theCurPin) {
		gpiox.watch(function (err, value) {
			if (err) {
				console.log(err);
			}
			console.log(
				self.name + ": Watched pin: " + curPin + " triggered with value "+value+"!"
			);
			self.sendNotificationsOfSinglePin(theCurPin, value);
		});
	})(self.gpio[String(curPin)], curPin);
  },

  evaluateRotaryResults: function(identifier, dataPin, clockPin, dataValue, clockValue, actionPinIsData) {
	const self = this
	let curTimestamp = Date.now()
	let curRotaryDelay = self.config[identifier].rotaryDelay || 5
	//console.log("Evaluating current values of rotary: "+identifier)
	if (dataValue == clockValue){
		if (curTimestamp - self.lastActionsRotary[identifier] > curRotaryDelay){
			self.lastActionsRotary[identifier] = curTimestamp

			if (dataValue == 1){
				//console.log("Got a High/High")
				if (self.lastValuesRotaryPins[dataPin] == 0){
					if (self.lastValuesRotaryPins[clockPin] == 1){
						//console.log("CW("+identifier+")")
						self.sendNotificationsOfRotary(identifier, true)
					}
				} else {
					if (self.lastValuesRotaryPins[clockPin] == 0) {
						//console.log("CCW("+identifier+")")
						self.sendNotificationsOfRotary(identifier, false)
					}
				}
			} else {
				//console.log("Got a Low/Low")
				if (self.lastValuesRotaryPins[dataPin] == 1){
					if(self.lastValuesRotaryPins[clockPin] == 0){
						//console.log("CW("+identifier+")")
						self.sendNotificationsOfRotary(identifier, true)
					}
				} else {
					if(self.lastValuesRotaryPins[clockPin] == 1){
						//console.log("CCW("+identifier+")")
						self.sendNotificationsOfRotary(identifier, false)
					}
				}
			}
		}
	} else {
		if (actionPinIsData){
			self.lastValuesRotaryPins[dataPin] = dataValue
		} else {
			self.lastValuesRotaryPins[clockPin] = clockValue
		}
	}
  },

  registerRotary: function (identifier, dataPin, clockPin) {
	const self = this
	console.log(self.name + ": Registering rotary encoder: " + identifier)
	self.lastActionsRotary[identifier] = 0

	let curDebounce = 0

	self.lastValuesRotaryPins[String(dataPin)] = 1
	self.lastValuesRotaryPins[String(clockPin)] = 1
	self.lastMessuresCW[String(identifier)] = 0
	self.lastMessuresCCW[String(identifier)] = 0

	if (typeof self.config[String(identifier)].delay === "undefined") {
		self.config[String(identifier)].delay = 0;
	}
	if (typeof self.config[String(identifier)].delay_cw === "undefined") {
		self.config[String(identifier)].delay_cw = self.config[String(identifier)].delay;
	}
	if (typeof self.config[String(identifier)].delay_ccw === "undefined") {
		self.config[String(identifier)].delay_ccw = self.config[String(identifier)].delay;
	}

	if (typeof self.config[String(identifier)].gpio_debounce !== "undefined"){
		curDebounce = self.config[String(identifier)].gpio_debounce
	}

	self.gpio[String(dataPin)] = new Gpio(dataPin, "in", "both", {
		debounceTimeout: curDebounce
	});

	self.gpio[String(clockPin)] = new Gpio(clockPin, "in", "both", {
		debounceTimeout: curDebounce
	});

	(function (rotary_identifier, gpio_data, gpio_clock, dataPin, clockPin) {
		gpio_data.watch(function (err, value) {
			if (err) {
				console.log(err);
			}
			// console.log(
			// 	self.name + ": Watched pin: " + dataPin + " triggered with value "+value+"!"
			// );
			let clockPinValue = self.gpio[String(clockPin)].readSync()
			self.evaluateRotaryResults(rotary_identifier, dataPin, clockPin, value, clockPinValue, true)
		});

		gpio_clock.watch(function (err, value) {
			if (err) {
				console.log(err);
			}
			// console.log(
			// 	self.name + ": Watched pin: " + clockPin + " triggered with value "+value+"!"
			// );
			let dataPinValue = self.gpio[String(dataPin)].readSync()
			self.evaluateRotaryResults(rotary_identifier, dataPin, clockPin, dataPinValue, value, false)
		});
	})(String(identifier), self.gpio[String(dataPin)], self.gpio[String(clockPin)], dataPin, clockPin);
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this;
    if (notification === "CONFIG" && self.started === false) {
      self.config = payload;

      for (var curPin in self.config) {
        if (( typeof self.config[String(curPin)].gpio_state !== "undefined" ) ||
            ( typeof self.config[String(curPin)].notifications !== "undefined" )
        ){
          console.log(self.name + ": DEPRECATION WARNING: Your config of pin "+curPin+" uses the old, deprecated syntax for configuration. Please change to the new \"notification_low\" and \"notification_high\" arrays as the old syntax handling may be removed in future versions!")
        }
      }

      if (Gpio.accessible) {
        self.gpio = [];
        for (var curPinConfStr in self.config) {
			if (curPinConfStr.indexOf(",") == -1) {
				self.registerSinglePin(curPinConfStr)
			} else {
				let curPinConfArr = curPinConfStr.split(",")
				self.registerRotary(curPinConfStr, curPinConfArr[0], curPinConfArr[1])
			}
        }
      } else {
        console.log(
          self.name +
            ": Skipping Pin registration because GPIO is not acessible!"
        );
      }

      self.started = true;
    } else if (notification === "GPIO_SEND_NOTIFICATIONS") {
      if (payload.pins) {
        let curLength = payload.pins.length;
        for (let i = 0; i < curLength; i++) {
          self.sendNotificationsOfSinglePin(payload.pins[i]);
        }
      } else if (payload.rotaries){
		let curLength = payload.rotaries.length;
        for (let i = 0; i < curLength; i++) {
          self.sendNotificationsOfRotary(payload.rotaries[i][0], payload.rotaries[i][1]);
        }
	  } else {
        self.sendAllNotificationsOfSinglePins()
      }
    } else if (notification === "CHANGED_PROFILE") {
      if (typeof payload.to !== "undefined") {
        self.currentProfile = payload.to;
        self.currentProfilePattern = new RegExp("\\b" + payload.to + "\\b");
      }
    } else {
      console.log(this.name + ": Received Notification: " + notification);
    }
  }
});
