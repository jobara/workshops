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
        preInitFunction: "demo.uploader.preInit",
        postInitFunction: "demo.uploader.postInit",
        
        serverURL: "../php/server.php",
        
        model: {
            files: []
        },
        
        components: {
            queue: {
                type: "demo.uploader.queue"
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
            onStart: null,
            onProgress: null,
            onError: null,
            onSuccess: null
        },
        
        listeners: {
            onAdd: "{queue}.addFiles",
            onError: "{uploader}.uploadNext",
            onSuccess: "{uploader}.uploadNext"
        }
    });
    
    demo.uploader.preInit = function (that) {
        /**
         * Opens the file chooser dialog.
         */
        that.chooseFiles = function () {
            that.filesControl.click();
        };
        
        /**
         * Uploads the next file in the queue to the server.
         */
        that.uploadNext = function () {
            if (that.model.files.length < 1) {
                return;
            }
            
            // Grab the next file from the list and send it off to the server.
            var file = that.model.files.pop();
            var request = demo.uploader.sendRequest(file, that.options.serverURL, that.events);
        };        
    };
    
    demo.uploader.postInit = function (that) {
        that.filesControl = that.locate("filesControl");
        
        // Listen for any changes on the HTML5 input element. When the user adds files, fire the component's onAdd event.
        that.filesControl.change(function () {
            // Pass along the list of files from the input element.
            // Unwrap them first, though, because they aren't stored in real array,
            // so we can't easily manipulate them.
            var files = [];
            fluid.each(that.filesControl[0].files, function (file) {
                files.push(file);
            });
            that.events.onAdd.fire(files);
        });
        
        // We have a nice "Add Files" button instead of the standard, ugly <input type=file> element,
        // so when a user clicks on our button, we need to programmatically click the input.
        that.locate("addFilesButton").click(function () {
            that.chooseFiles();
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
        preInitFunction: "demo.uploader.queue.preInit",
        finalInitFunction: "demo.uploader.queue.finalInit",
                
        selectors: {
            emptyQueue: ".d-uploader-empty-queue",
            files: ".d-uploader-file",
            selectables: ".d-uploader-queue-selectable",
            summary: ".d-uploader-file-summary",
            name: ".d-uploader-file-name",
            progress: ".d-uploader-file-progress"
        },
        
        // This stuff controls the rendering of each file in the queue.
        repeatingSelectors: ["files"],
        selectorsToIgnore: ["selectables"],
        
        protoTree: {
            expander: [{
                // Repeat through each file
                type: "fluid.renderer.repeat",
                
                // At the path "files" in the component's model
                controlledBy: "files",
                
                // Creating an element that matches "files" in our selectors.
                repeatID: "files:",
                
                // Name the file variable "file"
                pathAs: "file",
                valueAs: "fileVal",
                
                // And render out the name of each file.
                tree: {
                    name: "${{file}.name}",
                    summary: "${{file}.name}",
                    progress: {
                        decorators: {
                            type: "fluid",
                            func: "demo.uploader.progress",
                            options: {
                                model: {
                                    fileName: "{fileVal}.name"
                                }
                            }
                        }
                    }
                }
            }]
        },
        
        styles: {
            selected: "d-uploader-selected"
        },
        
        listeners: {
            afterRender: "{queue}.refreshQueue"
        }        
    });
    
    fluid.demands("demo.uploader.queue", "demo.uploader", {
        container: "{uploader}.options.selectors.queue", // TODO: Why can't I just refer to {uploader}.dom.queue?
        options: {
            model: "{uploader}.model"
        }
    });
    
    demo.uploader.queue.preInit = function (that) {        
        that.addFiles = function (files) {
            that.applier.requestChange("files", files);
            that.refreshView();
        };
        
        that.refreshQueue = function () {
            that.selectableContext.refresh();
            that.locate("files").removeClass("fl-hidden");
            fluid.tabbable(that.container);
            that.container.focus();
        };
    };
    
    demo.uploader.queue.finalInit = function (that) {
        // Make the queue keyboard navigable.
        that.selectableContext = fluid.selectable(that.container, {
            selectableSelector: that.options.selectors.selectables,
            onSelect: function (itemToSelect) {
                $(itemToSelect).parent().addClass(that.options.styles.selected);
            },
            onUnselect: function (selectedItem) {
                $(selectedItem).parent().removeClass(that.options.styles.selected);
            }
        });
    };
    
    /**
     * Progress is responsible for updating the HTML5 progress tag based on events fired from the Uploader.
     */
    fluid.defaults("demo.uploader.progress", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        postInitFunction: "demo.uploader.progress.init",
        
        // TODO: This is a workaround for a bug in the framework or my own confusion.
        uploader: "{uploader}"
    });
        
    demo.uploader.progress.init = function (that) {
        that.update = function (file, loaded, total) {
            if (file.name !== that.model.fileName) {
                return;
            }
            
            var percentComplete = 100 / (total / loaded);
            that.container.text(percentComplete + "%");
            that.container.attr("value", percentComplete);
        };
        
        // Bind a listener to the Uploader's onProgress event.
        // TODO: It should be possible to do this declaratively.
        that.options.uploader.events.onProgress.addListener(that.update);
    };
})(jQuery);
