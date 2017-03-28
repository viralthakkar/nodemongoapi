var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});


db.open(function(err, db) {
    if(err) {
        console.log("from Search.js" + err);
    }
}); 

// serach users.search parameter will come "q"

exports.searchusers = function(req,res) {
    var q = {
  		display_name: { $regex: req.query.q, $options: 'i' }
  	};
  	console.log(q)
    db.collection('users', function(err, collection) {
		collection.find(q,{display_name:1,image:1}).toArray(function(err, items) {
		    if(err) {
				res.send(false);		  			  
				console.log("from search" + err);
          	} else {
				console.log("from search" + items);
				res.send(items);
			}
        });
    });
}

exports.searchgroups = function(req,res) {
    var q = {
      name: { $regex: req.query.q, $options: 'i' }
    };
    console.log(q)
    db.collection('groups', function(err, collection) {
    collection.find(q,{name:1,image:1}).toArray(function(err, items) {
        if(err) {
        res.send(false);              
        console.log("from search" + err);
            } else {
        console.log("from search" + items);
        res.send(items);
      }
        });
    });
}


exports.searchevents = function(req,res) {
    var q = {
      name: { $regex: req.query.q, $options: 'i' }
    };
    console.log(q)
    db.collection('events', function(err, collection) {
    collection.find(q,{name:1,image:1}).toArray(function(err, items) {
        if(err) {
        res.send(false);              
        console.log("from search" + err);
            } else {
        console.log("from search" + items);
        res.send(items);
      }
        });
    });
}

