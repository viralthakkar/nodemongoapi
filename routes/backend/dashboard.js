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

exports.dashboard = function(req,res) {
    console.log(req.session)
    if(typeof req.session['user'] !== "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.posts=='1' || item.users=='1' || item.events=='1' || item.groups=='1') {
                        var fetch_users = function() {
                            var collections = ['users', 'events', 'groups', 'posts'];
                            var count = collections.length;
                            var ary = [];
                            for(var i=0; i<collections.length; ++i) {
                                get_count(ary, collections[i], function() {
                            // Each time a query for one user is done we decrement the counter
                                    count--;
                                // When the counter is 0 we know that all queries have been done
                                    if(count === 0) {
                                        console.log(ary[0].users);
                                        res.render('index',{
                                            userinfo : req.session.user.name,
                                            data : ary,
                                            tag : 0,
                                            permission : item,
                                            title:"Ballroom - Dashboard",
                                        });    
                                        return;
                                    }
                                });
                            }           
                        };
                        var get_count = function(ary, collection, callback) {
                            db.collection(collection, function(err, collection) {
                                collection.find({}).count(function(err, count) {
                            // Do something when you get error
                            // Always call the callback function if there is one
                                    if(err) {
                                        callback();
                                        console.log("This is error: ", err);
                                        return;
                                    }else{
                                        console.log(collection.collectionName);
                                        obj = {}
                                        obj[collection.collectionName] = count;
                                        ary.push(obj);
                                    }                            
                                    callback();
                                });
                            });
                        }
                        fetch_users();
                    } else {
                        res.render('error/404',{
                            title : "Not Found"
                        }); 
                    }
                }
            });    
        });    
    } else {
        res.redirect('/login');
    }
};