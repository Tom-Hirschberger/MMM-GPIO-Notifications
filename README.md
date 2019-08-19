# MMM-GPIO-Notifications
MMM-GPIO-Notifications is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

It watches the state of configurable GPIO-Pins and sends configurable notifications (with optional payload) if the state of the pins change to the configured value.

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
              notifications: [
                {
                  notification: 'USER_PRESENCE',
                  payload: { true }
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
                  'payload': { 'forced': true }
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
| notifications | An array of natifications. Each notification needs a key "notification", the payload is optional | Array |
