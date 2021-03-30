#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging

class WpaSupplicantConf():
    """
    Helper class to update and read /etc/wpa_supplicant/wpa_supplicant.conf file

    Infos:
        https://w1.fi/cgit/hostap/plain/wpa_supplicant/wpa_supplicant.conf
    """

    CONF = '/etc/wpa_supplicant/wpa_supplicant.conf'

    ENCRYPTION_TYPE_WPA = 'wpa'
    ENCRYPTION_TYPE_WPA2 = 'wpa2'
    ENCRYPTION_TYPE_WEP = 'wep'
    ENCRYPTION_TYPE_UNSECURED = 'unsecured'
    ENCRYPTION_TYPE_UNKNOWN = 'unknown'
    ENCRYPTION_TYPES = [ENCRYPTION_TYPE_WPA, ENCRYPTION_TYPE_WPA2, ENCRYPTION_TYPE_WEP, ENCRYPTION_TYPE_UNSECURED, ENCRYPTION_TYPE_UNKNOWN]

    def __init__(self, filepath=None, backup=True):
        """
        Constructor

        Args:
            filepath (string): if you want to specify another file than /etc/wpa_supplicant/wpa_supplicant.conf.
            backup (bool): backup file
        """
        # empty class, used to get class constants
        pass
