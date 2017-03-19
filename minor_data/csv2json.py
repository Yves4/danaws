#!/usr/bin/env python
import sys
import csv
import json

"""
Usage:  ./csv2json.py database.csv > database.json
"""

def formatrow(row):
    # ['Title', 'Path', 'Start period', 'Faculteiten', 'Minor taal', 'Interessegebied']
    keys = ['name', 'url', 'startperiod', 'faculteit', 'taal', 'gebied' ]

    pstr = row[2].replace('Periode','').replace(' ','').split(',')
    try:
        row[2] = [int(x) for x in pstr]
    except:
        row[2] = [] # geen periodes

    return dict(zip(keys,row))
    
def processcsv(filename):
    with open(filename, 'rb') as csvfile:
        filebody = csv.reader(csvfile, delimiter=',', quotechar='"')
        next(csvfile) # skip header row
        minors = []
        for row in filebody:
            minors.append(formatrow(row))
    return minors

if __name__ == '__main__':
    minors = processcsv(sys.argv[1])
    print json.dumps(minors, indent=2)
