var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});
var fs = require('fs');

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

exports.error404 = function(req,res) {
//    fs.appendFile('/home/ballroomnightz/iplist.txt',req.connection.remoteAddress +"\n", function(err){});
    res.render('error/404',{
        title:"404 Error",
        header: "some lists"
    });
};
