// jQuery Plugin Boilerplate
// A boilerplate for jumpstarting jQuery plugins development
// version 1.1, May 14th, 2011
// by Stefan Gabos

//Simple plugin 'QuickJax' for sending/receiving http requests using JQuery's ajax framework
//Created by Edward Selby

// prevent conflicts
(function($) {

    //here we go!
    $.quickJax = function(element, options) {

        // plugin's default options
        // these are private properties and are only accessible from inside the plugin
        var defaults = {
            
            start: {time:0}, //the start time of this request
            end: {time:0}, //the end time of this request
            diff: {time:0}, //the difference for start and end
            url: "../../index.php", //the page url to send the request (can be relative)
            dataType: 'HTML', //expected data type
            requestType: 'POST', //the request type
            id: '', //this requests id (gets set to 'rx' if not specified)
            ele: [], //not used
            cache: false, //are we caching these requests?
            contentType: true, //default(bool true) = application/x-www-form-urlencoded; charset=UTF-8
            processData: true, //transform data into a query string
            dataObj: {}, //empty object to put our data object
            request: {} //the request!
            
        }

        // redefine the scope
        var plugin = this;

        // this will hold the merged default, and user-provided options
        // plugin's properties will be available through this object like:
        // plugin.settings.propertyName from inside the plugin or
        // element.data('pluginName').settings.propertyName from outside the plugin, 
        // where "element" is the element the plugin is attached to;
        plugin.settings = {}

        // the "constructor" method that gets called when the object is created
        plugin.init = function() {

            // merge the defaults with any parsed options
            plugin.settings = $.extend({}, defaults, options);

        }

        // public methods
        // these methods can be called like:
        // plugin.methodName(arg1, arg2, ... argn) from inside the plugin or
        // $.quickJax.publicMethod(arg1, arg2, ... argn) from outside
        
        //receiver function
        //this public function sends a request to the server and expects a resourse (string) response.
        //the response gets parsed to the success and fail public methods
        
        //@param (string) action ('page@function' to be routed by the server)
        //@param (string|float) data (data to be sent to the server)
        //@param (string) id (an identifier, also used to trigger any document bound events)
        //@return (object) this (for chaining public methods)
        plugin.receive = function(action, data, id) {
            
            //start the cursor spinning!
            cursorStart();
            
            //start the timer!
            startTime(plugin.settings.id);
            
            plugin.settings.action  = action;
            plugin.settings.id      = plugin.settings.prev_id = id;
            plugin.settings.data    = data;
            plugin.settings.dataObj = { action: plugin.settings.action, data: plugin.settings.data };
            
            //if an id doesnt exist give it one
            plugin.settings.id == undefined ? plugin.settings.id = plugin.settings.action : 'rx';
            //if data is empty make it an empty string
            plugin.settings.data == undefined ? plugin.settings.data = '' : '';
            
            //if we have parsed 'id' by accident throw an error (cant use 'id')
            if (typeof plugin.settings.data.id != 'undefined') {
                response('fail_id');
                return false;
            }
            
            //create the request
            var request = $.ajax({
                cache:      plugin.settings.cache,
                url:        plugin.settings.url,
                type:       plugin.settings.requestType,
                data:       plugin.settings.dataObj,
                dataType:   plugin.settings.dataType,
                id:         plugin.settings.id
            });
            
            //set the request object
            plugin.settings.request = request;
            
            //default done function
            request.done(function(data, statusText, xhr) {
                if (endTime(this.id)) {
                    response('success', this.id, xhr.status);
                }
            //default fail function
            }).fail(function(data, statusText, xhr) {
                if (endTime(this.id)) {
                    response('fail', this.id, data.status);
                }
            //default always function
            }).always(function() {
                //trigger event when request completes
                $(document).trigger('ajax-request-complete', [this.id]);
                
                //stops the cursor spinning
                cursorStop();
            });
            
            //return (object) 'this'
            return plugin;
            
        }
        
        //sender function
        //this public function sends a request to the server and expects a JSON response.
        //the response gets parsed to the success and fail public methods
        
        //@param (string) action ('page@function' to be routed by the server)
        //@param (string|float) data (data to be sent to the server)
        //@param (string) id (an identifier, also used to trigger any document bound events)
        //@return (object) this (for chaining public methods)
        
        plugin.send = function(action, data, id) {
            
            //start the cursor spinning!
            cursorStart();
            
            //start the timer!
            startTime(plugin.settings.id);
            
            plugin.settings.action = action;
            plugin.settings.id = id;
            plugin.settings.data = data;
            plugin.settings.dataObj = { action: plugin.settings.action, data: plugin.settings.data };
            
            //if an id doesnt exist give it one
            plugin.settings.id == undefined ? plugin.settings.id = plugin.settings.action : 'rx';
            //if data is empty make it an empty string
            plugin.settings.data == undefined ? plugin.settings.data = '' : '';
            
            //if we have parsed 'id' by accident throw an error (cant use 'id')
            if (typeof plugin.settings.data.id != 'undefined') {
                response('fail_id');
                return false;
            }
            
            //create the request
            var request = $.ajax({
                cache:      plugin.settings.cache,
                url:        plugin.settings.url,
                type:       plugin.settings.requestType,
                data:       plugin.settings.dataObj,
                dataType:   plugin.settings.dataType,
                id:         plugin.settings.id
            });
            
            //set the request object
            plugin.settings.request = request;
            
            //set the request object
            request.done(function(data, statusText, xhr) {
                //validate json response
                if (data != '') {
                    if (!parseJson(data)) {
                        //dump and die
                        document.write(data);
                    } else {
                        var obj = jsonToArray(data);
                    }
                    if (obj['type'] !== 'none') {
                        pushNotification(obj['title'], obj['response'], obj['type'], obj['hide']);
                    }
                }
                
                if (endTime(this.id)) {
                    response('success', this.id, xhr.status);
                }
            //default fail function
            }).fail(function(data, statusText, xhr) {
                if (endTime(this.id)) {
                    response('fail', this.id, data.status);
                }
            //default always function
            }).always(function() {
                //trigger event when request completes
                $(document).trigger('ajax-request-complete', [this.id]);
                
                //stops the cursor spinning
                cursorStop();
            });
            
            return plugin;
            
        }
        
        //chainable fail function
        //@param (function) callable (callback function to execute)
        //@return (object) this
        plugin.fail = function(callable) {
            plugin.settings.request.fail(function(html, request, options) {
                callable(html);
            });
            return plugin;
        }
        
        //chainable success function
        //@param (function) callable (callback function to execute)
        //@return (object) this
        plugin.success = function(callable) {
            plugin.settings.request.done(function(html, request, options) {
                callable(html);
            });
            return plugin;
        }
        
        //chainable before function - gets executed before the ajax request starts
        //@param (function) callable (callback function to execute)
        //@return (object) this
        plugin.before = function(callable) {
            callable();
            return plugin;
        }
        
        //chainable after function - gets executed after the ajax request ends
        //@param (function) callable (callback function to execute)
        //@return (object) this
        plugin.after = function(callable) {
            plugin.settings.request.always(function() {
                callable();
            });
            return plugin;
        }
        
        // private methods
        // these methods can be called only from inside the plugin like:
        // methodName(arg1, arg2, ... argn)
        
        //starts the cursor spinning
        var cursorStart = function() {
            window.onbeforeunload = function() {
                return "Currently processing a request.";
            }
            $('html').css('cursor', 'progress');
        }
        
        //stops the cursor spinning
        var cursorStop = function() {
            window.onbeforeunload = null;
            $('html').css('cursor', 'auto');
        }
        
        //pushs a notification to the window (fixed at the top)
        //@param (string) title - a title
        //@param (string) text - the message
        //@param (string) type - type of message error|success|info|warning to be used with bootstrap?
        var pushNotification = function(title, text, type) {
            
            //create the elements
            var html;
            html = '<div style="display:none; position:fixed; width:100%; z-index:1000" class="alert alert-'+type+'">';
            html += '<div class="container">';
            html += '<strong>'+title+'</strong> '+text;
            html += '</div></div>';
            
            //prepend it to the document
            $('html').prepend(html);
            
            //animate it... very nice.
            $('html').find('.alert').slideDown('slow', function() {
                $('html').find('.alert').delay(1500).slideUp('slow');
            });
            
        }
        
        //starts/stops a timer to see how long the request take (good for unit testing)
        //start the timer
        //@param (string) action - id parsed to the receive and fail functions are used to reference each timer
        //@return (int) the time
        var startTime = function(action) {
            plugin.settings.start[action] = {time:(new Date().getTime() / 1000)};
            return plugin.settings.start[action].time;
        }
        
        //end the timer
        //@param (string) action - id parsed to the receive and fail functions are used to reference each timer
        //@return (int) the difference in the timers
        var endTime = function(action) {
            if(!plugin.settings.end[action] != undefined) {
                plugin.settings.end[action] = {time:(new Date().getTime() / 1000)};
            }
            plugin.settings.diff = diffTime(action);
            return plugin.settings.diff;
        }
        
        //@param (string) action - id parsed to the receive and fail functions are used to reference each timer
        //@return (int) the difference in the timers
        var diffTime = function(action) {
            if (plugin.settings.start[action] != undefined && plugin.settings.end[action] != undefined) {
                return (plugin.settings.end[action].time - plugin.settings.start[action].time).toFixed(3);
            }
        }
        
        //check if parsed JSON is valid
        //@param (string) JSON to parse
        //@return (bool) false
        var parseJson = function(jsonString) {
            try {
                var o = JSON.parse(jsonString);
        
                // Handle non-exception-throwing cases:
                // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                // but... JSON.parse(null) returns 'null', and typeof null === "object", 
                // so we must check for that, too.
                if (o && typeof o === "object" && o !== null) {
                    return o;
                }
            }
            catch (e) { }
        
            return false;
        }
        
        //convert JSON to javascript object
        //@param (string) JSON to convert
        //@return (object) obj
        var jsonToArray = function(json) {
            //Debug point
            //document.write(json);
            var obj = JSON && JSON.parse(json) || $.parseJSON(json);
            
            var arr = [];
            for(var x in obj){
              arr.push(obj[x]);
            }
            return obj;
        }
        
        //handle responses
        //@param (string) code - what tyoe of reponse is this?
        //@param (string) id - what request is this?
        //@param (int) reponseCode - server response code parsed by ajax
        var response = function(code, id, responseCode) {
            switch (code) {
                case 'success':
                    console.log('Received in: '+plugin.settings.diff+'s. Action: '+id+' ('+responseCode+')');
                break;
                case 'fail':
                    console.log('Failed. received in: '+plugin.settings.diff+'s. Action: '+id+' ('+responseCode+')');
                break;
                case 'fail_id':
                    console.log('Failed. "id" is an internal variable and cannot be used. Action: '+id+' ('+responseCode+')');
                break;
            }
        }
        

        //fire up the plugin!
        // all the "constructor" method
        plugin.init();
        
        //return this for chaining
        return plugin;

    }

})(jQuery);