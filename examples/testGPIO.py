#! /usr/bin/env python3
import RPi.GPIO as GPIO
import time
import sys

gpio_nr = 4

if len(sys.argv) > 1:
    gpio_nr = int(sys.argv[1])

def callback(channel):
    print("Sensor triggered")

GPIO.setmode(GPIO.BCM)

GPIO.setup(gpio_nr, GPIO.IN)

GPIO.add_event_detect(gpio_nr, GPIO.RISING, callback=callback)

try:
    while True:
        print("Waiting for signal")
        time.sleep(5)
except KeyboardInterrupt:
    GPIO.cleanup()
    print ("Bye")
