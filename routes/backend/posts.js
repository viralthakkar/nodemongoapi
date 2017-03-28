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

exports.abuserequests = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                }
                else {
                    if(item.posts=='1') {
                        db.collection('posts', function(err, collection) {
                            collection.find({ abuse: { $gt: 0 } }).toArray(function(err, posts) {
                                console.log(item);
                                res.render('posts/abuserequests',{
                                    tag : 0,
                                    permission : item,
                                    userinfo : req.session.user.name,
                                    posts: posts,
                                    title:"Ballroom - Suspended User Lists"
                                });
                            });
                        });
                    } 
                    else {
                        res.render('error/404',{
                            title : "Not Found"
                        });
                    }
                }
            });
        });
    } else{
      res.redirect('/login');  
    } 
};

exports.abusepost = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.posts=='1') {
                        var id = req.params.id;
                        console.log(id);
                        db.collection('posts', function(err, collection) {
                            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                                if(item==null) {
                                    res.redirect('/abuserequests');
                                }
                                else {
                                    console.log(item);
                                    db.collection("postsdelete", function(err, collection) {
                                        collection.insert(item, {safe:true}, function(err, result) {
                                          if (err) {
                                               res.send({'error':'An error has occurred'});
                                          } else {
                                            db.collection("posts", function(err, collection) {
                                                collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                                    if (err) {
                                                        res.send({'error':'An error has occurred - ' + err});
                                                        res.redirect('/abuserequests');
                                                    } else {
                                                        console.log('' + result + ' document(s) deleted');
                                                        res.redirect('/abuserequests');
                                                    }
                                                });
                                            });                           
                                          }
                                        });
                                    });                  
                                }
                            });
                        });
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
}


exports.abusedposts = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.posts=='1') {
                        db.collection('postsdelete', function(err, collection) {
                            collection.find().toArray(function(err, posts) {
                                res.render('posts/abusedposts',{
                                    tag : 0,
                                    permission : item,
                                	userinfo : req.session.user.name,
                                    posts: posts,
                                    title:"Ballroom - Abused Posts Lists"
                                });
                            });
                        });
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
