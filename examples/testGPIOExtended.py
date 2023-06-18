#! /usr/bin/env python3
#As small script that monitores one or more GPIOs to changes.
#The following arguments are positinal ones:
#- The debounce time to use in milliseconds (default: 10)
#- The GPIO to watch (default: 4)
#- Any additonal argument will be treated as additional GPIO
import RPi.GPIO as GPIO
import time
import sys

debounce = 10
gpios = ["4"]

if len(sys.argv) > 1:
  debounce = int(sys.argv[2])
  if len(sys.argv) > 2:
    gpios = sys.argv[2:]

def callback(channel):
    print("GPIO %d changed (%s)" % (channel, GPIO.input(channel)))

GPIO.setmode(GPIO.BCM)

for gpio_nr in gpios:
  print ("Register GPIO %s" %gpio_nr)
  GPIO.setup(int(gpio_nr), GPIO.IN)
  GPIO.add_event_detect(int(gpio_nr), GPIO.BOTH, callback=callback, bouncetime=debounce)

try:
  while True:
    print("Waiting for signal")
    time.sleep(5)
except KeyboardInterrupt:
  GPIO.cleanup()
  print ("Bye")
