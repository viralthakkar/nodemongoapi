/**
* Codeby: 			Avdhesh Parashar
* Contact: 			avdhesh@buletech.com
* Starting date: 	5th July 2014
* @copyright:     	Copyright (c) BugleTech, (http://www.bugle.in)
**/

/**
* Greetings programmer for making this far!
* Though, be careful, road ahead is less travelled
* Okay, lets focus now.
* Please read and understand how nodeJS works first
**/
var xmpp = require('node-xmpp');
var util = require('util');
var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

var onlineClients = {};

/* This is a very basic C2S server example. One of the key design decisions
* of node-xmpp is to keep it very lightweight
* If you need a full blown server check out https://github.com/superfeedr/xmpp-server
*/

// Sets up the server.
var c2s = new xmpp.C2SServer({
    port: 5223,
    domain: 'localhost'

});

// On Connect event. When a client connects.
c2s.on('connect', function(client) {

    // Allows the developer to register the jid against anything they want
    client.on('register', function(opts, callback) {
        console.log('REGISTER');
        callback(true);
		return;
    });

    // Allows the developer to authenticate users against anything they want.
    client.on('authenticate', function(opts, callback) {
		//console.log("In Authenticate: options", opts);
		var userID = opts.username.toString();


		// Looking up for user in database
		if(userID !== null && userID.length === 24){
			db.collection('users', function(err, usrCollection){
				if(err){
					console.log("Error retrieving user collection", err);
					return;
				}
				usrCollection.findOne({"_id": new BSON.ObjectID(userID)}, function(err, user){
					if(user.length === 0 || user === null){
						console.log("No User Found");
						callback(false);
						return;
					}else{
						console.log("Hurrey");
						callback(null, opts);
						return;
					}
				});
			});
		}
    });


	// Client is ready to exchange data now
    client.on('online', function() {
        console.log('ONLINE');
		onlineClients[client.jid.user] = client;
        client.send(new xmpp.Message({ type: 'chat' }).c('body').t('online'));
		return;
    });


	// Listen for any data coming from client side
	/*
		Use this to debug data coming from client side
		Note that all the data coming from client is in XML form
	*/
	client.on('data', function(data){
		//console.log("Data: ", data.toString());
	});


    // Stanza(Data coming from client side) handling
    client.on('stanza', function(stanza) {
		//Check if there is any error
		if (stanza.attrs.type == 'error') {
		    console.log('error in stanza:',  stanza);
		    return;
		}
		
		if(stanza.is('presence')){
			//	console.log("This is presence stanza: ", stanza);
			//Client is present
			return;
		}else if(stanza.is('message')){				// If its a message
			//client.send(stanza);
			//return;
			var toUserId = stanza.attrs.to.substr(0, stanza.attrs.to.indexOf('@'));		//Extracting reciever's userId.
			var toUser = null;
			toUser = onlineClients[toUserId];
			console.log("This is to User: ", toUser);
			if(typeof toUser !== "undefined"){
				console.log(stanza.toString());
				toUser.send(stanza);
			}else{
		        client.send(new xmpp.Message({ type: 'chat' }).c('body').t('receiver is not online'));
			}
			return;
		}
	});

	client.addListener('error', function(e) {
		console.error(e)
		process.exit(1)
	});

    // On Disconnect event. When a client disconnects
	/*
		Need to delete entry from onlineClients object
		Now, the client object does not have jid, so need to identify client from streamAttrs(console log client object and for  see yourself)
	*/
    client.on('disconnect', function() {
        console.log('DISCONNECT');
		//Iterate through all clients and identify disconnected client
		for(var singleClient in onlineClients){
			if(onlineClients[singleClient].connection.streamAttrs.id === client.connection.streamAttrs.id){
				delete onlineClients[onlineClients[singleClient].jid.user];
				console.log("User Deleted");
				return;
			}
		}
    });

});



