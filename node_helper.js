/* Magic Mirror
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
  },

  sendAllNotifications: function () {
	const self = this
	let curTimestamp = Date.now()
	console.log(self.name + ": Sending notifications of all pins...");
	for (curPin in self.config) {
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
				console.log(
				self.name +
					": Sending notification:"
				);
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
        for (var curPin in self.config) {
			self.registerSinglePin(curPin)
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
        var curLength = payload.pins.length;
        for (var i = 0; i < curLength; i++) {
          self.sendNotificationsOfSinglePin(payload.pins[i]);
        }
      } else {
        self.sendAllNotifications()
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
