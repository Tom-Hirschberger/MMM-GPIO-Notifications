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
  },

  sendAllNotifications: function (curPin, curValue) {
    const self = this;
    const curTimestamp = Date.now();
    if (curPin) {
      if (
        curTimestamp - self.lastMessures[String(curPin)] >
        self.config[String(curPin)].delay
      ) {

        let toSendNotifications = []
        if ((typeof self.config[String(curPin)].gpio_state !== "undefined") &&
          (curValue === self.config[String(curPin)].gpio_state)
        ){
          toSendNotifications = toSendNotifications.concat(self.config[String(curPin)].notifications)
        }
        
        if ((typeof self.config[String(curPin)].notifications_low !== "undefined") &&
        (curValue == 0)
        ){
          toSendNotifications = toSendNotifications.concat(self.config[String(curPin)].notifications_low)
        }
        
        if ((typeof self.config[String(curPin)].notifications_high !== "undefined") &&
        (curValue == 1)
        ){
          toSendNotifications = toSendNotifications.concat(self.config[String(curPin)].notifications_high)
        }

        let curLength = toSendNotifications.length
        console.log("Length of toSendNotifications: "+curLength)

        if (curLength > 0) {
          console.log(
            self.name + ": Sending notifications of pin " + curPin + "..."
          );
          self.lastMessures[String(curPin)] = curTimestamp;
          for (var i = 0; i < curLength; i++) {
            var curNotification = toSendNotifications[i];
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
              console.log(JSON.stringify(curNotification))
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
    } else {
      console.log(self.name + ": Sending notifications of all pins...");
      for (curPin in self.config) {
        if (
          curTimestamp - self.lastMessures[String(curPin)] >
          self.config[String(curPin)].delay
        ) {
          console.log(
            self.name + ": Sending notifications of pin " + curPin + "..."
          );
          self.lastMessures[String(curPin)] = curTimestamp;
          let curNotifications = []
          if (typeof self.config[String(curPin)].notifications !== "undefined"){
            curNotification = curNotification.concat(self.config[String(curPin)].notifications)
          }

          if (typeof self.config[String(curPin)].notifications_low !== "undefined"){
            curNotification = curNotification.concat(self.config[String(curPin)].notifications_low)
          }

          if (typeof self.config[String(curPin)].notifications_high !== "undefined"){
            curNotification = curNotification.concat(self.config[String(curPin)].notifications_high)
          }
          curLength = curNotifications.length;
          for (i = 0; i < curLength; i++) {
            curNotification = curNotifications[i];
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

  socketNotificationReceived: function (notification, payload) {
    const self = this;
    if (notification === "CONFIG" && self.started === false) {
      self.config = payload;
      self.lastMessures = [];

      if (Gpio.accessible) {
        self.gpio = [];
        for (var curPin in self.config) {
          console.log(self.name + ": Registering pin: " + curPin);
          self.gpio[String(curPin)] = new Gpio(curPin, "in", "both", {
            debounceTimeout: self.config[String(curPin)].gpio_debounce
          });
          self.lastMessures[String(curPin)] = -1;
          if (typeof self.config[String(curPin)].delay === "undefined") {
            console.log(
              self.name +
                ": Setting delay of pin " +
                curPin +
                " to default value 0!"
            );
            self.config[String(curPin)].delay = 0;
          }

          (function (gpiox, theCurPin) {
            gpiox.watch(function (err, value) {
              if (err) {
                console.log(err);
              }
              console.log(
                self.name + ": Watched pin: " + curPin + " triggered with value "+value+"!"
              );
              self.sendAllNotifications(theCurPin, value);
            });
          })(self.gpio[String(curPin)], curPin);
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
          self.sendAllNotifications(payload.pins[i]);
        }
      } else {
        self.sendAllNotifications();
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
