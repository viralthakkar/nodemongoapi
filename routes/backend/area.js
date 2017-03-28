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

exports.addstate = function(req,res) {
     if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        db.collection('countries', function(err, collection) {
                            collection.find().toArray(function(err, countries) {
                                console.log(countries);
                                res.render('area/addstate',{
                                    tag : 0,
                                    permission : item,
                                    userinfo : req.session.user.name,
                                    countries:countries,
                                    title:"Ballroom - Add City"
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
    } else  {
        res.redirect('/login');
    }
};

exports.savestate = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        var state = req.body;
                        db.collection('states', function(err, collection) {
                            collection.insert(state, {safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred'});
                                } else {
                                    console.log(result);
                                    res.redirect('countrylist');  
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
    } else  {
        res.redirect('/login');
    }
};

exports.countrylist = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        db.collection('countries', function(err, collection) {
                            collection.find({},{_id:1,name:1}).toArray(function(err, countries) {
                                if(err) {
                                    console.log('Error updating wine: ' + err); 
                                }else {
                                    res.render('area/countrylist',{
                                        tag : 0,
                                        permission : item,
                                        userinfo : req.session.user.name,
                                        countries:countries,
                                        title:"Ballroom - Contry List"
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
};

exports.statelist = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        var id = req.params.id;
                        console.log(id);
                        db.collection('states', function(err, collection) {
                            collection.find({country_id:id},{_id:1,state:1}).toArray(function(err, states) {
                                if(err) {
                                    console.log('Error updating wine: ' + err); 
                                }else {
                                    res.render('area/statelist',{
                                        tag : 1,
                                        permission : item,
                                        userinfo : req.session.user.name,
                                        states:states,
                                        title:"Ballroom - State List"
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
};


exports.statedelete = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        var id = req.params.id;
                        console.log(id);
                        db.collection("states", function(err, collection) {
                            collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred - ' + err});
                                    res.redirect('/countrylist');
                                } else {
                                    console.log('' + result + ' document(s) deleted');
                                    res.redirect('/countrylist');
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
