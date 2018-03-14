const electron = require('electron');
const {remote} = electron;
const cleepdesktopVersion = remote.getGlobal('cleepdesktopVersion');
const logger = remote.getGlobal('logger');
const appUpdater = remote.getGlobal('appUpdater');
//Use global variable to store cleepdesktop update because on linux env appUpdater does not send
//download progress, so when opening update page the cleepdesktop update progress shows nothing.
//This trick will be removed after electron-updater support download-progress event on linux.
let cleepGlobals = {
    updatingCleepdesktop: false
};

//declare angular module
var Cleep = angular.module('Cleep', ['ngMaterial', 'ngAnimate', 'ngMessages', 'ui.router', 'ngSanitize', 'ngWebSocket']);

//globals
//keep track of all devices messages while CleepDesktop is running
Cleep.value('deviceMessages', []);

//inject electron values
Cleep.value('logger', logger)
    .value('appUpdater', appUpdater)
    .value('cleepdesktopVersion', cleepdesktopVersion)
    .value('cleepGlobals', cleepGlobals);

/**
 * Timestamp to human readable string
 **/
Cleep.filter('hrDatetime', function($filter) {
    return function(ts, shortYear) {
        if( angular.isUndefined(ts) || ts===null )
            return '-';
        else
        {
            if( angular.isUndefined(shortYear) )
                return moment.unix(ts).format('DD/MM/YYYY HH:mm:ss');
            else
                return moment.unix(ts).format('DD/MM/YY HH:mm:ss');
        }
    };
});

Cleep.filter('hrTime', function($filter) {
    return function(ts, withSeconds) {
        if( angular.isUndefined(ts) || ts===null )
            return '-';
        else
        {
            if( angular.isUndefined(withSeconds) )
                return moment.unix(ts).format('HH:mm:ss');
            else
                return moment.unix(ts).format('HH:mm');
        }
    };
});

Cleep.filter('hrDate', function($filter) {
    return function(ts, shortYear) {
        if( angular.isUndefined(ts) || ts===null )
            return '-';
        else
        {
            if( angular.isUndefined(shortYear) )
                return moment.unix(ts).format('DD/MM/YYYY');
            else
                return moment.unix(ts).format('DD/MM/YY');
        }
    };
});

/**
 * Bytes to human readable
 * Code copied from https://gist.github.com/thomseddon/3511330
 */
Cleep.filter('hrBytes', function($filter) {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'], number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    }
});

/**
 * Theme configuration
 */
Cleep.config(['$mdThemingProvider', function($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('red')
        .backgroundPalette('grey');
    $mdThemingProvider
        .theme('alt')
        .backgroundPalette('blue-grey')
        .dark();
}]);

/**
 * MDI font configuration
 */
Cleep.config(['$mdIconProvider', function($mdIconProvider) {
    $mdIconProvider.defaultIconSet('fonts/mdi.svg')
}]);

/**
 * Routes configuration
 */
Cleep.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('default', {
            url: '/',
            templateUrl: 'js/welcome/welcome.html'
        })
        .state('help', {
            url: '/appHelp',
            templateUrl: 'js/welcome/welcome.html'
        })
        .state('preferences', {
            url: '/preferences',
            controller: 'preferencesController',
            controllerAs: 'ctl',
            templateUrl: 'js/preferences/preferences.html'
        })
        .state('about', {
            url: '/about',
            controller: 'aboutController',
            controllerAs: 'ctl',
            templateUrl: 'js/about/about.html'
        })
        .state('updates', {
            url: '/updates',
            controller: 'updatesController',
            controllerAs: 'ctl',
            templateUrl: 'js/updates/updates.html'
        })
        .state('installAuto', {
            url: '/installAuto',
            controller: 'autoInstallController',
            controllerAs: 'ctl',
            templateUrl: 'js/install/installAuto.html'
        })
        .state('installManually', {
            url: '/installManually',
            templateUrl: 'js/install/installManually.html'
        })
        .state('device', {
            url: '/device',
            params: {
                url: null
            },
            controller: 'deviceController',
            controllerAs: 'ctl',
            templateUrl: 'js/device/device.html'
        })
        .state('monitoring', {
            url: '/monitoring',
            controller: 'monitoringController',
            controllerAs: 'ctl',
            templateUrl: 'js/monitoring/monitoring.html'
        });

    $urlRouterProvider.otherwise('/');
}]);

/**
 * Empty controller
 */
var emptyController = function($rootScope, $scope, $state)
{
    var self = this;

    self.openPage = function()
    {
        //$rootScope.openPage('/preferences');
        $state.go('preferences');
    }
};
Cleep.controller('emptyController', ['$rootScope', '$scope', '$state', emptyController]);

/**
 * Cleep controller
 */
