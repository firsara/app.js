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