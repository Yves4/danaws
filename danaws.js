'use strict';
// See also: https://www.tutorialspoint.com/socket.io/socket.io_chat_application.htm

// Setup webserver
const PORT = process.env.PORT || 80;
var http = require('http');
var fs = require('fs');
var finalhandler = require('finalhandler')
var serveStatic = require('serve-static')

// Serve up public folder
var serve = serveStatic('public', {'index': ['index.html', 'index.htm']})

// Loading the index file .html displayed to the client
var server = http.createServer(function(req, res) {
  serve(req, res, finalhandler(req, res));
  //fs.readFile('./index.html', 'utf-8', function(error, content) {
  //  res.writeHead(200, {"Content-Type": "text/html"});
  //  res.end(content);
  //});
});

var io = require('socket.io').listen(server);

// Initalize wit
let Wit = null;
try {
  // if running from repo
  Wit = require('../').Wit;
} catch (e) {
  Wit = require('node-wit').Wit;
}

// Helpers
const accessToken = (() => {
  if (process.argv.length !== 3) {

    const path = require('path');

    console.log('usage: node ' + path.basename(process.argv[1]) + ' <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

// number to string of length n with leading zeros.
Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

// Database with minor data
var database = require(process.cwd() + '/minor_data/database.json');

io.on('connection', function (socket) {

  const actions = {
    send(request, response) {
      const {sessionId, context, entities} = request;
      const {text, quickreplies} = response;
      //console.log('@'+text);
      socket.emit('msg', { 'message' : text });
    },
    countminors({context, entities}) {
      var database = require(process.cwd() + '/minor_data/database.json');
      context.aantalminors = database.length;
      return(context);
    },
    getMinorInfo({context, entities}) {
      var baseUrl = 'https://students.uu.nl';
      console.log(entities);
      var minor = firstEntityValue(entities, 'minor');
      var minorUrl = '';
      context.minor_type = minor;
      context.minor_url = '';
      var array_minor_matches = [];
      var text_minor_matches = '';
      if(minor != null)
      {
        for(var i=0, j=0; i < database.length; i++) {

          // Find multiple matches
          if(database[i].name.toUpperCase().includes( minor.toUpperCase()))
          {
            array_minor_matches.push( database[i].name );
            j++;
            if(j > 1) text_minor_matches = text_minor_matches + ", ";
            text_minor_matches = text_minor_matches + "#" + j + " " +  database[i].name;
            // Keep last url
	    context.minor_url = baseUrl + database[i].url;
          }
        }
      }

      if( array_minor_matches.length > 1 )
      {
         context.minor_type = text_minor_matches;
         context.minor_url = baseUrl;
	 return context;
      } 
      if(context.minor_url == '') 
      {
        context.minor_type = '[UNKNOWN MINOR]';
        context.minor_url = baseUrl;
        return context;
      }
      return context;
    },
    default({context, entities}) {
      //console.log(arguments);
      //console.log(arguments);
      //console.log(JSON.stringify(entities) );
      return context;
    }
  };

  var uuid = require('uuid');
  var sessionId = uuid.v1();

  const client = new Wit({accessToken, actions});
  //console.log(JSON.stringify(client));
  var sessions = {};
  sessions[sessionId] = { context: {} };
  
  socket.on('msg', function (data) {
    console.log(data);
    var r = client.runActions(
      sessionId,
      data.message,
      sessions[sessionId].context
    ).then((context) => {
      sessions[sessionId].context = context;
    }).catch((err) => {
      console.error('Error: ', err.stack || err);
      socket.emit('msg', {'message':'?'} );
    });
  });
});

server.listen(PORT);
