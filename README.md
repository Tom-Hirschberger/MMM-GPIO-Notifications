# MMM-GPIO-Notifications

MMM-GPIO-Notifications is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

It watches the state of configurable GPIO-Pins and sends configurable notifications (with optional payload) if the state of the pins change to the configured value. If you configure a delay no notifcations will be send for the pin after a successful trigger for this time.
As a new feature you can now set profiles for each notifcation. Because of this you can use the same sensor for different actions in different profiles (i.e. different pages).

As of version 0.1.0 of the module it is possible to use rotary encoders, too. Instead of one pin, two pins get configured (one data and one clock pin) which work together.

**I wrote an [english](https://www.github.com/Tom-Hirschberger/MMM-GPIO-Notifications/tree/master/examples%2FHC-SR501%2FHC-SR501-GPIO4-README-EN.md) and an [german](https://www.github.com/Tom-Hirschberger/MMM-GPIO-Notifications/tree/master/examples%2FHC-SR501%2FHC-SR501-GPIO4-README-DE.md) tutorial on howto connect an HC-SR501 PIR sensor and use this module in combination with [MMM-Screen-Powersave-Notifications](https://github.com/Tom-Hirschberger/MMM-Screen-Powersave-Notification) to implement an auto-on/auto-off for the screen**

## Installation

Hint: The postinstallation will take some time. Please wait for it to finish!
Hint: If you use the module in a container (i.e. docker) setup please skip this steps and make sure to look to the next section and then run these steps if the preconditions are met.

```bash
    cd ~/MagicMirror/modules
    git clone https://github.com/Tom-Hirschberger/MMM-GPIO-Notifications.git
    cd MMM-GPIO-Notifications
    npm install
```

## Setup in a container

If you want to use the module within a container it will need some preperation.
First make sure `python3` is available in the container. It is needed only during the installation (`npm install`) of the module but not during runtime.

If you use the container image of `karsten13` you need to switch from the `latest` tag to the `fat`.

If you use `docker-compose` you will find a line:

```yaml
image: karsten13/magicmirror:latest
```

in the `docker-compose.yml" file. Please change it to:

```yaml
image: karsten13/magicmirror:fat
```

Next you will need to make sure that you map `/sys` inside the container.

If you started the container without `docker-compose` simply add the following option to the command `docker run` command:

```bash
-v /sys:/sys
```

It then will look something like:

```bash
docker run -it --rm --name mymirror \
 -v ${HOME}/mm/modules:/opt/magic_mirror/modules \
 -v ${HOME}/mm/config:/opt/magic_mirror/config \
 -v ${HOME}/mm/css:/opt/magic_mirror/css \
 -v /sys:/sys \
 -p 8080:8080 \
 karsten13/magicmirror:fat npm run server
```

In case you use `docker-compose` to start your mirror you need to add a addtional volume to the `docker-compose.yml`.
It then will look something like:

```yaml
version: '3'

services:
  magicmirror:
    container_name: mm
    image: karsten13/magicmirror:latest
    ports:
      - "8080:8080"
    volumes:
      - ../mounts/config:/opt/magic_mirror/config
      - ../mounts/modules:/opt/magic_mirror/modules
      - ../mounts/css:/opt/magic_mirror/css
      - /sys:/sys
    restart: unless-stopped
    command:
      - npm
      - run
      - server

```

## Configuration

As of version 0.1.0 of the module rotary encoders can be used. The configuration is slightly different between single pins and the one for rotary encoders. Cause of this i will provide two examples in two sections of this readme.

### Single GPIO pin

To use the module insert it in the config.js file. Here is an example:

```json5
    {
        module: 'MMM-GPIO-Notifications',
        config: {
            '17': {
              gpio_debounce: 10,
              delay: 1000,
              notifications_high: [
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
              gpio_debounce: 20,
              notifications_high: [
                {
                  notification: 'SCREEN_TOGGLE',
                  payload: { 'forced': true },
                  profiles: 'pageOneEveryone pageTwoEveryone'
                }
              ]
            }
        }
    },
```

There are two buttons configured in this example.
As of version 0.0.8 of the module it is possible to send specific notifications for both states of the the pin. Instead of specifying `gpio_state` and `notifications` the two arrays `notifications_low` and `notifications_high` are used. In the example above both gpio pins cause notifications being send if high state is triggered.

As of version 0.0.9 of the module the old syntax using `gpio_state` and `notifications` is depcreated. Use `notifications_low` and `notifications_high` instead!

As of version 0.0.9 of the module it is possible to configure different delays depending on the state with the options `delay_high` and `delay_low`. If only `delay` is configured it will be used for both the high and the low state.

| Option        | Description                                                                                                                                               | Type    | Default |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| THE_KEY       | the number of the pin you want to watch. MAKE SURE TO ADD IT IN ''                                                                                        | String  |         |
| gpio_state    | DEPRECATED! The state of the gpio pin on which the notifications should be send. Use `notification_low` and `notifications_high` instead.                                                                                       | Integer |         |
| gpio_debounce | the debounce value to use for the gpio event handling; if the pin changes the state during this period after the last event the new event will be ignored. Look in the section `Debounce vs. Delay` for more information. | Integer |    0 as of version 0.0.9     |
| delay         | time in milliseconds till the notifications will be send again altough the pin has been triggered.  Look in the section `Debounce vs. Delay` for more information. | Integer | 0 |
| delay_low         | time in milliseconds till the notifications of the low state will be send again after it got triggered. Look in the section `Debounce vs. Delay` for more information.| Integer | the value of `delay` |
| delay_high         | time in milliseconds till the notifications of the high state will be send again after it got triggered. Look in the section `Debounce vs. Delay` for more information.| Integer | the value of `delay` |
| notifications | DEPRECATED! An array of natifications. Each notification needs a key "notification", the payload is optional. Also a optional profile string can be set. Use `notification_low` and `notifications_high` instead. | Array |
| notifications_low | Instead of the use of `gpio_state` this array of notifications can be used to send specific notifications if the low state of the pin is triggered. | Array |
| notifications_high | Instead of the use of `gpio_state` this array of notifications can be used to send specific notifications if the high state of the pin is triggered. | Array |

### Rotary encoder

```json5
    {
        module: 'MMM-GPIO-Notifications',
        config: {
          '13': {
              gpio_debounce: 500,
              notifications_high: [
                {
                  notification: 'SCREEN_TOGGLE',
                  payload: { 'forced': true }
                }
              ]
          },
          '6,5': {
            gpio_debounce: 0,
            delay_cw: 1000,
            delay_ccw: 2000,
            rotary_delay: 5,
            notifications_cw: [
              {
                notification: 'PROFILE_INCREMENT_HORIZONTAL',
                payload: true,
              },
              {
                notification: 'TEST',
                payload: false,
                profiles: "pageC"
              }
            ],
            notifications_ccw: [
              {
                notification: 'PROFILE_DECREMENT_HORIZONTAL',
                payload: true,
              }
            ],
          },
        }
    },
```

In this example a rotary encoder with the following options is configured:

* the switch pin of my rotary encoder is GPIO 13
* a small debounce value `gpio_debounce` of `500` milliseconds is set for my rotary switch GPIO
* if the rotary encoder gets pressed my screen gets toggled by notification "SCREEN_TOGGLE"
* the data pin of the rotary encoder is GPIO 6
* the clock pin of the rotary encoder is GPIO 5
* we do not need a gpio debounce so it is set to 0
* notifications for clockwise direction will be send only after a delay of one second (1000ms)
* notifications for counterclockwise direction will be send only after a delay of two second (2000ms)
* my rotary encoder sometimes sends results twice within a short time when it is turned. So i set a small amount of 5 milliseconds as delay between two events
* if the rotary is turned clockwise two notifications are send: "PROFILE_INCREMENT_HORIZONTAL" and "TEST". But "TEST" is only send on my center profile "pageC"
* if the rotary is turned counterclockwise the notification "PROFILE_DECREMENT_HORIZONTAL" is send

| Option        | Description                                                                                                                                               | Type    | Default |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| THE_KEY       | the number of the pin you want to watch. MAKE SURE TO ADD IT IN ''                                                                                        | String  |         |
| gpio_debounce | the debounce value to use for the gpio event handling; if the pin changes the state during this period after the last event the new event will be ignored. Look in the section `Debounce vs. Delay` for more information. | Integer |    0 as of version 0.0.9     |
| delay         | time in milliseconds till the notifications will be send again altough the rotary has been turned (either clockwise or counterclockwise).  Look in the section `Debounce vs. Delay` for more information. | Integer | 0 |
| delay_cw         | time in milliseconds till the notifications of the rotary will be send again after it got turned clockwise. Look in the section `Debounce vs. Delay` for more information.| Integer | the value of `delay` |
| delay_ccw         | time in milliseconds till the notifications of the rotary will be send again after it got turned counterclockwise. Look in the section `Debounce vs. Delay` for more information.| Integer | the value of `delay` |
| notifications_cw | A array of notifications that should be send if the rotary has been turned clockwise. | Array |
| notifications_ccw | A array of notifications that should be send if the rotary has been turned counterclockwise. | Array |

### Debounce vs. Delay

This section tries to describe the difference between the `gpio_debounce` and the different delay options `delay`, `delay_low` and `delay_high`.

So first of all why do we need debounce in some cases...
Let us assume you have connected a button connected to a GPIO pin and want to do some action every time the button gets pressed and the GPIO changes to high state. Usually buttons do not provide debounce machanism by there self. Cause of the mechanics in the button our cause the fingers are shaking a little bit it can happen that the state changes from low to high, from high to low and back again to high within milliseconds of time. If no debounce mechanism is implemented the module will fire the actions for every of this changes. But WE know that if the user pressed the button he/she usally does not do that again with in the next seconds. So we can provide a debounce time within we ignore further input after the last one.
As this is a common problem the low-level GPIO libraries already provide such a machanism. You can simple set a debounce time and all input during this pirod will be ignored. As this already happens in the operating system it does save a lot of processing power.
But as the module does not get informored during the debounce time that an state change happend i can not provide any debug output about it as i simple do not recognize it.
The other thing is that this mechanism is usally to set debounce intervals in the amount of a maximum of a few seconds. Thats way i introduced the `delay` option some time ago.

**The main difference between the `gpio_debounce` and the `delay`, `delay_low` and `delay_high` is that the delay options are handled by the module itself and cost more cpu power!**

The advantage of the delay options are that we can log if we suppress output and we can configure a different delay depending on the GPIOs state.

Let's look at a example with the following configuration:

```json5
    {
        module: 'MMM-GPIO-Notifications',
        config: {
            '4': {
              delay_high: 10000,
              delay_low: 30000,
              notifications_high: [
                {
                  notification: 'USER_PRESENCE',
                  payload: true,
                }
              ],
              notifications_low: [
                {
                  notification: 'USER_PRESENCE',
                  payload: false,
                }
              ]
            },
            '17': {
              gpio_debounce: 1000,
              notifications_high: [
                {
                  notification: 'TOGGLE_LED',
                }
              ]
            }
        }
    },
```

We have the following goals in this example:

* There is connected a radar sensor (RCWL-0516) sensor to GPIO 4 which is a kind of movement detector like PIR but is much faster and can detect movement through class and wood. If the sensor gets triggered and the GPIO changes to high state we want a `USER_PRESENCE` notification send with payload `true`.
* If the sensor on GPIO 4 does not recognize any further movement and the state of the pin changes back to low state we want a `USER_PRESENCE` notification being send with payload `false`.
* As the sensor is very fast and changes the state every 2 seconds we set a delay of the high state with the `delay_high` option of `10000` milliseconds which are 10 seconds. So only every 10 seconds a notification will be send. As our screensave module has a delay of 30 seconds configured we are totally fine with that and do not need to flush the mirror with notifications.
* As we use the `USER_PRESENCE` notification with payload `false` only for some external systems like HomeAssistent or NodeRed which do need to know after the user finally leaves we configure a `delay_low` of `30000` and suppress all notifications within the 30 seconds.
* Additionally there is a button connected to GPIO 17. Everytime the button is pressed we want a module that controls a led strip to toggle the state of the strip. We baught a cheap button which does not have any debounce machnism in it. Cause it fires random state changes after we pressed it for about a second we set a `gpio_debounce` of `1000` milliseconds wich is 1 second.

To sum things up:
If you want to set a small delay where state changes should be ignored after a state change and you do not care of different delays depending on the state use the `gpio_debounce`. This saves some performance for other things with the cost that you will not see the ignored events in the log file.
If you want to be more flexible, you want to set a different delays for the high or low state and you want to see ignored events in the log file use the `delay`, `delay_low` and `delay_high` option. It will cost some performance but it is not that much.
