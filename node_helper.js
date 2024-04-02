/* MagicMirror²
 * Module: GPIO-Notifications
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const OpenGPIO = require("opengpio")
let openGPIOChip = OpenGPIO.Default
const openGPIOEdge = OpenGPIO.Edge
const fs = require('fs')
const path = require('path')
const gpioInfoFile = path.join(__dirname, '/gpioinfo.json')

module.exports = NodeHelper.create({
  start: function () {
	const self = this
    self.started = false;
    self.currentProfile = "";
    self.currentProfilePattern = new RegExp(".*");
    self.lastMessuresLow = {}
    self.lastMessuresHigh = {}
	self.lastMessuresCW = {}
    self.lastMessuresCCW = {}
	self.lastActionsRotary = {}
	self.usingDefaultDevice = true
	self.registeredPins = {}
	self.namingSchema = "Default"

	if (fs.existsSync('/proc/device-tree/model')){
		let fullModelName = fs.readFileSync('/proc/device-tree/model').toString()
		if (fullModelName.startsWith("Raspberry Pi")){
			let piVersion = fullModelName.substring(12)
			piVersion = piVersion.replace("Model", "")
			piVersion = piVersion.substring(0, piVersion.indexOf("Rev")-1).replaceAll(" ","")
			piVersion = "RaspberryPi_"+piVersion
			openGPIOChip = OpenGPIO[piVersion]
			if (typeof openGPIOChip === "undefined"){
				console.log("Could not find any device information for "+piVersion+". Using information of gpioinfo.json!")
				openGPIOChip = OpenGPIO.Default
			} else {
				console.log("Using naming schema of "+piVersion+"!")
				self.namingSchema = piVersion
				self.usingDefaultDevice = false
			}
		} else {
			if (typeof OpenGPIO[fullModelName] !== "undefined"){
				openGPIOChip = OpenGPIO[fullModelName]
				self.namingSchema = fullModelName
			} else {
				openGPIOChip = OpenGPIO.Default
				console.log("Could not find any device information for model: "+fullModelName+". Using information of gpioinfo.json!")
			}
		}
	} else {
		openGPIOChip = OpenGPIO.Default
		console.log("Could not find any device information. Using information of gpioinfo.json!")
	}

	if (self.usingDefaultDevice){
		self.gpioinfo = JSON.parse(fs.readFileSync(gpioInfoFile))
	}
  },

  stop: function(){
	for(let curPin of self.registeredPins){
		console.log("Removing handler of pin: "+curPin)
		curPin.stop()
	}
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

  getGPIONameOfPin: function(curPin){
	const self = this
	let name = null
	if(typeof curPin === 'number'){
		name = "GPIO"+curPin
	} else {
		try {
			name = "GPIO"+parseInt(curPin)
		} catch {
			name = curPin
		}
	}
	return name
  },

  getGPIOChipAndLaneInfoOfPinName: function(curPinName){
	const self = this
	let info = null
	if (self.usingDefaultDevice){
		if (typeof self.gpioinfo["gpios"][curPinName] !== "undefined"){
			info = {chip: self.gpioinfo["gpios"][curPinName][0], lane: self.gpioinfo["gpios"][curPinName][1]}
		}
	} else {
		if (typeof openGPIOChip.bcm[curPinName] !== "undefined"){
			info = openGPIOChip.bcm[curPinName]
		}
	}

	return info
  },

  registerSinglePin: function(curPin) {
	const self = this
	console.log(self.name + ": Trying to registering pin: " + curPin)

	let pinName = self.getGPIONameOfPin(curPin)
	let curGPIOInfo = self.getGPIOChipAndLaneInfoOfPinName(pinName)

	if (curGPIOInfo != null){
		console.log(self.name + ": Using chip ("+curGPIOInfo.chip+") and line ("+curGPIOInfo.line+") info of " + pinName)
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

		try {
			let watch = openGPIOChip.watch(curGPIOInfo, openGPIOEdge.Both)
			self.registeredPins[curPin] = watch

			watch.on('event', (value) => {
				if (value){
					value = 1
				} else {
					value = 0
				}
				console.log(self.name + ": Watched pin: " + curPin + " triggered with value "+value+"!");
				self.sendNotificationsOfSinglePin(curPin, value);
			})
			console.log(self.name + ": Successfully registered pin: " + curPin)
		} catch {
			console.log(self.name + ": Unable to register pin: "+curPin+". Maybe it is already used by a other program!")
		}

	} else {
		console.log(self.name + ": Failed to register pin: " + curPin+" cause we could not find any information about the gpio chip and lane to use!")
	}
  },

  registerRotary: function (identifier, dataPin, clockPin) {
	const self = this
	console.log(self.name + ": Trying to registering rotary encoder: " + identifier + " with data pin "+dataPin+" and clock pin "+clockPin)

	let dataPinName = self.getGPIONameOfPin(dataPin)
	let clockPinName = self.getGPIONameOfPin(clockPin)

	let curGPIODataInfo = self.getGPIOChipAndLaneInfoOfPinName(dataPinName)
	let curGPIOClockInfo = self.getGPIOChipAndLaneInfoOfPinName(clockPinName)

	if ((curGPIODataInfo != null) && (curGPIOClockInfo != null)){
		console.log(self.name + ": Using chip ("+curGPIODataInfo.chip+") and line ("+curGPIODataInfo.line+") info of " + dataPinName+" as data pin.")
		console.log(self.name + ": Using chip ("+curGPIOClockInfo.chip+") and line ("+curGPIOClockInfo.line+") info of " + clockPinName+" as clock pin.")
		self.lastActionsRotary[identifier] = 0

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

		//based on https://arduinogetstarted.com/tutorials/arduino-rotary-encoder
		let dataGpio
		try {
			dataGpio = openGPIOChip.input(curGPIODataInfo)
			self.registeredPins[dataPin] = dataGpio
		} catch {
			dataGpio = null
		}
		if (dataGpio != null){
			try {
				let clockWatch = openGPIOChip.watch(curGPIOClockInfo, openGPIOEdge.Rising)
				self.registeredPins[clockPin] = clockWatch

				clockWatch.on('event', () => {
					let curTimestamp = Date.now()
					let curRotaryDelay = self.config[identifier].rotaryDelay || 5
					if (curTimestamp - self.lastActionsRotary[identifier] > curRotaryDelay){
						self.lastActionsRotary[identifier] = curTimestamp
						if (dataGpio.value == true){
							//data is High, knob got turned CCW by one
							self.sendNotificationsOfRotary(identifier, false)
						} else {
							//data is Low, knob got turned CW by one
							self.sendNotificationsOfRotary(identifier, true)
						}
					}
				})
				console.log(self.name + ": Successfully registered rotary encoder: " + identifier)
			} catch {
				console.log(self.name + ": Unable to register dataPin: "+clockPin+" of rotary encoder: " + identifier+". Maybe it is already used by a other program!")
			}
		} else {
			console.log(self.name + ": Unable to register dataPin: "+dataPin+" of rotary encoder: " + identifier+". Maybe it is already used by a other program!")
		}
	} else {
		if (curGPIODataInfo == null) {
			console.log(self.name + ": Failed to register pin: " + dataPin+" cause we could not find any information about the gpio chip and lane to use!")
		}

		if (curGPIOClockInfo == null) {
			console.log(self.name + ": Failed to register pin: " + clockPin+" cause we could not find any information about the gpio chip and lane to use!")
		}
	}
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this;
    if (notification === "CONFIG" && self.started === false) {
	  console.log(self.name + ": Using naming schema "+self.namingSchema)
      self.config = payload;

      for (var curPin in self.config) {
        if (( typeof self.config[String(curPin)].gpio_state !== "undefined" ) ||
            ( typeof self.config[String(curPin)].notifications !== "undefined" )
        ){
          console.log(self.name + ": DEPRECATION WARNING: Your config of pin "+curPin+" uses the old, deprecated syntax for configuration. Please change to the new \"notification_low\" and \"notification_high\" arrays as the old syntax handling may be removed in future versions!")
        }

		if (( typeof self.config[String(curPin)].gpio_debounce !== "undefined" )
        ){
          console.log(self.name + ": WARNING: Your config of pin "+curPin+" uses \"gpio_debounce\". This option has been removed with version 0.2.0 of the module and has no longer any effect. Checkout the delay options instead!")
        }
      }
		self.gpio = [];
		for (var curPinConfStr in self.config) {
			if (curPinConfStr.indexOf(",") == -1) {
				self.registerSinglePin(curPinConfStr)
			} else {
				let curPinConfArr = curPinConfStr.split(",")
				self.registerRotary(curPinConfStr, curPinConfArr[0], curPinConfArr[1])
			}
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
