var App = function (options){

	var socket;
	var lastcheck = Date.now();

	var init = function (){
		console.log("init");
		initSocket();
		updateLastCheck();
	};

	var initSocket = function (){
		if(socket) return; // already initialized

		// socket.io initialiseren
		socket = io.connect(window.location.hostname);
		// some debugging statements concerning socket.io
		socket.on('reconnecting', function(seconds){
			console.log('reconnecting in ' + seconds + ' seconds');
		});
		socket.on('reconnect', function(){
			console.log('reconnected');
			// onRefreshPage();
		});
		socket.on('reconnect_failed', function(){
			console.log('failed to reconnect');
		});
		// add ourselves to the 'kanaal39' room
		socket.on('connect', function() {
			socket.emit('room', 'kanaal39');
		});

		socket.on('status.changed', onStatusChanged);
	};


	var onStatusChanged = function (data) {
		if(data.online){
			$('.online').show();
			$('.offline').hide();
		}else{
			$('.online').hide();
			$('.offline').show();
		}

		if(data.error){
			$('.error').text(data.error);
		}

		lastcheck = Date.now();

		var openpopup = $('#openpopup').is(':checked');
		if(data.online && openpopup){
			window.location.href = 'http://www.abconcerts.be/';
		}
	};

	var updateLastCheck = function () {

		$('.lastcheck').text('laatste controle: ' + Math.round( (Date.now() - lastcheck)/10 )/100 + ' seconden geleden');

		setTimeout(updateLastCheck, 1000);
	};


	return {
		init: init
	};
};



$(function(){
	var app = new App();
	app.init();
});

