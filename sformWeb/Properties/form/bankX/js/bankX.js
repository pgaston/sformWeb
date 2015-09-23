
var app = angular.module('bankX', ['ui.bootstrap'])
    .filter('numberFixedLen', function () {         // site numbers have leading zeros
        return function (n, len) {
            var num = parseInt(n, 10);
            len = parseInt(len, 10);
            if (isNaN(num) || isNaN(len)) {
                return n;
            }
            num = '' + num;
            while (num.length < len) {
                num = '0' + num;
            }
            return num;
        };
    })
    .config(function ($locationProvider) { $locationProvider.html5Mode(true); })
    .directive('confirmOnExit', function () {
        return {
            link: function ($scope, elem, attrs) {
                window.onbeforeunload = function () {
                    if ($scope.myForm.$dirty) {
                        return "The form has unsaved changes, do you want to stay on the page?";
                    }
                },
                $scope.$on('$locationChangeStart', function (event, next, current) {
                    if ($scope.myForm.$dirty) {
                        if (!confirm("The form has unsaved changes, do you want to stay on the page?")) {
                            event.preventDefault();
                        }
                    }
                })
            }
        };
    });


    app.controller('smartFormsController', function ($scope, $http, $location, $rootScope) {

        // Initialize all the data
        // Model - all of our data
        $scope.data = {};            // All form data goes here
        // eventually initialize from local storage
        $scope.data.firstTime = true;

        // Date
        $scope.data.dt = new Date();       // devault to today

        // Requestor
        $scope.data.requestor = {};      // name


        // Client
        $scope.data.client = {};    // name, SRF
        $scope.data.sites = {};      // What sites are affected - all, or a specific site number
        $scope.data.sites.allSites = 'All Sites';
        $scope.data.sites.site = 1;
        $scope.data.clientcontact = {};      // client contact info
        $scope.data.clientcontact.country = "Canada";
        $scope.data.clientType = null;      // nothing selected

        // Sections
        $scope.data.sections = {};
        $scope.data.sections.bOwnedAccounts = false;
        $scope.data.sections.bOwnedAccountsAdded = false;
        $scope.data.sections.bNonOwnedAccounts = false;
        $scope.data.sections.bNonSRFAccounts = false;
        $scope.data.sections.bACHAccounts = false;
        $scope.data.sections.bCloseAccountServices = false;

        $scope.data.sections.bServiceAdmin = false;
        $scope.data.sections.bTokensOrder = false;
        $scope.data.sections.bTwoFactorAuthentication = false;
        $scope.data.sections.bSingleDualAdmin = false;
        $scope.data.sections.bSetMobileAccess = false;

        $scope.data.sections.bClientContact = true;                // testing
        $scope.data.sections.bATWiresFundsAvailability = false;
        $scope.data.sections.bAmalgamation = false;
        $scope.data.sections.bBalanceReporting = false;
        $scope.data.sections.bCoreBillingOption = false;
        $scope.data.sections.bWiresBillingOption = false;
        $scope.data.sections.bChargebackBillingOption = false;
        $scope.data.sections.bAcctTransfersTokenEnablement = false;
        $scope.data.sections.bBillPayTokenEnablement = false;
        $scope.data.sections.bATWiresDirectBooking = false;
        $scope.data.sections.bbankXCancellation = false;
        $scope.data.sections.bPBCloseServices = false;

        $scope.bAnyServices = false;

        // Routing
        $scope.data.routeEBB = true;

        // Section data

        $scope.data.closeReason = null;            // CFS - Close

        // Help on servicesbAcctTransfersTokenEnablement
        $scope.fTab2or3 = function () {
            //    console.log("fTab2or3 - enter - bAnyServices = " + $scope.bAnyServices);
            $scope.bAnyServices = false;
            if ($scope.data.clientType == null) {
                //    console.log("fTab2or3 - exit - bAnyServices = " + $scope.bAnyServices);
                return;
            }

            var bAnyCFSAccounts = $scope.data.sections.bOwnedAccounts || $scope.data.sections.bOwnedAccountsAdded || $scope.data.sections.bNonOwnedAccounts || $scope.data.sections.bNonOwnedSRFAccounts || $scope.data.sections.bACHAccounts || $scope.data.sections.bCloseAccountServices;
            var bAnyPBAccounts = $scope.data.sections.bOwnedAccounts || $scope.data.sections.bNonOwnedAccounts;
            var bAnyCFSSiteOps = $scope.data.sections.bServiceAdmin || $scope.data.sections.bTokensOrder || $scope.data.sections.bTwoFactorAuthentication || $scope.data.sections.bSingleDualAdmin || $scope.data.sections.bSetMobileAccess;
            var bAnyPBSiteOps = $scope.data.sections.bServiceAdmin || $scope.data.sections.bTokensOrder || $scope.data.sections.bTwoFactorAuthentication || $scope.data.sections.bSingleDualAdmin;
            var bAnyCFSOther = $scope.data.sections.bClientContact || $scope.data.sections.bATWiresFundsAvailability || $scope.data.sections.bAmalgamation || $scope.data.sections.bBalanceReporting || $scope.data.sections.bCoreBillingOption || $scope.data.sections.bChargebackBillingOption || $scope.data.sections.bAcctTransfersTokenEnablement || $scope.data.sections.bBillPayTokenEnablement || $scope.data.sections.bATWiresDirectBooking || $scope.data.sections.bbankXCancellation;
            var bAnyPBOther = $scope.data.sections.bClientContact;
            var bAnyPBCBR = $scope.data.sections.bPBCloseServices;

            if (($scope.data.clientType == 'CFS') || ($scope.data.clientType == 'GBSC'))
                $scope.bAnyServices = bAnyCFSAccounts || bAnyCFSSiteOps || bAnyCFSOther;
            else if ($scope.data.clientType == 'Private')
                $scope.bAnyServices = bAnyPBAccounts || bAnyPBSiteOps || bAnyPBOther || bAnyPBCBR;
            //    console.log("bAnyServices is now " + $scope.bAnyServices);
        };

        // Buttons/Tabs
        $scope.data.tabs = [
            { title: "Service Needs", active: true },
            { title: "Gather Information", active: false },
            { title: "Implement Servicing", active: false }
        ];

        // Date picker
        $scope.dateFormat = 'yyyy-MM-dd';
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.today = function () {
            $scope.data.dt = new Date();
        };

        $scope.clear = function () {
            $scope.dt = null;
        };
        $scope.weekendDisabled = function (date, mode) {        // Disable weekend selection
            return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
        };
        $scope.toggleMin = function () {
            $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();

        $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };


        // Mechanics of Save/Load
        $scope._webMethodUrl = "/WebService.asmx/ep";
        $scope._ourUrl = $location.absUrl();
        $scope._sessionId = $location.search().sessionId;
        $scope._bNewSessionId = false;

        $scope.busy = false;

        $scope.fSave = function (bAndMailTo) {
            var send2 = { doWhat: 2, sessionId: "", payload: $scope.data };
            if ($scope._bNewSessionId)
                send2.sessionId = $scope._sessionId;

            $scope.busy = true;
            $http.post($scope._webMethodUrl, send2)
                       .success(function (data) {
                           $scope.busy = false;
                           $scope.smartForm.$setPristine();
                           $scope._sessionId = data.sessionId;
                           $scope._bNewSessionId = true;
                           $location.search('sessionId', data.sessionId);

                           if (bAndMailTo) {
                               var aBody = "Please use the following form for BankX Servicing\n\n";
                               aBody += $location.absUrl();
                               var a = "mailto:ebb@bankX.com?subject=";
                               a += escape('BankX Service Request');
                               a += "&body=";
                               a += escape(aBody);
                               window.location = a;
                           }
                       })
                       .error(function () {
                           $scope.busy = false;
                           alert("Saving the form data to the server failed.   Check your internet connection and please try again later.");
                       })
        };

        $scope.fLoad = function () {
            if ( angular.isUndefined( $scope._sessionId )) {
                $scope.busy = false;
                return;
            }
            
            var send1 = { doWhat: 1, sessionId: $scope._sessionId, payload: null };
            $scope.busy = true;
            $http.post($scope._webMethodUrl, send1)
                       .success(function (data) {
                           $scope.busy = false;
                           $scope.data = data.payload;
                           $scope.smartForm.$setPristine();
                       })
                       .error(function () {
                           $scope.busy = false;
                           alert("Loading the form data from the server failed.   Check your internet connection and please try again later.");
                       })

        };

        $scope.fLoad();     // initial load
    })


