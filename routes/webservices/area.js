var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

db.open(function(err, db) {
    if(err) {
        console.log("area.js Database Connection" + err);
    }
});

//find list of countries. it is used for fetching country list when user going to fill up signup form.

exports.country = function(req,res) {
    console.log("First" + new Date());
    db.collection('countries', function(err, collection) {
        collection.find({},{_id:1,name:1}).toArray(function(err, countries) {
            if(err) {
                res.send(false);
                console.log('area.js and country function ' + err); 
            }else {
                console.log("From Database" + new Date());
                res.send(countries);
            }
        });
    });

};

//find list of states according to country id when user select country, according to that states list will be sent to user.


exports.findstate = function(req,res) {
    var id = req.params.id;
    console.log(id);
    db.collection('states', function(err, collection) {
        collection.find({country_id:id},{state:1}).toArray(function(err, states) {
            if(err) {
                res.send(false);
                console.log('area.js and findstate function' + err); 
            }else {
                res.send(states);
            }
        });
    });
};
