var fs = require('fs');

var core = fs.readFileSync(__dirname + '/lib/app.core.js').toString();
var parser = fs.readFileSync(__dirname + '/lib/app.classparser.js').toString();
var exporter = fs.readFileSync(__dirname + '/lib/app.node.js').toString();
var source = core + parser + exporter;

fs.writeFile(__dirname + '/dist/app.js', source);


// Minify output

var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var orig_code = source;
var ast = jsp.parse(orig_code); // parse code and get the initial AST
ast = pro.ast_mangle(ast); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
var minified = pro.gen_code(ast); // compressed code here


fs.writeFile(__dirname + '/dist/app.min.js', minified);