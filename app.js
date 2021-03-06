
// This is the server-side file of our mobile remote controller app.
// It initializes socket.io and a new express instance.
// Start it by running 'node app.js' from your terminal.

// to get the local host ip address. only ipv4

var os = require('os');


// var interfaces = os.networkInterfaces();
// var ip_addr = [];
// for (var i in interfaces) {
//     for (var j in interfaces[i]) {
//         var address = interfaces[i][j];
//         if (address.family === 'IPv4' && !address.internal) {
//             ip_addr.push(address.address);
//         }
//     }
// }

// Creating an express server

var express = require('express'),
	app = express();

// This is needed if the app is run on heroku and other cloud providers:

var port = process.env.PORT || 8080;

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.

var io = require('socket.io').listen(app.listen(port));

// local host ip address w default port 8080 unless port changed by host server

// for local test

//var localhost = ip_addr[0]+ ":" + port;
//var localhost = os.hostname();

// for heroku

var localhost = "young-mesa-5396.herokuapp.com"

// App Configuration

// Make the files in the public folder available to the world
app.use(express.static(__dirname + '/public'));


// This is a secret key generated by GUID.


function NewGuid(){

	function S4(){
	return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

	return (S4()+S4());
}

var secret = NewGuid();


// Initialize a new socket.io application

var presentation = io.on('connection', function (socket) {

	socket.emit('dataleak', {
			leak: secret,
			host: localhost
		});
	console.log("Send pass key "+secret+" to Clients");


	// A new client has come online. Check the secret key and 
	// emit a "granted" or "denied" message.

	socket.on('clientkey', function(data){

		socket.emit('access', {
			access: (data.key === secret ? "granted" : "denied")
		});

		if (data.key === secret){
			
			console.log("Access: "+data.key+" from "+data.login_status);

			if (data.login_status == "mobile"){

				// unlock all clients

				//io.sockets.emit('bypassform', {
					//for all connections

				// for all but not self
				socket.broadcast.emit('bypassform', {
				
					bypass_pw: secret
				});

				console.log("Sumbit bypass to all: " +secret);

			}

		}
			
		else
			console.log("Denied: "+data.key+" from "+data.login_status);

	});


	// Clients send the 'slide-changed' message whenever they navigate to a new slide.

	socket.on('slide-changed', function(data){

		console.log("slide-changed: "+data.curl);

		// Check the secret key again

		// if(data.key === secret) {

			// Tell all connected clients to navigate to the new slide
			
			presentation.emit('navigate', {
				hash: data.hash,
				curl: data.curl
			});
		// }

	});

});

console.log('Your presentation is running on '+localhost);
console.log('Password:'+secret);