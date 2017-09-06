//var log = require('electron-log');


/*var left = document.getElementById('leftPanel');
var leftPanel = angular.element(left);
leftPanel.attr('src', 'http://localhost:5610/devices.html');*/

/*setTimeout(function() {
log.info('plouf');
var right = document.getElementById('rightPanel');
var rightPanel = angular.element(right);
console.log(rightPanel);
//rightPanel.attr('src', 'http://localhost:5610/homepage.html');
//right.loadURL('http://localhost:5610/homepage.html');
//right.reloadIgnoringCache()
//right.loadUrlL('http://www.google.fr');
}, 1000);*/

/*var net = require('net');
var s = new net.Socket();
s.on('data', function(data) {
    log.info('received data ', data);
});
s.connect(5611, function() {
    var test = {
        command: 'helloworld',
        params: {
            param1: 'yop',
            param2: 'ploum'
        }
    };
    var j = JSON.stringify(test);
    s.write(j);
});*/

//https://github.com/socketio/socket.io-client
/*var socket = io.connect('http://localhost:5611');
socket.on('connect', function() {
    log.info('connected');
});
socket.on('disconnect', function() {
    log.info('disconnect');
});
socket.on('event', function(data) {
    log.info('event', data);
});
function mysend() {
    log.info('->send data');
    log.info(socket.emit('pouet'));
    setTimeout(function(){ mysend(); }, 1000);
}
mysend();*/


/*doens't work
document.addEventListener('DOMContentLoaded', function () {
    log.info('ok');
    document.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(function () {
            var path = e.target.href;
            //ipcRenderer.sendToHost('element-clicked', path);
            log.info('click handled');
        }, 100);
        return false;
    }, true);
});*/

/*right.addEventListener('will-navigate', function(event) {
    log.info('wv navigate');
});
right.addEventListener('new-window', function() {
    log.info('wv new window');
});*/

var Cleep = angular.module('Cleep', ['ngMaterial', 'ngAnimate', 'ngMessages', 'ui.router', 'ngSanitize']);


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
 * Theme configuration
 */
Cleep.config(['$mdThemingProvider', function($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('red')
        .backgroundPalette('grey');
    $mdThemingProvider
        .theme('dark')
        .primaryPalette('amber')
        .accentPalette('blue')
        .dark();
}]);

Cleep.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('default', {
            url: '/',
            templateUrl: 'welcome.html'
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
            templateUrl: 'device.html'
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

var deviceController = function($rootScope, $scope, $stateParams)
{
    var self = this;
    self.shell = require('electron').shell;
    self.deviceUrl = $stateParams.url;
    self.wv = document.getElementById('deviceWv');

    //handle external link
    self.wv.addEventListener('new-window', function(event) {
        event.preventDefault();
        self.shell.openExternal(event.url);
    });

    //configure webview src
    self.wvAngular = angular.element(self.wv);
    self.wvAngular.attr('src', $stateParams.url);
};
Cleep.controller('deviceController', ['$rootScope', '$scope', '$stateParams', deviceController]);

var cleepController = function($rootScope, $scope, $state, cleepService)
{
    var self = this;
    self.ipcRenderer = require('electron').ipcRenderer;

    //handle 'openPage' menu event
    self.ipcRenderer.on('openPage', function(event, page) {
        $state.go(page);
    });

    //display infos about ended installation
    /*$rootScope.on('flash', function(event, data) {
        if( data.status>=5 )
        {
            //flash is terminated
            toast.info('Installation is terminated');
        }
    });*/

    //init websocket
    cleepService.connectWebSocket();

};
Cleep.controller('cleepController', ['$rootScope', '$scope', '$state', 'cleepService', cleepController]);

/**
 * Devices controller
 */
var devicesController = function($rootScope, $scope, $timeout, cleepService, $state)
{
    var self = this;
    self.devices = [];
    self.unconfigured = 0;
    self.configured = 0;
    self.loading = true;

    //synchronize devices
    self.syncDevices = function(devices)
    {
        if( devices )
        {
            var found = false;
            for( var i=0; i<devices.length; i++ )
            {
                found = false;
                for( var j=0; j<self.devices.length; j++ )
                {
                    if( self.devices[j].uuid===devices[i].uuid )
                    {
                        //device found
                        found = true;

                        //update device infos
                        self.devices[j].hostname = devices[i].hostname;
                        self.devices[j].ip = devices[i].ip;
                        self.devices[j].port = devices[i].port;
                        self.devices[j].online = devices[i].online;

                        break;
                    }
                }

                //add new device
                if( !found )
                {
                    //set device configured flag
                    if( devices[i].hostname.length>0 )
                        devices[i].configured = true;
                    else
                        devices[i].configured = false;

                    //save entry
                    self.devices.push(devices[i]);
                }
            }
        }
    };

    //get devices
    /*self.getDevices = function()
    {
        rpcService.getDevices()
            .then(function(resp) {
                if( resp && !resp.error )
                {
                    self.loading = false;

                    self.syncDevices(resp.data.devices);
                    self.unconfigured = resp.data.unconfigured;
                    self.configured = self.devices.length - self.unconfigured;
                }
            });
    };*/

    //watch for devices
    /*self.watchDevices = function()
    {
        $timeout(function() {
            self.getDevices();
        }, 1000)
            .then(function() {
                self.watchDevices();
            });
    };*/

    //open device page
    self.openDevicePage = function(device)
    {
        if( device )
        {
            //prepare device url
            var url = device.ip + ':' + device.port;
            if( device.ssl )
                url = 'https://' + url;
            else
                url = 'http://' + url;

            //open device page on right panel
            $state.go('device', {url:url});
        }
    };

    //init controller
    //self.watchDevices();
    
    self.updateDevices = function(data) 
    {
        $timeout(function() {
            self.syncDevices(data.devices);
            self.unconfigured = data.unconfigured;
            self.configured = self.devices.length - self.unconfigured;
            self.loading = false;
        }, 0);
    };

    self.openDevice = function()
    {
        //leftPanel.attr('src', self.src);

        cleepService.send('coucou', {});
    };

    //start devices websocket
    //rpcService.devicesWebSocket(self.updateDevices);
    
    $rootScope.$on('devices', function(event, data)
    {
        self.updateDevices(data);
    });
};
Cleep.controller('devicesController', ['$rootScope', '$scope', '$timeout', 'cleepService', '$state', devicesController]);

/**
 * Homepage controller
 */
/*var homepageController = function($rootScope, $scope, rpcService)
{
    var self = this;

    self.refresh = function()
    {
        console.log('refresh button clicked');
        rpcService.sendUi('coucou', null);
    };
};
Cleep.controller('homepageController', ['$rootScope', '$scope', 'rpcService', homepageController]);*/

