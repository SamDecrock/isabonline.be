#!/usr/bin/env node

var express = require('express');
var http = require('http')
var path = require('path');
var utils = require('./utils');
var httpreq = require('httpreq');
var fs = require('fs');
var socketio = require('socket.io');
var config = require('./config');

var app = express();

var interval = 1000;
var intervalWhenAlive = 5000;

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('abonline123456789987654321'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

var webserver = http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

// Socket IO
var io = socketio.listen(webserver);
io.set('log level', 0);


app.get('/', function (req, res){
	res.render('index', { title: 'isabonline.be | Is AB online?' });
});


function checkSite () {
	httpreq.get('http://www.abconcerts.be', {
		allowRedirects: false,
		headers:{
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:29.0) Gecko/20100101 Firefox/29.0',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3'
		}
	}, function (err, res) {
		if(err){
			console.log(err);
			io.sockets.emit('status.changed', {online: false, error: 'Could not connect' });
			console.log('> offline, checking again in ' + config.intervals.whenoffline + ' ms');
			return setTimeout(checkSite, config.intervals.whenoffline);
		}

		if(res.statusCode == 302){
			io.sockets.emit('status.changed', {online: true});
			console.log('> online ('+res.statusCode+'), checking again in ' + config.intervals.whenonline + ' ms');
			return setTimeout(checkSite, config.intervals.whenonline);
		}

		if(res.statusCode != 200){
			io.sockets.emit('status.changed', {online: false, error: 'statuscode ' + res.statusCode + ' :-(' });

			console.log('> offline, checking again in ' + config.intervals.whenoffline + ' ms');
			return setTimeout(checkSite, config.intervals.whenoffline);
		}


		if(res.body.match(/Due to a large number of visitors, access to the website to buy tickets has been temporarily limited/)){
			io.sockets.emit('status.changed', {online: false, error: 'Due to a large number of visitors, access to the website to buy tickets has been temporarily limited' });
			console.log('> offline, checking again in ' + config.intervals.whenoffline + ' ms');
			return setTimeout(checkSite, config.intervals.whenoffline);
		}


		io.sockets.emit('status.changed', {online: true});
		console.log('> online ('+res.statusCode+'), checking again in ' + config.intervals.whenonline + ' ms');
		return setTimeout(checkSite, config.intervals.whenonline);
	});
}

checkSite();