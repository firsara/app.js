var fs = require('fs');

var core = fs.readFileSync(__dirname + '/lib/app.core.js').toString();
var parser = fs.readFileSync(__dirname + '/lib/app.classparser.js').toString();
var exporter = fs.readFileSync(__dirname + '/lib/app.node.js').toString();


fs.writeFileSync(__dirname + '/dist/app.js', core + parser + exporter);
