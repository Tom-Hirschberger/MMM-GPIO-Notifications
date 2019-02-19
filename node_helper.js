/* Magic Mirror
 * Module: GPIO-Notifications
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */

const Gpio = require('onoff').Gpio;

module.exports = NodeHelper.create({

    start: function () {
        this.started = false;
    },

    sendAllNotifications: function(cur_pin) {
        const self = this;
        if (cur_pin){
            console.log(self.name+": Sending notifications of pin "+cur_pin+"...");
            cur_notifications = self.config[String(cur_pin)].notifications;
            cur_length = cur_notifications.length;
            for (i = 0; i < cur_length; i++) {
                cur_notification = cur_notifications[i];
                self.sendSocketNotification(cur_notification.notification,cur_notification.payload);
            }
        } else {
            console.log(self.name+": Sending notifications of all pins...")
            for(cur_pin in self.config){
                console.log(self.name+": Sending notifications of pin "+cur_pin+"...");
                cur_notifications = self.config[String(cur_pin)].notifications;
                cur_length = cur_notifications.length;
                for (i = 0; i < cur_length; i++) {
                    cur_notification = cur_notifications[i];
                    self.sendSocketNotification(cur_notification.notification,cur_notification.payload);
                }
            }
        }
    },

    socketNotificationReceived: function (notification, payload) {
        const self = this;
        if (notification === 'CONFIG' && self.started == false) {
            self.config = payload;

            self.gpio = [];
            for (cur_pin in self.config){
                console.log(self.name+": Registering pin: "+cur_pin);
                self.gpio[String(cur_pin)] = new Gpio(cur_pin, 'in', 'both', {debounceTimeout: self.config[String(cur_pin)].gpio_debounce});

                self.gpio[String(cur_pin)].watch(function (err, value, watched_pin=cur_pin) {
                    if (value == self.config[String(watched_pin)].gpio_state) {
                        console.log(self.name+": Watched pin: "+watched_pin+ " triggered!");
                        self.sendAllNotifications(watched_pin);
                    }
                });
            }

            self.started = true;
        } else if (notification.startsWith('GPIO_SEND_NOTIFICATIONS_')){
            this.sendAllNotifications(notification.replace('GPIO_SEND_NOTIFICATIONS_',"")); 
        } else if (notification === 'GPIO_SEND_NOTIFICATIONS'){
            this.sendAllNotifications();
        } else {
            console.log(this.name+": Received Notification: "+notification);
        }
    },
});