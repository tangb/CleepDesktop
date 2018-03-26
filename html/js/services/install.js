/**
 * Install service handles data useful to install module
 */
var installService = function($rootScope, logger, cleepService)
{
    var self = this;
    self.isos = {
        isos: [],
        cleepisos: 0,
        raspbianisos: 0,
        withraspbianiso: false,
        withlocaliso: false
    };
    self.drives = [];
    self.wifi = {
        networks: [],
        adapter: false
    }

    /**
     * Return wifi adapter infos
     */
    self.refreshWifiAdapter = function()
    {
        return cleepService.sendCommand('getwifiadapter')
            .then(function(resp) {
                self.wifi.adapter = resp.data.adapter;
            });
    };

    /**
     * Refresh available wifi networks
     */
    self.refreshWifiNetworks = function()
    {
        return cleepService.sendCommand('getwifinetworks')
            .then(function(resp) {
                self.wifi.networks = resp.data.networks;
            });
    };

    /**
     * Refresh list of available drives
     */
    self.refreshDrives = function()
    {
        return cleepService.sendCommand('getflashdrives')
            .then(function(resp) {
                //clear existing drives
                self.drives.splice(0, self.drives.length);

                //fill with new values
                for( var i=0; i<resp.data.length; i++)
                {
                    self.drives.push(resp.data[i]);
                }
            });
    };

    /**
     * Refresh isos list
     */
    self.refreshIsos = function()
    {
        return cleepService.sendCommand('getisos')
            .then(function(resp) {
                self.isos.isos = resp.data.isos;
                self.isos.cleepisos = resp.data.cleepisos===0;
                self.isos.raspbianisos = resp.data.raspbianisos===0;
                self.isos.withraspbianiso = resp.data.withraspbianiso;
                self.isos.withlocaliso = resp.data.withlocaliso;
            });
    };

    //Init service values
    self.init = function()
    {
        //refresh all internal values
        self.refreshWifiAdapter();
        self.refreshWifiNetworks();
        self.refreshIsos();
        self.refreshDrives();
    };

    //Handle config changed to update internal values automatically
    $rootScope.$on('configchanged', function(config) {
        logger.debug('Configuration changed, refresh install service values');
        self.init();
    });

};

var Cleep = angular.module('Cleep');
Cleep.service('installService', ['$rootScope', 'logger', 'cleepService', installService]);