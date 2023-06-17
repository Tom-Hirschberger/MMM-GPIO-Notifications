#! /usr/bin/env python3
#A small script which tests if a rotary encoder is wired properly and is working
#The arguments are positional:
#- The debounce time in milliseconds (default: 5)
#- The data GPIO (default: 5)
#- The clock GPIO (default: 6)
#
#The pull-up resistors need to be configured for the GPIOs used.
#In RaspberryOS can enable pullup in the file /boot/config.txt (do not forget to reboot after changes to this file)
#i.e. the line "gpio=5,6,13=pu" (without the quotes) enables pullup for the GPIOs 5, 6 and 13
import RPi.GPIO as GPIO
import time
import sys

count = 0
debounce = 5
gpios = [5,6]
gpio_last_value = {5: 1, 6:1}
last_final_change = 0

if len(sys.argv) > 1:
  debounce = int(sys.argv[1])
  if len(sys.argv) > 2:
    gpios = []
    for cur_gpio in sys.argv[2:]:
      gpios.append(int(cur_gpio))
    gpio_last_value = {gpios[0]:1, gpios[1]:1}

debounce = debounce * 1000 #convert debounce to nano seconds

def callback(channel):
  global last_final_change, count, debounce, gpios, gpio_last_value, last_final_change
  timestamp = time.time_ns()
  #print("GPIO %d changed (%s)" % (channel, GPIO.input(channel)))
  gpio_cur_value = (GPIO.input(gpios[0]), GPIO.input(gpios[1]))
  if gpio_cur_value[0] == gpio_cur_value[1]:
    if gpio_cur_value[0] == 1:
      if timestamp - last_final_change > debounce:
        last_final_change = timestamp
        #print("Got a High/High")
        if gpio_last_value[gpios[0]] == 0:
          if gpio_last_value[gpios[1]] == 1:
            print("CW(%d)"%count,flush=True)
            count += 1
        else:
          if gpio_last_value[gpios[0]] == 0:
            print("CCW(%d)"%count,flush=True)
            count += 1
      
    else:
      if timestamp - last_final_change > debounce:
        last_final_change = timestamp
        #print("Got a Low/Low")
        if gpio_last_value[gpios[0]] == 1:
          if gpio_last_value[gpios[1]] == 0:
            print ("CW(%d)"%count,flush=True)
            count += 1
        else:
          if gpio_last_value[gpios[1]] == 1:
            print("CCW(%d)"%count,flush=True)
            count += 1
  else:
    #print("GPIO %d changed but %d is different!" %(channel, partner[channel]))
    gpio_last_value[channel] = GPIO.input(channel)

GPIO.setmode(GPIO.BCM)

for gpio_nr in gpios:
  print ("Register GPIO %s" %gpio_nr)
  GPIO.setup(int(gpio_nr), GPIO.IN)
  GPIO.add_event_detect(int(gpio_nr), GPIO.BOTH, callback=callback)

try:
  while True:
    time.sleep(5)
except KeyboardInterrupt:
  GPIO.cleanup()
  print ("Bye")
