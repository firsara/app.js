/*!
 * app.js Javascript Library v0.9
 *
 * Copyright (c) 2011 Fabian Irsara
 * Licensed under the GPL Version 2 licenses.
 * 
 * Provides prototypal inheritence of self-defined Classes
 * Parsing Classes
 * Requiring, extending Classes
 * including Plugins and Stylesheets Dynamically
 */

var app = (function (self, window) {
	"use strict";
	
	self.VERSION = 0.9;
	self.NAME = 'app';
	
	self.MINIFY_JS = false;
	self.CACHE = false;
	self.BASE_PATH = '';
	self.DEFINES_CLASSES = true;
	
	var ignoredClasses = [];
	var importedClasses = {};
	var importedClassesCount = 0;
	
	
	var SuperClass = function () {
		this.self = this;
		this.priv = {};
	};
	
	
	// Private Functions
	var AJAX, include, searchHeadElement, appendHeadElement, checkRequirements, inArray, checkForClass, gotClass, internalParse;
	
	
	
	
	
	// Abstract Class Definition
	//--------------------------
	self.Class = function(classOptions) {
		this.className        = '';
		this.classConstructor = null;
		this.superClass       = 'Class';
		this.imports          = [];
		this.plugins          = [];
		this.callback         = null;
		this.skipImports      = false;
		
		for (var k in classOptions)
		{
			if (k !== 'indexOf') { this[k] = classOptions[k]; }
		}
	};
	
	
	// Ignore Class-File from Import / Removement
	// Used when Classes are in a compiled / minified File
	//----------------------------------------------------
	self.ignore = function(className) {
		ignoredClasses[className] = true;
	};
	
	
	// Running a Javascript Function
	// Can be called multiple times (i.e. repeating scripts)
	//------------------------------------------------------
	self.run = function( JSsource, callback ) { include( JSsource, callback, null, true ); };
	
	
	// Include a new Stylesheet
	//-------------------------
	self.style = function( CSSSource, callback ) {
		CSSSource = CSSSource.trim();
		var styleUID = CSSSource;
		
		if (!CSSSource.endsWith( '.css' ) && self.BASE_PATH !== '') { CSSSource = self.BASE_PATH + CSSSource + '.css'; }
		if (!self.CACHE) {
			if (CSSSource.indexOf('?') !== -1) { CSSSource += '&'; } else { CSSSource += '?'; }
			CSSSource += 't=' + new Date().getTime();
		}
		
		if ( searchHeadElement('link', {'data-includemodule': styleUID}) ) {
			if (callback) { callback.call(self, null); }
			return;
		}
		
		appendHeadElement('link', {'class': 'style-includemodule', 'data-includemodule': styleUID, 'rel': 'stylesheet', type: 'text/css', 'charset': 'utf-8', href: CSSSource});
	};
	
	
	// Remove Class Definition (optionally also imports / plugins)
	//------------------------------------------------------------
	self.remove = function(dependencies, removeImports, removePlugins) {
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
					self.remove(importedClasses[scriptUID].imports[j]);
				}
			}
			
			// remove plugins
			if (removePlugins && importedClasses[scriptUID].plugins)
			{
				for (j = 0; j < importedClasses[scriptUID].plugins.length; j++)
				{
					self.remove(importedClasses[scriptUID].plugins[j]);
				}
			}
			
			importedClasses[scriptUID] = null;
		}
	};
	
	
	// Require a List of Classes / Scripts
	//------------------------------------
	self.requires = function(dependencies, callback, failureCallback) {
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
	self.defineClass = function(definition) {
		if (!importedClasses[definition.className]) { importedClasses[definition.className] = definition; }
		for (var i = 0; i < importedClasses[definition.className].plugins.length; i++) {
			importedClasses[definition.className].imports.push(importedClasses[definition.className].plugins[i]);
		}
		importedClasses[definition.className].loadID = importedClassesCount;
		importedClasses[definition.className].size = definition.imports.length;
		
		if (importedClasses[definition.className].skipImports === true)
		{
			self.ignore(definition.className);
		}
		
		if (importedClasses[definition.className].size > 0)
		{
			self.requires(importedClasses[definition.className].imports);
			//console.log( definition.className + ' needs classes ' + definition.imports );
		}
		
		importedClassesCount++;
		
		checkForClass(definition.className);
	};
	
	
	
	
	
	// Stolen from CoffeeScript! (inherit from SuperClass)
	//----------------------------------------------------
	var __hasProp = Object.prototype.hasOwnProperty;
	
	self.__extend = function(child, parent) {
  	var store = {prototypes: {}, statics: {}}, k;
  	for (k in child) store.statics[k] = child[k];
  	for (k in child.prototype) store.prototypes[k] = child.prototype[k];
		
		for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
		
		function Ctor() { this.constructor = child; this.self = this; }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.__super__ = parent.prototype;
    
  	for (k in store.statics) child[k] = store.statics[k];
  	for (k in store.prototypes) child.prototype[k] = store.prototypes[k];
  	
  	return child;
	};
	
  self.extendClass = function (childClass, parentClass, callback) {
  	
		var child = importedClasses[childClass].classConstructor;
		var parent = importedClasses[parentClass].classConstructor;
		
		self.__extend(child, parent);
		
    child.__extend__ = function(instance, arg) {
    	child.__super__.constructor.apply(instance, arg);
    };
    
    if (callback) callback.call(this);
    
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
				self.extendClass(className, definition.superClass);
				gotClass(definition.className);
				if (definition.callback) { definition.callback.call(self, null); }
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
	self.hasClass = function (className)
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
				if (self.hasClass(requirements[i]) === false) { return window.setTimeout(checkForRequirements, 25);
				}
				else {
					if (callback) { callback.call(self, null); }
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
	include = self.include = function ( JSsource, success, failure, evaluateData, runFile )
	{
		JSsource = JSsource.trim();
		var scriptUID = JSsource;
		
		var oldScript = searchHeadElement('script', {'data-includemodule': scriptUID});
		
		if (oldScript) {
			if (evaluateData) { oldScript.parentNode.removeChild(oldScript); }
			else if (success) { return success.call(self, null); }
		}
		
		if (ignoredClasses[ scriptUID ] === true)
		{
			if (success) { return success.call(self, null); }
		}
		
		
		var script = appendHeadElement('script', {'class': 'script-includemodule', 'data-includemodule': scriptUID, 'type': 'text/javascript'/*, 'defer': true, 'async': true*/});
		
		if (!runFile) { runFile = true; }
		
		if (!JSsource.endsWith('.js') && self.BASE_PATH !== '') {
			JSsource = self.BASE_PATH + JSsource + '.js';
		}
		
		if (!self.CACHE) {
			if (JSsource.indexOf('?') !== -1) { JSsource += '&'; } else { JSsource += '?'; }
			JSsource += 't=' + new Date().getTime();

		}
		//TODO: this makes errors:
		//JSsource = encodeURI( JSsource );
		
		AJAX( 'GET', JSsource, function(data) {
			if (evaluateData === true) {
				if (runFile) { script.text = data; }
				if (success) { success.call(self, data); }
			} else if ( data.indexOf(' class ') !== -1 ) {
				if (success) { success.call( self, data ); }
				console.log(scriptUID);
				script.text = self.parseClass( data );
			} else {
				if (runFile) {
					script.text = data;
					// TODO: crop eventual .js, and base-dir + timestamp if set
					if (data.indexOf(self.NAME + '.defineClass(') === -1) { gotClass(scriptUID); }
				}
				if (success) { success.call(self, data); }
			}
		}, function(data){
			script.parentNode.removeChild(script);
			if (failure) { failure.call(self, data); }
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
	
	
	
	
	
	/*
	 * Parsing JSClass-File
	 * 
	 * Features:
	 * 
	 * // Set Class Package
	 * 
	 *  - #package net;
	 * 
	 * // Import Another Class
	 * 
	 *  - #import net.URLHandler;
	 *    
	 * 
	 * 
	 * // Include another Script without parsing, i.e. Plugins
	 * 
	 *  - #include js/otherscript.js;
	 *    
	 * 
	 * 
	 * // Include a Stylesheet dynamically when needed
	 * 
	 *  - #style css/stylesheet.css;
	 *    
	 * 
	 * 
	 * // Don't Require qualified Class Name for "extend" and "new" Statements
	 * 
	 *  - #use net.URLHandler;
	 *    
	 * 
	 * 
	 * // Define Class Name,
	 * // Optionally extending another Class by Using Qualified-Name (e.g. extends events.Dispatcher)
	 * // Optionally setting Class to "static" (means that it gets self executed and defines an instance, i.e. Main.instance = new Main();)
	 * // Constructor Function has to have same name as Class
	 * 
	 *  - public °static° class *ClassName* °extends *OtherClass*°
	 * 
	 * 
	 * 
	 * // Define Variable (either "private", "public" or "public static") or const
	 * // NOTE: must end with a semicolon!
	 * // NOTE: can only be accessed with this.*varName*
	 * 
	 *  - public var *varName* °=*value*°;
	 *  - private var *varName* °=*value*°;
	 *  - public static var *varName* °=*value*°;
	 * 
	 * 
	 * 
	 * // Define Variable (either "private", "public" or "public static")
	 * // NOTE: can only be accessed with this.*functionName*
	 * 
	 *  - public function *functionName*(*args*)
	 *  - private function *functionName*(*args*)
	 *  - public static function *functionName*(*args*)
	 * 
	 * 
	 * 
	 * // Call Super Constructor or Super Statement
	 * // NOTE: Functions get overridden! (means you cannot access its overridden super-Function)
	 * 
	 *  - super(); // call Super Constructor!
	 *  - super.addEventListener(... // call Function from Super-Class, that was not overridden! (optionally: self.addEventListener(...
	 * 
	 * 
	 * 
	 * NOTES:
	 * 
	 * 
	 * TODO:
	 * 
	 * - Statics Require Qualified Class Name in Front or specific Keyword like self::*Function*
	 * - Include a System to inherit overridden Functions and call them from instance-Object
	 * 
	 * - Check for parsing errors?
	 * 
	 */
	
	
	self.parseClass = self.parse = function( data )
	{
		if (!(data instanceof Array)) { data = [data]; }
		
		var output = '';
		for (var i = 0; i < data.length; i++) { output += internalParse( data[i] ); }
		return output;
	};
	
	
	
	
	var ClassParser = function(str)
	{
		this.string = str;
		
		
		// Head Definitions;

		this.pkg = null; // Package
		this.imports = []; // Class Imports
		this.includes = []; // Plugin Includes
		this.styles = []; // Stylesheet Imports
		
		
		// Functions and Vars
		this.constructorFct = null; // Constructor Function
		this.className = null; // Class Name (i.e.: URLHandler)
		this.superClass = null; // Class' Super-Class
		this.qualifiedClassName = null; // Qualified Class Name (i.e.: net.URLHandler)
		
		this.publicFct = []; // Public Functions
		this.privateFct = []; // Private Functions
		this.privateVar = []; // Private Vars
		this.publicVar = []; // Public Vars
		this.superVar = []; // Super Public Variables
		
		this.publicStaticFct = []; // Public Static Functions
		this.publicStaticVar = []; // Public Static Vars
		this.privateStaticFct = []; // Private Static Functions
		this.privateStaticVar = []; // Private Static Vars
		
		
		
		// remove single line comments
		this.string = this.string.replace( /([\/]{2}[^\n]*)|([\n]{1,}[\/]{2}[^\n]*)/g, '' );
		
		// remove multiline comments
		this.string = this.string.replace(/\/\*([\s\S]*?)\*\//g, '');
		
		// correct static statements
		this.string = this.string.replace(/static public/g, 'public static');
		this.string = this.string.replace(/static private/g, 'private static');
		
		// remove "const" due to problems in older browsers
		this.string = this.string.replace(/const /g, 'var ');
		
		
		
		
		var i;
		this.isStaticClass = (this.string.indexOf('public static class') >= 0),
		this.hasSuperClass = (this.string.indexOf(' extends ') >= 0),
		this.hasPackage = (this.string.indexOf('package ') >= 0);
		
		
		var targetClassType = (this.isStaticClass === true ? 'public static class' : 'public class');
		
		
		
		// Fetching Class Package
		//-----------------------
		this.pkg = this.fetchResource('#package');
		
		
		// Fetch Imports
		while (this.string.indexOf('#import') >= 0) { this.imports.push( this.fetchResource('#import').replace(/\./g, '/') ); }
		while (this.string.indexOf('#include') >= 0) { this.includes.push( this.fetchResource('#include') ); }
		while (this.string.indexOf('#style') >= 0) { this.styles.push( this.fetchResource('#style') ); }
		
		// fetching  > use *Namespace* <  directives
		// automatically inserts namespace in  > new *ClassName* <  where needed
		var useClass = '';
		var resource = '';
		
		while (this.string.indexOf('#use') >= 0) {
			resource = this.fetchResource('#use');
			useClass = resource.substring( resource.lastIndexOf('.') );
			this.string = this.string.replace( new RegExp("new?" + useClass, "g"), 'new ' + resource);
			this.string = this.string.replace( new RegExp('extends?' + useClass, "g"), 'extends ' + resource);
		}
		
		
		// Trimming to actual Class Body
		this.string = this.string.trim();
		
		
		
		// Fetching Class Name / Qualified Class Name and Superclass
		//----------------------------------------------------------
		this.className = this.string.substring( 0, this.string.indexOf( (this.hasSuperClass ? 'extends' : '{')) ).replace(targetClassType, '').trim().replace(/\n/g, '');
		this.superClass = this.string.substring( this.string.indexOf('extends') , this.string.indexOf('{') ).replace('extends', '').trim();
		this.qualifiedClassName = (this.hasPackage ? (this.pkg+'.'+this.className) : this.className);
		
		if (!this.hasSuperClass) { this.superClass = 'SuperClass'; }
		
		
		this.string = this.string.substring(this.string.indexOf('{') + 1, this.string.lastIndexOf('}'));
		
		
		// Fetching Constructor Function
		//------------------------------
		this.constructorFct = this.parseFunction('public', this.className);
		var forceSuperConstructor = (this.constructorFct.found === true && this.hasSuperClass === true);
		
		
		// Fetch Statics
		//--------------
		while (this.string.indexOf('public static var ') >= 0)        { this.publicStaticVar.push( this.parseVar('public static') ); }
		while (this.string.indexOf('public static function ') >= 0)   { this.publicStaticFct.push( this.parseFunction('public static') ); }
		
		while (this.string.indexOf('private static var ') >= 0)       { this.privateStaticVar.push( this.parseVar('private static') ); }
		while (this.string.indexOf('private static function ') >= 0)  { this.privateStaticFct.push( this.parseFunction('private static') ); }
		
		
		// Fetch Vars
		//-----------
		while (this.string.indexOf('public var ') >= 0)  { this.publicVar.push( this.parseVar('public') ); }
		while (this.string.indexOf('private var ') >= 0) { this.privateVar.push( this.parseVar('private') ); }
		while (this.string.indexOf('super var ') >= 0)   { this.superVar.push( this.parseVar('super') ); }
		
		
		// Fetch Functions
		//----------------
		while (this.string.indexOf('public function ') >= 0)  { this.publicFct.push( this.parseFunction('public') ); }
		while (this.string.indexOf('private function ') >= 0) { this.privateFct.push( this.parseFunction('private') ); }
		
		
		
		// Data should be Empty now
		this.string = this.string.trim().replace(/\n/g, '');
		if (this.string !== '')
		{
			throw new Error('Error while parsing Class  > ' + this.qualifiedClassName + ' <');
		}
		
		return this;
	};
	
	ClassParser.prototype.toString = function() { return this.string; };
	ClassParser.prototype.valueOf = function() { return this.string; };
	
	
	ClassParser.prototype.parseFunction = function(type, name)
	{
		var fct = {};
		fct.body = '';
		fct.args = '';
		fct.name = '';
		fct.str = '';
		fct.found = false;
		
		var functionType = type + ' function';
		var functionStartIndex = this.string.indexOf( functionType + (name ? ' ' + name : '' ));
		
		// no function found
		if (functionStartIndex === -1) return fct;
		
		var functionBody = this.string.substring( functionStartIndex );
		
		var nextPublicIndex = functionBody.substring(20).indexOf( 'public ' ) + 20; // jump over ">public< function" -> search argument
		var nextPrivateIndex = functionBody.substring(20).indexOf( 'private ' ) + 20; // jump over ">private< function" -> search argument
		var nextStaticIndex = functionBody.substring(20).indexOf( 'static ' ) + 20; // jump over ">static< function" -> search argument
		if (nextPublicIndex <= 20) { nextPublicIndex = (Number.MAX_VALUE || Math.pow( 2, 50 )); }
		if (nextPrivateIndex <= 20) { nextPrivateIndex = (Number.MAX_VALUE || Math.pow( 2, 50 )); }
		if (nextStaticIndex <= 20) { nextStaticIndex = (Number.MAX_VALUE || Math.pow( 2, 50 )); }
		
		var functionEndIndex = Math.min(nextPublicIndex, nextPrivateIndex, nextStaticIndex, (functionBody.lastIndexOf('}') + 1));
		
		functionBody = functionBody.substring(0, functionEndIndex);
		
		fct.str = functionBody;
		fct.args = functionBody.substring( functionBody.indexOf( '(' ) + 1, functionBody.indexOf( ')' ) ).trim();
		fct.body = functionBody.substring( functionBody.indexOf( '{') + 1, functionBody.lastIndexOf('}') );
		fct.name = functionBody.substring(0, functionBody.indexOf('(')).replace(functionType, '').trim();
		fct.found = true;
		
		this.string = this.string.replace(fct.str, '');
		
		return fct;
	};
	
	ClassParser.prototype.parseVar = function(type, name)
	{
		var v = {};
		v.value = '';
		v.name = '';
		v.str = '';
		v.found = false;
		
		var varType = type + ' var';
		
		var varStartIndex = this.string.indexOf( varType + (name ? ' ' + name : '' ));
		var varSubstr = this.string.substring(varStartIndex);
		var varEndIndex = varSubstr.indexOf(';') + 1;
		
		// no var found
		if (varStartIndex === -1) return v;
		
		var varStr = varSubstr.substring( 0, varEndIndex );
		var hasValue = varStr.indexOf('=') !== -1;
		
		
		v.str = varStr;
		v.name = ( hasValue === false ? varStr : varStr.substring(0, varStr.indexOf('=')) ).replace('=', '').replace(';', '').replace(varType, '').trim();
		v.value = ( hasValue === false ? '' : varStr.substring(varStr.indexOf('=')) ).replace('=', '').replace(';', '').trim();
		v.found = true;
		
		if (v.value === '') v.value = 'null';
		
		this.string = this.string.replace(v.str, '');
		
		return v;
	};
	
	ClassParser.prototype.fetchResource = function(type)
	{
		var index = this.string.indexOf( type );
		if (index === -1) return '';
		
		var resource = this.string.substring( index );
		resource = resource.substring( 0, resource.indexOf(';') + 1 );
		this.string = this.string.replace(resource, '');
		
		return resource.replace(type, '').replace(';', '').replace(/\'/g, '').replace(/\"/g, '').trim();
	};
	
	
	internalParse = function( data )
	{
		// Pre-Replace "$"-Sign to match "$" in Regular Expressions
		data = data.replace(new RegExp("\\$", "g"), "__DOLLAR__");
		//data = data.replace(/private/g, 'public');
		
		var i, j, classBody = '';
		var parser = new ClassParser( data );
		
		var privates = parser.privateVar.concat(parser.privateFct);
		var publics = parser.publicVar.concat(parser.publicFct);
		var classImports = [];
		var classIncludes = [];
		
		for (i = 0; i < parser.imports.length; i++) { classImports.push("'" + parser.imports[i].replace(/\./g, '/') + "'"); }
		for (i = 0; i < parser.includes.length; i++) { classImports.push("'" + parser.includes[i] + "'"); }
		
		
		// Append Package / Class Definition
		// e.g.: if (!net) var net = {};
		//       if (!net.URLHandler) net.URLHandler = function(*args*) { *body* }
		//----------------------------------
		if (parser.pkg !== '')
		{
			// splitting package definition by dot
			var subPackages = parser.pkg.split( '.' );
			var actualPackage = '';
			
			for (i = 0; i < subPackages.length; i++)
			{
				if (i !== 0) { actualPackage += '.'; }
				actualPackage += subPackages[i];
				classBody += "if (!"+actualPackage+") "+(i === 0 ? "var " : "")+actualPackage+" = {};\n";
			}
			classBody += "\n" + parser.pkg + '.';
		}
		else
		{
			classBody += 'var ';
		}
		
		classBody += parser.className + " = (function () {";
			classBody += '"use strict";';
			
			// Private Static Functions
			for (i = 0; i < parser.privateStaticFct.length; i++)
			{
				classBody += 'var ' + parser.privateStaticFct[i].name + ' = function(' + parser.privateStaticFct[i].args + ') {';
					classBody += parser.privateStaticFct[i].body;
				classBody += '};';
			}
			
			// Private Static Vars
			for (i = 0; i < parser.privateStaticVar.length; i++)
			{
				classBody += 'var ' + parser.privateStaticVar[i].name + ' = ' + parser.privateStaticVar[i].value + ';';
			}
			
			
			// Public Variables
			for (i = 0; i < parser.publicVar.length; i++)
			{
				if (parser.publicVar[i].value !== 'null') {
					classBody += parser.className + '.prototype.' + parser.publicVar[i].name + ' = ' + parser.publicVar[i].value + ';';
				}
			}
			
			
			// Constructor
			classBody += 'function ' + parser.className + '('+parser.constructorFct.args+') {';
				//classBody += parser.className + '.__extend__(this, arguments);';
				classBody += parser.className + '.__super__.constructor.apply(this, arguments);';
				classBody += 'var self = this.self;';
				classBody += 'var priv = self.priv;';
				if (parser.isStaticClass) { classBody += parser.className + ".instance = this;"; }
				
				// Private Variables
				for (i = 0; i < parser.privateVar.length; i++)
				{
					classBody += 'priv.' + parser.privateVar[i].name + ' = ' + parser.privateVar[i].value + ';';
				}
				
				// Public Variables
				for (i = 0; i < parser.publicVar.length; i++)
				{
					//classBody += 'this.' + parser.publicVar[i].name + ' = ' + parser.publicVar[i].value + ';';
				}
			
				

				// Private Functions
				for (i = 0; i < parser.privateFct.length; i++)
				{
					// Correcting Private var and Function Calls
					//for (j = 0; j < privates.length; j++) {
						//parser.privateFct[i].body = parser.privateFct[i].body.replace(new RegExp('this.' + privates[j].name, 'g'), 'priv.' + privates[j].name);
					//}
					
					classBody += 'priv.' + parser.privateFct[i].name + ' = function('+parser.privateFct[i].args+') {';
						classBody += parser.privateFct[i].body;
						//classBody += 'return this;';
					classBody += '};'
				}
				
				// Correcting Private var and Function Calls
				for (j = 0; j < privates.length; j++) {
					//parser.constructorFct.body = parser.constructorFct.body.replace(new RegExp('this.' + privates[j].name, 'g'), 'priv.' + privates[j].name);
				}
				
				
				// CONSTRUCTOR
				classBody += parser.constructorFct.body;
			
				classBody += 'return this;';
			classBody += '}';
			
			
			// Create Prototypes after Extending Class
			//classBody += parser.className + '.createPrototypes = function() {';
				
				//classBody += 'console.log("prototypes: '+parser.qualifiedClassName+'");';
				
				
				// Public Prototype Functions
				for (i = 0; i < parser.publicFct.length; i++)
				{
					// Correcting Private var and Function Calls
					for (j = 0; j < privates.length; j++) {
						//parser.publicFct[i].body = parser.publicFct[i].body.replace(new RegExp('this.' + privates[j].name, 'g'), 'this.priv.' + privates[j].name);
					}
					
					classBody += parser.className + '.prototype.' + parser.publicFct[i].name + ' = function('+parser.publicFct[i].args+'){';
						classBody += 'var self = this.self;';
						classBody += 'var priv = this.priv;';
						classBody += parser.publicFct[i].body;
						//classBody += 'return this;';
					classBody += '};';
				}
				
				// Public Static Vars
				for (i = 0; i < parser.publicStaticVar.length; i++)
				{
					classBody += parser.className + '.' + parser.publicStaticVar[i].name + ' = ' + parser.publicStaticVar[i].value + ';';
				}
				
				// Public Static Functions
				for (i = 0; i < parser.publicStaticFct.length; i++)
				{
					classBody += parser.className + '.' + parser.publicStaticFct[i].name + ' = function('+parser.publicStaticFct[i].args+'){';
						classBody += parser.publicStaticFct[i].body;
						//classBody += 'return '+parser.className+';';
					classBody += '};';
				}
				
				
			// ENDOF Create Prototypes after Extending Class
			//classBody += '};';
			
			// Correcting Private var and Function Calls
			//for (i = 0; i < privates.length; i++) {
				//classBody = classBody.replace(new RegExp('this.' + privates[i].name, 'g'), 'priv.' + privates[i].name);
			//}
			
			classBody = classBody.replace(/\s\(/g, '(');
			classBody = classBody.replace(/\(\s\)/g, '()');
			
			for (i = 0; i < parser.publicFct.length; i++)
			{
				classBody = classBody.replace(new RegExp('this.' + parser.publicFct[i].name + "\\(", 'g'), 'self.' + parser.publicFct[i].name + '.call(self,');
				
				// NOTE: Non-Direct Function calls... (e.g. in setInterval calls)
				classBody = classBody.replace(new RegExp("\\b" + 'this.' + parser.publicFct[i].name + "\\b", 'g'), 'self.' + parser.publicFct[i].name + '.bind(self)');
			}
			
			
			for (i = 0; i < parser.superVar.length; i++)
			{
				classBody = classBody.replace(new RegExp('super.' + parser.superVar[i].name, 'g'), 'self.' + parser.superVar[i].name);
			}
			
			for (i = 0; i < parser.publicVar.length; i++)
			{
				classBody = classBody.replace(new RegExp('this.' + parser.publicVar[i].name, 'g'), 'self.' + parser.publicVar[i].name);
			}
			
			
			for (i = 0; i < privates.length; i++)
			{
				classBody = classBody.replace(new RegExp('this.' + privates[i].name, 'g'), 'self.priv.' + privates[i].name);
			}
			
			
			// fetching styles
			for (i = 0; i < parser.styles.length; i++) { classBody += self.NAME + ".style('"+parser.styles[i]+"');"; }
			
			// Append app-Class-Definition
			//----------------------------
			classBody += self.NAME + ".defineClass({";
				classBody += "className: '"+parser.qualifiedClassName.replace(/\./g, '/')+"'";
				classBody += ", classConstructor: "+parser.className;
				classBody += ", superClass: '"+parser.superClass.replace(/\./g, '/')+"'";
				classBody += ", imports: ["+classImports.join(', ')+"]";
				classBody += ", plugins: ["+classIncludes.join(', ')+"]";
				if (!self.DEFINES_CLASSES) { classBody += ", skipImports: true"; }
				if (parser.isStaticClass) { classBody += ",callback: function(){ new " + parser.className + "(); }"; }
				//classBody += ",prototypes: "+parser.className +".createPrototypes";
			classBody += "});\n";
			
			
			// Return Class Function Object
			classBody += 'return ' + parser.className + ';';
			
		classBody += '})();';
		
		
		// Check if has Super-Statement (Constructor)
		//-------------------------------------------
		classBody = classBody.replace(/super\s\(/g, 'super(');
		classBody = classBody.replace(/super\(\s\)/g, 'super()');
		classBody = classBody.replace(/super\(\);/g, '');
		
		classBody = classBody.replace(/parent\./g, 'super.');
		classBody = classBody.replace(/super\./g, parser.className + ".__super__.");
		
		// TODO: super-variable calls don't need *Class*.__super__.varName
		//classBody = classBody.replace(/(__super__\.)+([\s\S]*?\.)/g, '$&TEST.');
		
		// TODO: insert .call( $1 = first match, $2 = second match, $& = complete matched string ( all: from groups: () );
		classBody = classBody.replace(/(__super__\.)+([\s\S]*?\()/g, '$&.call(self,');
		
		classBody = classBody.replace(/apply\(.call\(self,/g, 'apply(');
		classBody = classBody.replace(/\(\.call\(self/g, '.call(self');
		classBody = classBody.replace(/function\.call\(self,/g, 'function(');
		classBody = classBody.replace(/for\.call\(self,/g, 'for (');
		
		
		classBody = classBody.replace(/self,\)/g, 'self)');
		
		classBody = classBody.replace(/__DOLLAR__/g, '$');
		
		// Reserved Words
		classBody = classBody.replace(/dispatchEvent/g, 'triggerEvent');
		classBody = classBody.replace(/addEventListener/g, 'signalConnect');
		classBody = classBody.replace(/removeEventListener/g, 'unconnectSignal');
		
		
		// NOTE: Forcing Strict Equality!!
		classBody = classBody.replace(/==/g, '===');
		classBody = classBody.replace(/====/g, '===');
		classBody = classBody.replace(/====/g, '===');
		classBody = classBody.replace(/!=/g, '!==');
		classBody = classBody.replace(/!===/g, '!==');
		classBody = classBody.replace(/!===/g, '!==');
		
		
		
		// Minify Script!
		// Add Semicolons at the end of each Function definition
		// to ensure no JS-Errors when running the minified Script
		// Remove Whitespace and eventual double semicolons!
		if (self.MINIFY_JS) {
			classBody = classBody.replace(/function /g, ';function ');
			classBody = classBody.replace(/\n|\t/g, '');
			while (classBody.indexOf(';;') >= 0) { classBody = classBody.replace(/;;/g, ';'); }
		} else {
			try { classBody = js_beautify(classBody,{'indent_size': 2, 'indent_char': ' ', 'preserve_newlines': false}); } catch(e){}
		}
		
		return classBody;
	};
	
	
	
	if (!(window.console) || !(window.console.log)) {
		window.console = {};
		window.console.log = function () {};
	}
	
	if (!Function.prototype.bind) { // check if native implementation available
	  Function.prototype.bind = function(){ 
	    var fn = this, args = Array.prototype.slice.call(arguments),
	        object = args.shift(); 
	    return function(){ 
	      return fn.apply(object, 
	        args.concat(Array.prototype.slice.call(arguments))); 
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
	
	var scripts = (document.getElementsByTagName('script'));
	var mainScript = null, cache, minify, dir;
	
	for (var i = 0; i < scripts.length; i++)
	{
		cache = scripts[i].getAttribute('data-cache');
		minify = scripts[i].getAttribute('data-minify');
		dir = scripts[i].getAttribute('data-dir');
		if (cache && cache.toString().toLowerCase() === 'true') { self.CACHE = true; }
		if (minify && minify.toString().toLowerCase() === 'true') { self.MINIFY_JS = true; }
		if (dir) { self.BASE_PATH = scripts[i].getAttribute('data-dir'); }
		
		if (scripts[i].getAttribute('data-main'))
		{
			mainScript = scripts[i].getAttribute('data-main');
			if (scripts[i].getAttribute('data-dir')) { self.BASE_PATH = scripts[i].getAttribute('data-dir'); }
			else { self.BASE_PATH = mainScript.substring( 0, mainScript.lastIndexOf('/') + 1 ); }
			if ((mainScript.substring( mainScript.length - 3 ) !== '.js') && (mainScript.indexOf(self.BASE_PATH) === 0)) { mainScript = mainScript.substring(self.BASE_PATH.length); }
		}
	}
	
	if (mainScript) { self.requires(mainScript); }
	

	return self;
	
	
}({}, window));