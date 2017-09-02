var Cleep = angular.module('Cleep');

/**
 * Preferences controller
 */
var preferencesController = function($rootScope, $scope, cleepService, debounce)
{
    var self = this;

    self.pref = 'general';
    self.config = {};
    self.noproxy = false;
    self.manualproxy = false;

    //automatic settings saving when config value changed
    $scope.$watch(function() {
        return self.config;
    }, function(newValue, oldValue) {
        if( Object.keys(newValue).length>0 && Object.keys(oldValue).length>0 )
        {
            debounce.exec('config', self.setConfig, 500)
                .then(function() {
                    //console.log('Config saved');
                }, function() {})
        }
    }, true);

    //get configuration
    self.getConfig = function()
    {
        cleepService.getConfig()
            .then(function(resp) {
                //save config
                self.config = resp.data.config;

                //update proxy mode
                self.updateProxyMode(self.config.proxy.mode);
            });
    };

    //set configuration
    self.setConfig = function()
    {
        cleepService.setConfig(self.config)
            .then(function(resp) {
                //overwrite config if specified
                if( resp && resp.data && resp.data.config )
                {
                    self.config = resp.data.config;
                }
            });
    };

    //update proxy mode
    self.updateProxyMode = function(mode)
    {
        if( mode==='noproxy' )
        {
            self.noproxy = true;
            self.manualproxy = false;
        }
        else if( mode==='manualproxy' )
        {
            self.noproxy = false;
            self.manualproxy = true;
        }
        self.config.proxy.mode = mode;
    };

    //init controller
    self.getConfig();
};
Cleep.controller('preferencesController', ['$rootScope', '$scope', 'cleepService', 'debounceService', preferencesController]);
