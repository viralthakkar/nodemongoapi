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

exports.userslist = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        console.log(req.session['user'].role_id);
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                if(item==null) {
                    res.redirect('404');
                }
                else {
                    if(item.users=='1') {
                        db.collection('users', function(err, collection) {
                            collection.find().toArray(function(err, users) {
                                    console.log(item);
                                    res.render('users/ballroomusers',{
                                        tag : 0,
                                        permission : item,
                                        userinfo : req.session.user.name,	
                                        login : req.session['user'],
                                        users: users,
                                        title:"Ballroom - User Lists",
                                        header: "some lists"
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
    }
    else {
        res.redirect('/login');
    }
};

exports.deleteuser = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                }
                else {
                    if(item.users=='1') {
                        var id = req.params.id;
                        console.log(id);
                        console.log('Deleting wine: ' + id);
                        db.collection("users", function(err, collection) {
                            collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred - ' + err});
                                    res.redirect('/ballroomusers');
                                } else {
                                    console.log('' + result + ' document(s) deleted');
                                    res.redirect('/ballroomusers');
                                }
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
    } else {
       res.redirect('/login'); 
    }
}


exports.suspenduser = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                }
                else {
                    if(item.users=='1') {
                        var id = req.params.id;
                        console.log(id);
                        db.collection('users', function(err, collection) {
                            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                                if(item==null) {
                                    res.redirect('/ballroomusers');
                                }
                                else {
                                    console.log(item);
                                    db.collection("usersdelete", function(err, collection) {
                                        collection.insert(item, {safe:true}, function(err, result) {
                                          if (err) {
                                               res.send({'error':'An error has occurred'});
                                          } else {
                                            db.collection("users", function(err, collection) {
                                                collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                                    if (err) {
                                                        res.send({'error':'An error has occurred - ' + err});
                                                        res.redirect('/ballroomusers');
                                                    } else {
                                                        console.log('' + result + ' document(s) deleted');
                                                        res.redirect('/ballroomusers');
                                                    }
                                                });
                                            });                           
                                          }
                                        });
                                    });                  
                                }
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
    } else {
        res.redirect('/login')
     }
}

exports.suspenduserlist = function(req, res) {
    if(typeof req.session['user'] != "undefined") { 
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                }
                else {
                    if(item.users=='1') {
                        db.collection('usersdelete', function(err, collection) {
                            collection.find().toArray(function(err, users) {
                                console.log(item)
                                res.render('users/suspendusers',{
                                    tag : 0,
                                    permission : item,
                                	userinfo : req.session.user.name,
                                    users: users,
                                    title:"Ballroom - Suspended User Lists"
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

exports.activeuser = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.users=='1') {
                        var id = req.params.id;
                        console.log(id);
                        db.collection('usersdelete', function(err, collection) {
                            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                                if(item==null) {
                                    res.redirect('/ballroomusers');
                                }
                                else {
                                    console.log(item);
                                    db.collection("users", function(err, collection) {
                                        collection.insert(item, {safe:true}, function(err, result) {
                                          if (err) {
                                               res.send({'error':'An error has occurred'});
                                          } else {
                                            db.collection("usersdelete", function(err, collection) {
                                                collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                                    if (err) {
                                                        res.send({'error':'An error has occurred - ' + err});
                                                        res.redirect('/ballroomusers');
                                                    } else {
                                                        console.log('' + result + ' document(s) deleted');
                                                        res.redirect('/ballroomusers');
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