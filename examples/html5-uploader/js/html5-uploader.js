/*
Copyright 2011 OCAD University 

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global FormData, jQuery, fluid*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var demo = demo || {};

(function ($) {
    
    /**
     * Uploader is an Infusion component that represents the whole uploader widget on the page.
     * It has a subcomponent, called the Queue, which is responsible for displaying each file added by the user.
     * The Infusion framework will take care of creating this component and all of its subcomponents automatically.
     *
     * To use the Uploader, users simply need to call demo.uploader() in their page, specifying the DOM element
     * in which to render the Uploader. 
     */
    fluid.defaults("demo.uploader", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        finalInitFunction: "demo.uploader.init",
        
        serverURL: "http://localhost/~colin/image-gallery/uploader-server.php",
        
        model: {
            nextFile: 0,
            files: []
        },
        
        components: {
            queue: {
                type: "demo.uploader.queue",
                container: ".d-uploader-queue", // TODO: Fix me.
                options: {
                    model: "{uploader}.model"
                }
            }
        },
        
        selectors: {
            addFilesButton: ".d-uploader-addFiles",
            filesControl: ".d-uploader-filesControl",
            queue: ".d-uploader-queue",
            uploadButton: ".d-uploader-upload"
        },
        
        events: {
            onAdd: null,
            onRemove: null,
            onStart: null,
            onProgress: null,
            onError: null,
            onSuccess: null
        },
        
        listeners: {
            onAdd: "{queue}.addFiles",
            onRemove: "{queue}.removeFile"
        }
    });
    
    demo.uploader.init = function (that) {
        /**
         * Uploads the next file in the queue to the server.
         */
        that.uploadNext = function () {
            if (that.model.files.length < 1) {
                return;
            }
            
            // Grab the next file from the list and send it off to the server.
            var file = that.model.files[that.model.nextFile];
            var request = demo.uploader.sendRequest(file, that.options.serverURL);
        };
        
        // Listen for any changes on it. When the user adds files, fire the component's onAdd event.
        var filesControl = that.locate("filesControl");
        filesControl.change(function () {
            // Pass along the list of files from the input element.
            that.events.onAdd.fire(filesControl[0].files);
        });
        
        // We have a nice "Add Files" button instead of the standard, ugly <input type=file> element,
        // so when a user clicks on our button, we need to programmatically click the input.
        that.locate("addFilesButton").click(function () {
            filesControl.click();
            return false;
        });
        
        // Bind the Upload button to the uploadNext() method.
        that.locate("uploadButton").click(function () {
            that.uploadNext();
            return false;
        });
    };
    
    /**
     * sendRequest() is a utility function for sending files to the server
     * using HTML5 features such as FormData and XMLHttpRequest Level 2.
     */
    demo.uploader.sendRequest = function (file, url, events) { 
        // Use HTML5's FormData object to build up a file request for the server.
        var formData = new FormData();
        formData.append("file", file);
        
        // Create a new XHR.
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        // Register success and error listeners.
        xhr.onreadystatechange = function () {
            if (status === 200) {
                events.onSuccess.fire(file);
            } else {
                events.onError.fire(file);
            }
        };
        
        // Listen for progress events as the file is uploading.
        xhr.upload.onprogress = function (progressEvent) {
            events.onProgress.fire(file, progressEvent.loaded, progressEvent.total);
        };
        
        // Send off the request to the server.
        xhr.send(formData);
    };
    
    /**
     * The Queue renders each of the files selected by the user into the DOM.
     */
    fluid.defaults("demo.uploader.queue", {
        gradeNames: ["fluid.rendererComponent", "autoInit"],
        finalInitFunction: "demo.uploader.queue.init",        
        model: {},
                
        selectors: {
            files: ".d-uploader-file",
            name: ".d-uploader-file-name"
        },
        
        // This stuff controls the rendering of each file in the queue.
        repeatingSelectors: ["files"],

        protoTree: {
            expander: [{
                // Repeat through each file
                type: "fluid.renderer.repeat",
                
                // At the path "files" in the component's model
                controlledBy: "files",
                
                // Creating an element that matches "files" in our selectors.
                repeatID: "files",
                
                // Name the file variable "file"
                pathAs: "file",
                
                // And render out the name of each file.
                tree: {
                    name: "${{file}.name}"
                }
            }]
        }
    });
    
    demo.uploader.queue.init = function (that) {
        that.addFiles = function (files) {
            that.applier.requestChange("files", files);
            that.refreshView();
        };
    };
    
    /**
     * Progress is responsible for updating the HTML5 progress tag based on events fired from the Uploader.
     */
    fluid.defaults("demo.uploader.progress", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        finalInitFunction: "demo.uploader.progress.init"
    });
    
    demo.uploader.progress.init = function (that) {
        that.update = function (loaded, total) {
            var percentComplete = 100 / (total / loaded);
            that.container.text(percentComplete + "%");
            that.container.value(percentComplete);
        };
    };
})(jQuery);
