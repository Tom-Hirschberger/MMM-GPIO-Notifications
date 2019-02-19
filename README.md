# MMM-GPIO-Notifications
MMM-GPIO-Notifications is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

It watches the state of an configurable GPIO-Pin an sends configurable notifications (with optional payload) if the state of the pin changes to the configured value.

## Installation
cd ~/MagicMirror/modules
git clone 
cd MMM-GPIO-Notifications
npm install
```

## Configuration
To use the module insert it in the config.js file. Here is an example:
```
{
    module: 'MMM-GPIO-Notifications',
    "7":{
        gpio_state: 1,
        gpio_debounce: 100,
        notifications: [
            {
                "notification": "SCREEN_ON",
                "payload":{"forced":false},
            },
            {
                "notification": "USER_PRESENCE",
                "payload":{},
            },
        ],
    },
    "21":{
        gpio_state: 1,
        gpio_debounce: 0,
        notifications: [
            {
                "notification": "SCREEN_OFF",
                "payload":{"forced":false},
            },
        ],
    },
},
```

<br>

| Option  | Description | Type | Default |
| ------- | --- | --- | --- |
| THE_KEY | the number of the pin you want to watch. MAKE SURE TO ADD IT IN "" |
| gpio_state | the state of the gpio pin on which the notifications should be send |
| gpio_debounce | the debounce value to use for the gpio event handling; if the pin changes the state during this period after the last event the new event will be ignored |
| notifications | An array of natifications. Each notification needs a key "notification", the payload is optional |
