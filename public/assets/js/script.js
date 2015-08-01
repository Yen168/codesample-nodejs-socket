$(function() {

	// Initialize the Reveal.js library with the default config options
	// See more here https://github.com/hakimel/reveal.js#configuration

	Reveal.initialize({
		history: true	
	});

	// Connect to the socket

	var socket = io();

	// Variable initialization

	var form = $('form.login');
	
	var secretTextBox = form.find('input[type=text]');
	var presentation = $('.reveal');

	var key = "", animationTimeout;

	// QRcode div

	$("#qrcode").append("<img id='qr' />");

	// When the page is loaded it asks you for a key and sends it to the server

	// the idea is for auto login when mobile connected. still working

	var supersubmit = function(){form.submit(function(e){

		e.preventDefault();

		key = secretTextBox.val().trim();

		// If there is a key, send it to the server-side
		// through the socket.io channel with a 'clientkey' event.

		if(key.length) {
			socket.emit('clientkey', {
				key: key,
				login_status: "form"

			});
		}

	});}

	//$.urlParam('key') to get mobile login password from url

	$.urlParam = function(name){
    	
    	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    	
    	if (results==null){
      		return null;
    	}else{
     		return results[1] || 0;
    	}
	}

	// mobile login

	if ($.urlParam('urlkey') !== null){

		socket.emit('clientkey', {
					key: $.urlParam('urlkey'),
					login_status: "mobile"
				});

	}

	// bypass all client if once mobile login successfully.

	socket.on('bypassform', function(data) {

        
        $('input[type=text]').val(data.bypass_pw);
        $('form.login').submit();

        console.log("submit: "+data.bypass_pw);

      });

	// QRcode generator. get key form server. 
	//future idea will be that client side generate key then sent to server 

	socket.on('dataleak', function(data) {

		//auto update view when key changed
        
        var qrstr = "http://chart.apis.google.com/chart?chs=300x300&cht=qr&chl=http://"+data.host+"?urlkey=" + data.leak + "&choe=UTF-8";
        $("#qr").attr('src',qrstr);
        $('input[type=text]').val(data.leak);
        // if login from desktop it is a bugs right now
        supersubmit();

      });

	// The server will either grant or deny access, depending on the secret key

	socket.on('access', function(data){

		// Check if we have "granted" access.
		// If we do, we can continue with the presentation.

		if(data.access === "granted") {

			// Unblur everything
			presentation.removeClass('blurred');

			form.hide();

			var ignore = false;

			$(window).on('hashchange', function(){

				// Notify other clients that we have navigated to a new slide
				// by sending the "slide-changed" message to socket.io


				if(ignore){

					return;
				}

				// for server log
				var hash = window.location.hash;
				var curl = window.location.href;
				

				socket.emit('slide-changed', {
					hash: hash,
					curl: curl 
				// for server log
				});
			});

			socket.on('navigate', function(data){
	
				// Another device has changed its slide. Change it in this browser, too:

				window.location.hash = data.hash;


				// The "ignore" variable stops the hash change from
				// triggering our hashchange handler above and sending
				// us into a never-ending cycle.

				ignore = true;

				setInterval(function () {
					ignore = false;
				},100);

			});

		}
		else {

			// Wrong secret key

			clearTimeout(animationTimeout);

			// Addding the "animation" class triggers the CSS keyframe
			// animation that shakes the text input.

			secretTextBox.addClass('denied animation');
			
			animationTimeout = setTimeout(function(){
				secretTextBox.removeClass('animation');
			}, 1000);

			form.show();
		}

	});

});