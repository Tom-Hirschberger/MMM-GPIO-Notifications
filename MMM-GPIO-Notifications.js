/* global Module

/* Magic Mirror
 * Module: GPIO-Notifications
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
Module.register("MMM-GPIO-Notifications", {
  defaults: {},

  start: function () {
    Log.info("Starting module: " + this.name);
    this.sendSocketNotification("CONFIG", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    this.sendNotification(notification, payload);
  },

  notificationReceived: function (notification, payload) {
    if (
      notification === "GPIO_SEND_NOTIFICATIONS" ||
      notification === "CHANGED_PROFILE"
    ) {
      this.sendSocketNotification(notification, payload);
    }
  }
});
