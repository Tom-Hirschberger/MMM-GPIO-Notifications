/* Magic Mirror
 * Module: GPIO-Notifications
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */

const NodeHelper = require('node_helper')
const Gpio = require('onoff').Gpio

module.exports = NodeHelper.create({

  start: function () {
    this.started = false
  },

  sendAllNotifications: function (curPin) {
    const self = this
    if (curPin) {
      console.log(self.name + ': Sending notifications of pin ' + curPin + '...')
      if (self.config[String(curPin)]) {
        var curNotifications = self.config[String(curPin)].notifications
        var curLength = curNotifications.length
        for (var i = 0; i < curLength; i++) {
          var curNotification = curNotifications[i]
          self.sendSocketNotification(curNotification.notification, curNotification.payload)
        }
      }
    } else {
      console.log(self.name + ': Sending notifications of all pins...')
      for (curPin in self.config) {
        console.log(self.name + ': Sending notifications of pin ' + curPin + '...')
        curNotifications = self.config[String(curPin)].notifications
        curLength = curNotifications.length
        for (i = 0; i < curLength; i++) {
          curNotification = curNotifications[i]
          self.sendSocketNotification(curNotification.notification, curNotification.payload)
        }
      }
    }
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this
    if (notification === 'CONFIG' && self.started === false) {
      self.config = payload

      if (Gpio.accessible) {
        self.gpio = []
        for (var curPin in self.config) {
          console.log(self.name + ': Registering pin: ' + curPin)
          self.gpio[String(curPin)] = new Gpio(curPin, 'in', 'both', { debounceTimeout: self.config[String(curPin)].gpio_debounce });

          (function (gpiox, theCurPin) {
            gpiox.watch(function (err, value) {
              if (err) {
                console.log(err)
              }
              if (value === self.config[String(theCurPin)].gpio_state) {
                console.log(self.name + ': Watched pin: ' + theCurPin + ' triggered!')
                self.sendAllNotifications(theCurPin)
              }
            })
          })(self.gpio[String(curPin)], curPin)
        }
      } else {
        console.log(self.name + ': Skipping Pin registration because GPIO is not acessible!')
      }

      self.started = true
    } else if (notification === 'GPIO_SEND_NOTIFICATIONS') {
      if (payload.pins) {
        var curLength = payload.pins.length
        for (var i = 0; i < curLength; i++) {
          self.sendAllNotifications(payload.pins[i])
        }
      } else {
        self.sendAllNotifications()
      }
    } else {
      console.log(this.name + ': Received Notification: ' + notification)
    }
  }
})
