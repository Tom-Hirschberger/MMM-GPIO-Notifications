# MMM-GPIO-Notifications

MMM-GPIO-Notifications is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project by [Michael Teeuw](https://github.com/MichMich).

It watches the state of configurable GPIO-Pins and sends configurable notifications (with optional payload) if the state of the pins change to the configured value. If you configure a delay no notifcations will be send for the pin after a successful trigger for this time.
As a new feature you can now set profiles for each notifcation. Because of this you can use the same sensor for different actions in different profiles (i.e. different pages).

As of version 0.1.0 of the module it is possible to use rotary encoders, too. Instead of one pin, two pins get configured (one data and one clock pin) which work together.

As with version 0.2.0 of the module i need to change to a different library and so the `gpio_debounce` option is no longer support. Use the delay options instead!

**I wrote an [english](https://www.github.com/Tom-Hirschberger/MMM-GPIO-Notifications/tree/master/examples%2FHC-SR501%2FHC-SR501-GPIO4-README-EN.md) and an [german](https://www.github.com/Tom-Hirschberger/MMM-GPIO-Notifications/tree/master/examples%2FHC-SR501%2FHC-SR501-GPIO4-README-DE.md) tutorial on howto connect an HC-SR501 PIR sensor and use this module in combination with [MMM-Screen-Powersave-Notifications](https://github.com/Tom-Hirschberger/MMM-Screen-Powersave-Notification) to implement an auto-on/auto-off for the screen**

## Installation

Hint: The postinstallation will take some time. Please wait for it to finish!
Hint: If you use the module in a container (i.e. docker) setup please skip this steps and make sure to look to the next section and then run these steps if the preconditions are met.

```bash
    cd ~/MagicMirror/modules
    git clone https://github.com/Tom-Hirschberger/MMM-GPIO-Notifications.git
    cd MMM-GPIO-Notifications
    ./preinstall
    npm install
```

## Setup in a container

As of version 0.2.0 of the module you will need a container image which contains the "lipgpiod-dev" and "gpiod" package. The installation will fail if they are not present!

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

Next you will need to make sure that you map `/dev` inside the container and run the container in privileged mode.

If you started the container without `docker-compose` simply add the following options to the command `docker run` command:

```bash
-v /dev:/dev --privileged
```

It then will look something like:

```bash
docker run --privileged -it --rm --name mymirror \
 -v ${HOME}/mm/modules:/opt/magic_mirror/modules \
 -v ${HOME}/mm/config:/opt/magic_mirror/config \
 -v ${HOME}/mm/css:/opt/magic_mirror/css \
 -v /dev:/dev \
 -p 8080:8080 \
 karsten13/magicmirror:fat npm run server
```

In case you use `docker-compose` to start your mirror you need to add a additional volume and the privileged option to the `docker-compose.yml`.
It then will look something like:

```yaml
version: '3'

services:
  magicmirror:
    container_name: mm
    privileged: true
    image: karsten13/magicmirror:latest
    ports:
      - "8080:8080"
    volumes:
      - ../mounts/config:/opt/magic_mirror/config
      - ../mounts/modules:/opt/magic_mirror/modules
      - ../mounts/css:/opt/magic_mirror/css
      - /dev:/dev
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
              delay: 20,
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
| delay         | time in milliseconds till the notifications will be send again altough the pin has been triggered. | Integer | 0 |
| delay_low         | time in milliseconds till the notifications of the low state will be send again after it got triggered. | Integer | the value of `delay` |
| delay_high         | time in milliseconds till the notifications of the high state will be send again after it got triggered. | Integer | the value of `delay` |
| notifications | DEPRECATED! An array of natifications. Each notification needs a key "notification", the payload is optional. Also a optional profile string can be set. Use `notification_low` and `notifications_high` instead. | Array |
| notifications_low | Instead of the use of `gpio_state` this array of notifications can be used to send specific notifications if the low state of the pin is triggered. | Array |
| notifications_high | Instead of the use of `gpio_state` this array of notifications can be used to send specific notifications if the high state of the pin is triggered. | Array |

### Rotary encoder

```json5
    {
        module: 'MMM-GPIO-Notifications',
        config: {
          '13': {
              delay: 500,
              notifications_high: [
                {
                  notification: 'SCREEN_TOGGLE',
                  payload: { 'forced': true }
                }
              ]
          },
          '6,5': {
            delay_cw: 100,
            delay_ccw: 200,
            rotary_delay: 5,
            notifications_ccw: [
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
            notifications_cw: [
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
* if the rotary encoder gets pressed my screen gets toggled by notification "SCREEN_TOGGLE"
* the data pin of the rotary encoder is GPIO 6
* the clock pin of the rotary encoder is GPIO 5
* notifications for clockwise direction will be send only after a delay of 100 milliseconds
* notifications for counterclockwise direction will be send only after a delay of 200 milliseconds
* my rotary encoder sometimes sends results twice within a short time when it is turned. So i set a small amount of 5 milliseconds as delay between two events
* if the rotary is turned counterclockwise two notifications are send: "PROFILE_INCREMENT_HORIZONTAL" and "TEST". But "TEST" is only send on my center profile "pageC"
* if the rotary is turned clockwise the notification "PROFILE_DECREMENT_HORIZONTAL" is send

| Option        | Description                                                                                                                                               | Type    | Default |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| THE_KEY       | the number of the pin you want to watch. MAKE SURE TO ADD IT IN ''                                                                                        | String  |         |
| delay         | time in milliseconds till the notifications will be send again altough the rotary has been turned (either clockwise or counterclockwise). | Integer | 0 |
| delay_cw         | time in milliseconds till the notifications of the rotary will be send again after it got turned clockwise. | Integer | the value of `delay` |
| delay_ccw         | time in milliseconds till the notifications of the rotary will be send again after it got turned counterclockwise. | Integer | the value of `delay` |
| notifications_cw | A array of notifications that should be send if the rotary has been turned clockwise. | Array |
| notifications_ccw | A array of notifications that should be send if the rotary has been turned counterclockwise. | Array |
