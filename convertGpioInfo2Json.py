#!/bin/env python3

import subprocess
import sys
import json

filename = "gpioinfo.json"
if len(sys.argv) > 1:
   filename = sys.argv[1]
print("Will write results to: %s" % filename)

print("Gathering infos with gpioinfo")
proc = subprocess.run("gpioinfo", shell=True, capture_output=True, encoding="UTF-8")

if proc.returncode > 0:
    print("Failed to execute gpioinfo. Aborting")
    sys.exit(1)


print("Processing the output of gpioinfo")
info = proc.stdout.splitlines(True)

chips = {}
gpios = {}
curChipName = None
curChipNmbr = -1
curChip = {}
for line in info:
    line = line.strip()
    #print (line)

    if line.startswith("gpiochip"):
        if curChipName != None:
            chips[curChipName] = curChip

        curChipName = line.split()[0]
        curChipNmbr = int(curChipName.replace("gpiochip",""))
        curChip = {}

    elif line.startswith("line"):
        lineArray = line.split()
        lineNmbr = int(lineArray[1].replace(":",""))
        gpioName = lineArray[2].replace('"',"")
        curChip[gpioName] = lineNmbr
        gpios[gpioName] = [curChipNmbr, lineNmbr]

if curChipName != None:
    chips[curChipName] = curChip

result = {
        "gpios":gpios,
        "chips":chips
}

print("Writing result file")
out_file = open(filename, "w")
json.dump(result, out_file, indent = 4)
out_file.close()
