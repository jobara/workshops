/*
Copyright 2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global demo:true, fluid, jQuery*/

var demo = demo || {};

(function ($) {
    fluid.registerNamespace("demo.geoLocator");
    
    demo.geoLocator.preInit = function (that) {
        
        that.updateModel = function (location) {
            that.model.city = fluid.get(location, "address.city");
            that.model.longitude = fluid.get(location, "coords.longitude");
            that.model.latitude = fluid.get(location, "coords.latitude");
            that.events.afterModelChanged.fire();
        };
        
        that.displayLocation = function (location) {
            fluid.each(that.model, function (position, key) {
                that.locate(key).text(position || that.options.strings.unknown);
            });
        };
        
        that.setCityInput = function () {
            var cityInput = that.locate("cityInput");
            cityInput.val(that.model.city);
            cityInput.removeProp("disabled");
        };
    };
    
    demo.geoLocator.finalInit = function (that) {
        that.locate("cityInput").prop("disabled", true);
        that.geoLocate(that.events.locationFound.fire, that.events.locationNotFound.fire);
    };
    
    demo.geoLocator.geoLocate = function (success, error) {
        if (!!navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
        } else if (error){
            error({
                code: 0
            });
        }
    };
    
    fluid.defaults("demo.geoLocator", {
        gradeNames: ["fluid.rendererComponent", "autoInit"],
        preInitFunction: "demo.geoLocator.preInit",
        finalInitFunction: "demo.geoLocator.finalInit",
        invokers: {
            geoLocate: "demo.geoLocator.geoLocate"
        },
        selectors: {
            city: ".demo-geoLocator-city",
            cityInput: ".demo-geoLocator-cityInput",
            longitude: ".demo-geoLocator-longitude",
            latitude: ".demo-geoLocator-latitude"
        },
        strings: {
            unknown: "unknown"
        },
        events: {
            locationFound: null,
            locationNotFound: null,
            afterModelChanged: null
        },
        listeners: {
            locationFound: "{geoLocator}.updateModel",
            locationNotFound: "{geoLocator}.updateModel",
            afterModelChanged: ["{geoLocator}.displayLocation", "{geoLocator}.setCityInput"]
        },
        model: {
            city: null,
            longitude: null,
            latitude: null
        }
    });
})(jQuery);