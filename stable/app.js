/*!
* app.js Javascript Library v0.9.2
*
* Copyright (c) 2011 Fabian Irsara
* Licensed under the GPL Version 2 licenses.
*
* Provides prototypal inheritence of self-defined Classes
* Parsing Classes
* Requiring, extending Classes
* including Plugins and Stylesheets Dynamically
*/

var window = (function(){
  return this;
})();



var app, ClassParser;

app = (function (window) {
  "use strict";

  var VERSION = 0.92
    , NAME = 'app'
    , MINIFY_JS = false
    , CACHE = false
    , BASE_PATH = ''

    , ignoredClasses = []
    , importedClasses = {}
    , importedClassesCount = 0;
  
  
  var SuperClass = function () {
    this.self = this;
    this.priv = {};
  };
  
  
  // Private Functions
  var AJAX, searchHeadElement, appendHeadElement, checkRequirements, inArray, checkForClass, gotClass, internalParse;

  // Public Functions
  var Class
    , ignore
    , run
    , style
    , remove
    , requires
    , extendClass
    , __extend
    , hasClass
    , include
    , parseClass
    , defineClass;

  
  var document = window.document;
  
  
  
  // Abstract Class Definition
  //--------------------------
  Class = function(classOptions) {
    this.className        = '';
    this.classConstructor = null;
    this.superClass       = 'Class';
    this.imports          = [];
    this.plugins          = [];
    this.callback         = null;
    
    for (var k in classOptions)
    {
      if (k !== 'indexOf') { this[k] = classOptions[k]; }
    }
  };
  
  
  // Ignore Class-File from Import / Removement
  // Used when Classes are in a compiled / minified File
  //----------------------------------------------------
  ignore = function(className) {
    ignoredClasses[className] = true;
  };
  
  
  // Running a Javascript Function
  // Can be called multiple times (i.e. repeating scripts)
  //------------------------------------------------------
  run = function(JSsource, callback) {
    include(JSsource, callback, null, true);
  };
  
  
  // Include a new Stylesheet
  //-------------------------
  style = function( link, callback ) {
    link = link.trim();
    
    if (!link.endsWith( '.css' ) && BASE_PATH !== '') { link = BASE_PATH + link + '.css'; }
    if (!CACHE) {
      if (link.indexOf('?') !== -1) { link += '&'; } else { link += '?'; }
      link += 't=' + new Date().getTime();
    }
    
    if ( searchHeadElement('link', {'data-includemodule': link}) ) {
      if (callback) { callback.call(app, null); }
      return;
    }
    
    appendHeadElement('link', {'class': 'style-includemodule', 'data-includemodule': link, 'rel': 'stylesheet', type: 'text/css', 'charset': 'utf-8', href: link});
  };
  
  
  // Remove Class Definition (optionally also imports / plugins)
  //------------------------------------------------------------
  remove = function(dependencies, removeImports, removePlugins) {
    if (!(dependencies instanceof Array)) { dependencies = [dependencies]; }
    if (removeImports === null) { removeImports = true; }
    if (removePlugins === null) { removePlugins = false; }
    
    var script, scriptUID, i, j;
    
    for (i = 0; i < dependencies.length; i++)
    {
      scriptUID = dependencies[i].trim();
      if (ignoredClasses[scriptUID] === true) { continue; }
      
      script = searchHeadElement('script', {'data-includemodule': scriptUID});
      if (script) { script.parentNode.removeChild(script); }
      
      if (!importedClasses[scriptUID]) { continue; }
      
      // remove imports
      if (removeImports && importedClasses[scriptUID].imports)
      {
        for (j = 0; j < importedClasses[scriptUID].imports.length; j++)
        {
          remove(importedClasses[scriptUID].imports[j]);
        }
      }
      
      // remove plugins
      if (removePlugins && importedClasses[scriptUID].plugins)
      {
        for (j = 0; j < importedClasses[scriptUID].plugins.length; j++)
        {
          remove(importedClasses[scriptUID].plugins[j]);
        }
      }
      
      importedClasses[scriptUID] = null;
    }
  };
  
  
  // Require a List of Classes / Scripts
  //------------------------------------
  requires = function(dependencies, callback, failureCallback) {
    if (!(dependencies instanceof Array)) { dependencies = [dependencies]; }
    
    var loadDependency, dependencyNotFound, loaded = -1;
    
    loadDependency = function()
    {
      loaded++;
      if (dependencies[loaded]) { include(dependencies[loaded], loadDependency, dependencyNotFound); }
    };
    
    dependencyNotFound = function()
    {
      if (failureCallback) { failureCallback(dependencies[loaded]); }
      
      if (!importedClasses[dependencies[loaded]]) { importedClasses[dependencies[loaded]] = {}; }
      importedClasses[dependencies[loaded]].ready = true;
      loadDependency();
    };
    
    loadDependency();
    
    // execute Callback dependencies have loaded
    if (callback) { checkRequirements(dependencies, callback); }
  };
  
  
  // Define a Class (see definition above)
  //--------------------------------------
  defineClass = function(definition) {
    if (!importedClasses[definition.className]) { importedClasses[definition.className] = definition; }
    for (var i = 0; i < importedClasses[definition.className].plugins.length; i++) {
      importedClasses[definition.className].imports.push(importedClasses[definition.className].plugins[i]);
    }
    importedClasses[definition.className].loadID = importedClassesCount;
    importedClasses[definition.className].size = definition.imports.length;
    
    if (importedClasses[definition.className].size > 0)
    {
      requires(importedClasses[definition.className].imports);
      //console.log( definition.className + ' needs classes ' + definition.imports );
    }
    
    importedClassesCount++;
    
    checkForClass(definition.className);
  };
  
  
  
  
  
  // Stolen and adopted from CoffeeScript! (inherit from SuperClass)
  //----------------------------------------------------------------
  var __hasProp = Object.prototype.hasOwnProperty;
  
  __extend = function(child, parent) {
    var store = {prototypes: {}, statics: {}}, k;
    for (k in child) { if (k !== 'indexOf') { store.statics[k] = child[k]; } }
    for (k in child.prototype) { if (k !== 'indexOf') { store.prototypes[k] = child.prototype[k]; } }
    
    for (var key in parent) { if (__hasProp.call(parent, key)) { child[key] = parent[key]; } }
    
    function Ctor() { this.constructor = child; this.self = this; }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.__super__ = parent.prototype;
    
    for (k in store.statics) { if (k !== 'indexOf') { child[k] = store.statics[k]; } }
    for (k in store.prototypes) { if (k !== 'indexOf') { child.prototype[k] = store.prototypes[k]; } }
    
    return child;
  };
  
  extendClass = function (childClass, parentClass, callback) {
    var child = importedClasses[childClass].classConstructor;
    var parent = importedClasses[parentClass].classConstructor;
    
    __extend(child, parent);
    
    if (callback) { callback.call(this); }
    
    return child;
  };
  
  
  
  // Check for a specific defined Class
  // When loaded, execute defined Callback function
  //-----------------------------------------------
  checkForClass = function (className)
  {
    function checkForImportedClass()
    {
      var definition = importedClasses[className];
      if (!definition) { return; }
      definition.ready = true;
      
      for (var i = 0; i < definition.size; i++) {
        if (!importedClasses[definition.imports[i]]) {
          definition.ready = false;
        } else {
          if (importedClasses[definition.imports[i]].loadID > definition.loadID) {
            if (importedClasses[definition.imports[i]].ready !== true) { definition.ready = false; }
          }
        }
      }
      
      
      if (definition.ready === true && importedClasses[className] && importedClasses[definition.superClass])
      {
        extendClass(className, definition.superClass);
        gotClass(definition.className);
        if (definition.callback) { definition.callback.call(app, null); }
      }
      else
      {
        window.setTimeout(checkForImportedClass, 10);
      }
    }
    
    checkForImportedClass();
  };
  
  
  
  
  // Check if Class is Ready
  //------------------------
  hasClass = function (className)
  {
    try { if (importedClasses[className].ready === true && importedClasses[importedClasses[className].superClass].ready === true) { return true; } } catch(e) {}
    return false;
  };
  
  
  // Check if all dependencies are loaded correctly!
  //------------------------------------------------
  checkRequirements = function (requirements, callback)
  {
    function checkForRequirements()
    {
      for (var i = 0; i < requirements.length; i++)
      {
        if (hasClass(requirements[i]) === false) { return window.setTimeout(checkForRequirements, 25);
        }
        else {
          if (callback) { callback.call(app, null); }
        }
      }
    }
    
    checkForRequirements();
  };
  
  
  // Array.indexOf for IE
  //----------------
  inArray = function(array, element)
  {
    var i, size = array.length;
    for (i = 0; i < size; i++) {
      if (array[i] === element) {
        return true;
      }
    }
    return false;
  };
  
  
  
  
  
  
  // Include new Javascript Module / Class / Script File
  //----------------------------------------------------
  include = function ( JSsource, success, failure, evaluateData, runFile )
  {
    JSsource = JSsource.trim();
    var scriptUID = JSsource;
    
    var oldScript = searchHeadElement('script', {'data-includemodule': scriptUID});
    
    if (oldScript) {
      if (evaluateData) { oldScript.parentNode.removeChild(oldScript); }
      else if (success) { return success.call(app, null); }
    }
    
    if (ignoredClasses[ scriptUID ] === true)
    {
      if (success) { return success.call(app, null); }
    }
    
    
    var script = appendHeadElement('script', {'class': 'script-includemodule', 'data-includemodule': scriptUID, 'type': 'text/javascript'/*, 'defer': true, 'async': true*/});
    
    if (!runFile) { runFile = true; }
    
    if (!JSsource.endsWith('.js') && BASE_PATH !== '') {
      JSsource = BASE_PATH + JSsource + '.js';
    }
    
    if (!CACHE) {
      if (JSsource.indexOf('?') !== -1) { JSsource += '&'; } else { JSsource += '?'; }
      JSsource += 't=' + new Date().getTime();

    }
    //TODO: this makes errors:
    //JSsource = encodeURI( JSsource );
    
    AJAX( 'GET', JSsource, function(data) {
      if (evaluateData === true) {
        if (runFile) { script.text = data; }
        if (success) { success.call(app, data); }
      } else if ( data.indexOf(' class ') !== -1 ) {
        if (success) { success.call( app, data ); }
        //console.log(scriptUID);
        script.text = parseClass( data );
      } else {
        if (runFile) {
          script.text = data;
          // TODO: crop eventual .js, and base-dir + timestamp if set
          if (data.indexOf(NAME + '.defineClass(') === -1) { gotClass(scriptUID); }
        }
        if (success) { success.call(app, data); }
      }
    }, function(data){
      script.parentNode.removeChild(script);
      if (failure) { failure.call(app, data); }
    });
  };
  
  
  
  // Got Class, all Imports loaded
  //------------------------------
  gotClass = function(qualifiedClassImport) {
    if (!importedClasses[qualifiedClassImport]) { importedClasses[qualifiedClassImport] = {}; }
    importedClasses[qualifiedClassImport].ready = true;
    //try { searchHeadElement('script', {'data-includemodule': qualifiedClassImport}).setAttribute('data-ready', 'true'); } catch(e){}
    //console.log('got class ' + qualifiedClassImport);
  };
  
  // Define Main SuperClass
  //-----------------------
  gotClass('SuperClass');
  importedClasses.SuperClass.classConstructor = SuperClass;
  
  
  
  
  
  
  
  // append a given element type with specified options to head
  appendHeadElement = function(elementType, options) {
    var headElement = document.createElement(elementType);
    for (var k in options) {
      if (k !== 'indexOf') { headElement.setAttribute(k, options[k]); }
    }
    document.getElementsByTagName('head').item(0).appendChild( headElement );
    
    return headElement;
  };
  
  
  // search for element with given type & options in head
  searchHeadElement = function(elementType, options) {
    var items = document.getElementsByTagName( elementType );
    var isValid = false;
    var option;
    
    for (var i = 0; i < items.length; i++) {
      isValid = true;
      for (var k in options) {
        if (k !== 'indexOf') {
          option = items[i].getAttribute(k);
          if (!option || option.toString() !== options[k].toString()) { isValid = false; }
        }
      }
      if (isValid === true) { return items[i]; }
    }
    
    return false;
  };
  
  
  
  
  // Cross-Browser-Ajax
  AJAX = function( type, source, success, failure ) {
    var req = false;
    
    // get new Ajax Request
    if (window.XMLHttpRequest && !(window.ActiveXObject)) { try { req = new XMLHttpRequest(); } catch(e) { req = false; } }
    else if (window.ActiveXObject) {
      try { req = new window.ActiveXObject("Msxml2.XMLHTTP"); }
      catch(e2) {
        try { req = new window.ActiveXObject("Microsoft.XMLHTTP"); }
        catch(e3) { req = false; }
      }
    }
    
    
    if (!req) {
      failure("Your Browser does not Support Ajax Requests");
      return false;
    }
    
    
    req.onreadystatechange = function() {
      // only if req shows "loaded"
      if (req.readyState.toString() === '4') {
        // only if "OK"
        if (req.status.toString() === '200' || req.status.toString() === '0') { success( req.responseText ); }
        else { failure("There was a problem retrieving the XML data:\n" + req.statusText); }
        
        req = null;
        //delete req;
      }
    };
    
    req.open( type, source, true );
    req.send();
  };
  
  
  parseClass = function( data )
  {
    if (!(data instanceof Array)) { data = [data]; }
    
    var output = '';
    for (var i = 0; i < data.length; i++) { output += internalParse( data[i] ); }
    return output;
  };
  
  
  internalParse = function( data )
  {
    var parser = new ClassParser( data );
    return parser.parse();
  };
  
  
  
  if (!(window.console) || !(window.console.log)) {
    window.console = {};
    window.console.log = function () {};
  }
  
  // check if native implementation available
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(){
      var fn = this, args = Array.prototype.slice.call(arguments), object = args.shift();
      return function(){
        return fn.apply(object, args.concat(Array.prototype.slice.call(arguments)));
      };
    };
  }
  
  
  // prototypes for app-Class
  String.prototype.trim = function() {
    var str = this.replace(/^\s\s*/, ''),
      ws = /\s/,
      i = str.length;
    do { i--; } while (ws.test(str.charAt(i)));
    return str.slice(0, i + 1);
  };
  
  String.prototype.endsWith = function( str ) {
    return (this.substring( this.length - str.length ) === str);
  };
  
  
  
  // LOAD STARTUP SCRIPT
  if (document)
  {
    var scripts = (document.getElementsByTagName('script'));
    var mainScript = null, cache, minify, dir;
    
    for (var i = 0; i < scripts.length; i++)
    {
      cache = scripts[i].getAttribute('data-cache');
      minify = scripts[i].getAttribute('data-minify');
      dir = scripts[i].getAttribute('data-dir');
      if (cache && cache.toString().toLowerCase() === 'true') { CACHE = true; }
      if (minify && minify.toString().toLowerCase() === 'true') { MINIFY_JS = true; }
      if (dir) { BASE_PATH = scripts[i].getAttribute('data-dir'); }
      
      if (scripts[i].getAttribute('data-main'))
      {
        mainScript = scripts[i].getAttribute('data-main');
        if (scripts[i].getAttribute('data-dir')) { BASE_PATH = scripts[i].getAttribute('data-dir'); }
        else { BASE_PATH = mainScript.substring( 0, mainScript.lastIndexOf('/') + 1 ); }
        if ((mainScript.substring( mainScript.length - 3 ) !== '.js') && (mainScript.indexOf(BASE_PATH) === 0)) { mainScript = mainScript.substring(BASE_PATH.length); }
      }
    }
    
    if (mainScript) { requires(mainScript); }
  }
  

  var exports = {
    VERSION: VERSION
  , NAME: NAME
  , MINIFY_JS: MINIFY_JS
  , CACHE: CACHE
  , BASE_PATH: BASE_PATH

  , Class: Class
  
  , ignore: ignore
  , remove: remove

  , js: requires
  , require: requires
  , requires: requires

  , css: style
  , style: style

  , run: run
  , include: include

  , extendClass: extendClass
  , __extend: __extend
  , hasClass: hasClass
  , defineClass: defineClass
  , parseClass: parseClass
  , parse: parseClass
  };

  return exports;
  
})(window);