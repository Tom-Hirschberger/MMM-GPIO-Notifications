/* global Module

/* Magic Mirror
 * Module: GPIO-Notifications
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
Module.register("MMM-GPIO-Notifications", {

    defaults: {
    },

    start: function () {
        console.error(this.name + ' is started');
        this.sendSocketNotification("CONFIG", this.config);
    },

    socketNotificationReceived: function(notification, payload) {
        this.sendNotification(notification, payload);
    },

    notificationReceived: function (notification, payload) {
        if (notification.startsWith("GPIO_SEND_NOTIFICATIONS")){
            this.sendSocketNotification(notification,payload);     
        }
    },
});