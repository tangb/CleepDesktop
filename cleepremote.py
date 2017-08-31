#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from cleep import rpcserver
import sys

#parameters
if len(sys.argv)!=3:
    print('Missing parameter. Usage: cleepremote <rpcport> <configpath>')
    sys.exit(2)
try:
    rpcport = int(sys.argv[1])
except:
    print('Invalid parameter rpcport: integer awaited')
    sys.exit(1)
config_path = sys.argv[2]

#get rpc application
debug = True
app = rpcserver.get_app(config_path, debug)

#connect to ui
#comm = CleepCommClient(config.value('localhost', type=str), config.value('commport', type=int), command_received, logger)
#comm = CleepCommServer(config.value('localhost', type=str), config.value('commport', type=int), rpcserver.command_received, True)
#if not comm.connect():
#    print('Failed to connect to ui, stop')
#comm.start()

#start rpc server
rpcserver.logger.debug('Serving files from "%s" folder.' % rpcserver.HTML_DIR)
rpcserver.start(u'0.0.0.0', rpcport, None, None)

#clean everythng
sys.exit(0)
