
if (! window)
{
  var window = (function(){
    return this;
  })();
}


var app, ClassParser;

//@codekit-prepend 'app.core.js';
//@codekit-prepend 'app.classparser.js';

if (module)
{
  module.exports = {
    app: app
  , parser: ClassParser
  }
}