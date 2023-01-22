# HC-SR501 at GPIO4

This example uses an PIR HC-SR501 sensor to recognize movement. If an event happens a notification should be send.

Modules in MagicMirror² use notifications to communicate with each other.

This tutorial uses not only [this module](https://github.com/Tom-Hirschberger/MMM-GPIO-Notifications) but also the [MMM-Screen-Powersave-Notification](https://github.com/Tom-Hirschberger/MMM-Screen-Powersave-Notification) module which uses the received notification to turn the display on and reset the display timeout.
Optionally a third module MMM-ViewNotifications (<https://github.com/glitch452/MMM-ViewNotifications>) can be installed to visualize the notifications send.

**ATTENTION: The numbers of the GPIOs differ to the pin numbers on the Raspberry Pi. In example GPIO4 uses pin 7 on the Raspberry Pi 3 board. This modules uses the GPIO and not the pin number!**

I suggest to perform the installation via ssh because in later steps the display maybe turned off.

## Perperation

To get this tutorial going the "git" command needs to be installed on the system. If you used the original MagicMirror² installation script the command should exist. if not you can use the following commands to install git.

```bash
sudo apt-get update
sudo apt-get install git
```

### HC-SR501

The sensor not only needs to be connected but also be configured before.
Normally HC-SR501 sensors do have two potentiometers and one jumper.
First we check the jumper which configures if there should be period of signals while objects are in the sensor area or if only one signal should be produced if someone/something enters the area (which is the mode we want to use). Normally the mode we want to use is configured by connecting the two pins closer to the mid of the sensor.

The potentiometer which is closer to the mid of the sensor controls the sensivity and can be configured as you like. The second one controls the hold time and should be turned to the most anti clockwise position.

### Wireing

The sensor can be used with voltages between 5V and 20V (sometimes only 12V). We need to connect the VCC, GND and the signal (trigger).

In the following picture VCC is connected to pin 2, GND to 6 and trigger to 7.
Be sure to connect pin 2 to VCC and pin 6 to GND. The figure is only an example and at some sensors the pins are switched. Swapping the pins may damage the sensor.

![alt text](HC-SR501-GPIO4.jpg "HC-SR501-GPIO4.jpg")

## Installing the modules

### MMM-GPIO-Notifications

Only users which are in the "gpio" group are allowed to access the gpio pins. This can be checked on the command line with the "groups" command.

```bash
groups
```

The output should look like the following and should contain "gpio":

```bash
pi adm dialout cdrom sudo audio video plugdev games users input netdev gpio i2c spi
```

If "gpio" is not in the list the "pi" user can be added to the group with the following command. After adding the user to the group the Raspberry Pi should be rebooted.

```bash
sudo usermod -a -G gpio pi
```

After this preperation steps the module can be installed. If you installed MagicMirror with the original installation script to the default folder you can directly copy and run the commands. The installation may take a moment und there will be shown some warinings which can be ignored.

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Tom-Hirschberger/MMM-GPIO-Notifications.git
cd MMM-GPIO-Notifications
npm install
```

### MMM-Screen-Powersave-Notification

Like at the previous module the commands can be copied and run directly if MagicMirror has been installed to the default folder.

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Tom-Hirschberger/MMM-Screen-Powersave-Notification.git
cd MMM-Screen-Powersave-Notification
npm install
```

If you are not sure if your display supports to be turned to standby and back on with HDMI you can check this with the following commands. The display should be turned off and back on after 20 seconds. I recommand to run the commands over ssh because as written the display should be turned off :-)

```bash
/usr/bin/vcgencmd display_power 0; echo "Display should now be off"; sleep 20; /usr/bin/vcgencmd display_power 1; echo "And now it should be on again"
```

```bash
display_power=0
Display should now be off
display_power=1
And now it should be on again
```

If this did not work it is possible to run custom scripts instead of this commands. Check the module documentation for details.

### (MMM-ViewNotifications)

Like mentioned before the installation of this module is optional but i recommand it to check the correct function of the new modules.
As already known the commands can be configured and run directly.

```bash
cd ~/MagicMirror/modules
git clone https://github.com/glitch452/MMM-ViewNotifications.git
```

## Configure the modules

The three (two) new modules need to be configured as the original modules of MagicMirror² in the file "~/MagicMirror/config/config.js". You can use a text editor of your choice (vi, nano, etc.).

### MMM-GPIO-Notifications

The goal of this tutorial is to send a "SCREEN_ON" notification each time the PIR sensor triggers GPIO4 (HIGH level). The payload of the notification will be set to "'forced': false" because the MMM-Screen-Powersave-Notification supports turning the screen off (with other sensors) by force and ignore SCREEN_ON notifications. We use a "gpio_debounce" value of 0 for this type of sensor. Debouncing is more relevant for other types of sensors (like buttons).
My PIR sensor triggers every 5 seconds. I do not want to send a notification that often. Thats why i configured a "delay" of 10000 milliseconds. This option has be introduced with version 0.0.2 (2020-03-28) of this module. Make sure to run the latest version.

```json5
    { 
        module: 'MMM-GPIO-Notifications',
        config: {
            '4': {
                gpio_debounce: 0,
                delay: 10000,
                notifications_high: [
                    { 
                        notification: 'SCREEN_ON', 
                        payload: { 'forced': false }
                    },
                ]
            }
        }
    },
```

### MMM-Screen-Powersave-Notification

Like mentiond in the installation this module uses "vcgencmd" to turn the display on or off. At this point of the tutorial i assume that the check did well and we only need to configure the base parameters.
The "delay" parameter controls after which time (seconds) the display should be turned to standby. In this example we want the display to turn off if no movement was detected within the last 45 seconds.

```json5
    {
        module: 'MMM-Screen-Powersave-Notification',
        config: {
            delay: 45
        }
    },
```

### (MMM-ViewNotifications)

This module only needs to be configured if you did the optional installation before :-)

Depending on how many modules are active in your mirror there will be send a lot notifications. We configure the module to display only notifications of the modules recently installed.

```json5
    {
        module: 'MMM-ViewNotifications',
        position: 'bottom_left',
        header: 'Notifications',
        config: {
            timeout: 0,
            format: '{time}: "{module}" sent "{notification}" with {payloadData}',
            includeModules: ["MMM-GPIO-Notifications", "MMM-Screen-Powersave-Notification" ]
        }
    },
```

## Conclusion

Each time the PIR sensor triggers a message should be diplayed on your mirror that the GPIO module send and SCREEN_ON notification.

In the log files of MagicMirror ("~/.pm2/logs/MagicMirror-out.log") entries like the following one should be exist:

```bash
[12:48:48.256] [LOG]    MMM-GPIO-Notifications: Watched pin: 4 triggered!
[12:48:48.256] [LOG]    MMM-GPIO-Notifications: Sending notifications of pin 4...
[12:48:48.319] [LOG]    MMM-Screen-Powersave-Notification: Resetted screen timeout to 60 seconds!
```
