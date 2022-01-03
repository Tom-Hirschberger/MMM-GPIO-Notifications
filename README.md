# MMM-GPIO-Notifications
MMM-GPIO-Notifications is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

:warning: elecron-rebuild issues: Currently i am unable to run the module with node versions > 14. I could not find the exact cause yet but for my only downgrading node from 16 to 14.18.2 (sudo npm install -g n; sudo n 14.18.2) fixed the issue.

It watches the state of configurable GPIO-Pins and sends configurable notifications (with optional payload) if the state of the pins change to the configured value. If you configure a delay no notifcations will be send for the pin after a sucessful trigger for this time.
As a new feature you can now set profiles for each notifcation. Because of this you can use the same sensor for different actions in different profiles (i.e. different pages).

**I wrote an [english](https://www.github.com/Tom-Hirschberger/MMM-GPIO-Notifications/tree/master/examples%2FHC-SR501%2FHC-SR501-GPIO4-README-EN.md) and an [german](https://www.github.com/Tom-Hirschberger/MMM-GPIO-Notifications/tree/master/examples%2FHC-SR501%2FHC-SR501-GPIO4-README-DE.md) tutorial on howto connect an HC-SR501 PIR sensor and use this module in combination with [MMM-Screen-Powersave-Notifications](https://github.com/Tom-Hirschberger/MMM-Screen-Powersave-Notification) to implement an auto-on/auto-off for the screen**

## Installation
    cd ~/MagicMirror/modules
    git clone https://github.com/Tom-Hirschberger/MMM-GPIO-Notifications.git
    cd MMM-GPIO-Notifications
    npm install


## Configuration
To use the module insert it in the config.js file. Here is an example:

    {
        module: 'MMM-GPIO-Notifications',
        config: {
            '17': {
              gpio_state: 1,
              gpio_debounce: 10,
              delay: 1000,
              notifications: [
                {
                  notification: 'USER_PRESENCE',
                  payload: true
                },
                {
                  notification: 'SCREEN_ON',
                  payload: { 'forced': false }
                }
              ]
            },
            '4': {
              gpio_state: 1,
              gpio_debounce: 20,
              notifications: [
                {
                  'notification': 'SCREEN_TOGGLE',
                  'payload': { 'forced': true },
                  'profiles': 'pageOneEveryone pageTwoEveryone'
                }
              ]
            }
        }
    },


| Option  | Description | Type | Default |
| ------- | --- | --- | --- |
| THE_KEY | the number of the pin you want to watch. MAKE SURE TO ADD IT IN '' | String | |
| gpio_state | the state of the gpio pin on which the notifications should be send | Integer | |
| gpio_debounce | the debounce value to use for the gpio event handling; if the pin changes the state during this period after the last event the new event will be ignored | Integer | |
| delay | time in milliseconds till the notifications will be send again altough the pin has been triggered | Integer | 0 |
| notifications | An array of natifications. Each notification needs a key "notification", the payload is optional. Also a optional profile string can be set | Array |