var cleepController = function($rootScope, $scope, $state, cleepService, tasksPanelService, modalService, deviceMessages, $timeout, cleepGlobals)
{
    var self = this;
    self.ipcRenderer = require('electron').ipcRenderer;
    self.taskFlashPanel = null;
    self.taskFlashPanelClosed = false;
    self.taskUpdatePanel = null;
    self.taskUpdatePanelClosed = false;
    self.updatingCleepdesktop = false;
    self.updatingEtcher = false;

    //Open page in content area (right side) handling 'openPage' event
    self.ipcRenderer.on('openPage', function(event, page) {
        $state.go(page);
    });

    //Open modal handling 'openModal' event
    self.ipcRenderer.on('openModal', function(event, controllerName, templateUrl) {
        modalService.open(controllerName, templateUrl);
    });

    //Jump to updates page
    self.jumpToUpdates = function() {
        $state.go('updates');
    };

    //Jump to auto install page
    self.jumpToInstallAuto = function() {
        $state.go('installAuto');
    };

    //On close flash task panel
    self.onCloseFlashTaskPanel = function()
    {
        //reset variable
        self.taskFlashPanel = null;
        self.taskFlashPanelClosed = true;
    };

    //On close update task panel
    self.onCloseUpdateTaskPanel = function()
    {
        //reset variable
        self.taskUpdatePanel = null;
        self.taskUpdatePanelClosed = true;
    };

    //On close restart required task panel
    self.onCloseRestartRequiredTaskPanel = function()
    {
        //reset variable
        self.taskRestartRequiredPanel = null;
    };

    //Restart appliation
    self.restartApplication = function()
    {
        //trigger application restart after exit
        remote.app.relaunch();

        //introduce small sleep before closing application
        $timeout(function() {
            remote.app.quit();
        }, 1000);
    };

    //Add flash task panel info
    $rootScope.$on('flash', function(event, data) {
        if( !data )
            return;

        if( data.status>=5 )
        {
            //flash is terminated
            tasksPanelService.removeItem(self.taskFlashPanel);
            self.taskFlashPanel = null;
            self.taskFlashPanelClosed = false;
        }
        else if( self.taskFlashPanelClosed )
        {
            //flash task panel closed by user, do not open it again
        }
        else if( data.status>0 && !self.taskFlashPanel )
        {
            //flash is started
            self.taskFlashPanel = tasksPanelService.addItem(
                'Installing cleep on drive...', 
                {
                    onAction: self.jumpToInstallAuto,
                    tooltip: 'Go to install',
                    icon: 'sd'
                },
                {
                    onClose: self.onCloseFlashTaskPanel,
                    disabled: false
                },
                true
            );
        }
    });

    //handle opening/closing of update task panel according to current cleepdesktop and etcher update status
    self.handleUpdateTaskPanel = function()
    {
        if( (self.updatingCleepdesktop || self.updatingEtcher) && self.taskUpdatePanelClosed )
        {
            //update task panel closed by user, do not open again
        }
        else if( !self.updatingCleepdesktop && !self.updatingEtcher && self.taskUpdatePanelClosed )
        {
            //update task panel closed by user but updates terminated, reset flag
            self.taskUpdatePanelClosed = false;
        }
        else if( (self.updatingCleepdesktop || self.updatingEtcher) && !self.taskUpdatePanel )
        {
            //no update task panel opened yet while update is in progress, open it
            self.taskUpdatePanel = tasksPanelService.addItem(
                'Updating application...', 
                {
                    onAction: self.jumpToUpdates,
                    tooltip: 'Go to updates',
                    icon: 'update'
                },
                {
                    onClose: self.onCloseUpdateTaskPanel,
                    disabled: false
                },
                true
            );
        }
        else if( !self.updatingCleepdesktop && !self.updatingEtcher && self.taskUpdatePanel )
        {
            //no update is running and task panel is opened, close it
            tasksPanelService.removeItem(self.taskUpdatePanel);
            self.taskUpdatePanel = null;
            self.taskUpdatePanelClosed = false;
        }
    };

    //Handle etcher update here to add update task panel
    $rootScope.$on('updates', function(event, data) {
        if( !data )
            return;

        if( data.etcherstatus.status>=3 )
        {
            //update is terminated
            self.updatingEtcher = false;
        }
        else if( !self.taskUpdatePanel && data.etcherstatus.status>0 )
        {
            //update is started
            self.updatingEtcher = true;
        }

        //update task panel
        self.handleUpdateTaskPanel();
    });

    //Handle cleepdesktop update here to add update task panel
    appUpdater.addListener('update-available', function(info) {
        //update available, open task panel if necessary
        logger.debug('--> AppUpdater: update-available');
        self.updatingCleepdesktop = true;
        cleepGlobals.updatingCleepdesktop = true;

        //update task panel
        self.handleUpdateTaskPanel();
    });
    appUpdater.addListener('update-downloaded', function(info) {
        //update downloaded, close task panel
        logger.debug('--> AppUpdater: update-downloaded');
        self.updatingCleepdesktop = false;
        cleepGlobals.updatingCleepdesktop = false;

        //update task panel
        self.handleUpdateTaskPanel();
    });
    appUpdater.addListener('error', function(error) {
        //error during update, close task panel
        logger.debug('--> AppUpdater: error');
        self.updatingCleepdesktop = false;
        cleepGlobals.updatingCleepdesktop = false;

        //update task panel
        self.handleUpdateTaskPanel();
    });

    //Watch for device messages event to append them in global value deviceMessages
    //message are handled in main application to keep the messages alive.
    $rootScope.$on('message', function(event, data) {
        if( !data )
            return;

        //append at beginning new message
        logger.debug('New message:', data);
        deviceMessages.unshift(data);
    });

    //Handle restart required event adding a task panel
    $rootScope.$on('restartrequired', function(event, data) {
        if( !self.taskRestartRequired )
        {
            self.taskRestartRequired = tasksPanelService.addItem(
                'Restart application to apply changes.', 
                {
                    onAction: self.restartApplication,
                    tooltip: 'Restart now!',
                    icon: 'restart'
                },
                {
                    onClose: self.onCloseRestartRequiredTaskPanel,
                    disabled: false
                },
                false
            );
        }
    });

    //Controller init
    self.init = function()
    {
        //init websocket asap
        cleepService.connectWebSocket();

        //trigger application update check few seconds after startup
        $timeout(function() {
            logger.info('Check for CleepDesktop update');
            appUpdater.checkForUpdates();
        }, 30000);
    };

    self.init();

};
Cleep.controller('cleepController', ['$rootScope', '$scope', '$state', 'cleepService', 'tasksPanelService', 'modalService', 
                                    'deviceMessages', '$timeout', 'cleepGlobals', cleepController]);

