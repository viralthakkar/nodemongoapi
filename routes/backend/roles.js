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

exports.ballroomroles = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        db.collection('controls', function(err, collection) {
                            collection.find().toArray(function(err, controls) {
                                console.log(controls);
                                res.render('roles/createroles',{
                                    tag : 0,
                                    permission : item,
                                	userinfo : req.session.user.name,
                                    controls:controls,
                                    title:"Ballroom - Create Roles",
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

exports.addroles = function(req,res){
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        console.log(req.body);
                        var role = req.body;
                        db.collection("roles", function(err, collection) {
                            collection.insert(role, {safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred'});
                                } else {
                                    res.redirect('listroles');  
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

exports.editroles = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, roleitem) {
                if(roleitem==null) {
                    res.redirect('/404');
                } else {
                    console.log(req.params.id);
                    var id = req.params.id;
                    db.collection('roles', function(err, collection) {
                        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                            if(item==null) {
                                res.redirect('/listroles');
                            }
                            else {
                                console.log(roleitem);
                                if(roleitem.events=='1' && roleitem.groups=='1' && roleitem.posts=='1' && roleitem.users=='1') {
                                    db.collection('controls', function(err, collection) {
                                       collection.find().toArray(function(err, roles) {
                                            console.log(roleitem)
                                            res.render('roles/editroles',{
                                                tag : 1,
                                                permission : roleitem,
                                            	userinfo : req.session.user.name,
                                                id:item._id,
                                                name:item.role,
                                                usage:item.description,
                                                roles:roles,
                                                title:"Balroom - Edit Role"
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
            });
        });
    } else {
        res.redirect('/login');   
    }
}

exports.updateroles = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        var id = req.body._id;
                        console.log(id);
                        delete req.body['_id'];
                        var roledata = req.body;
                        console.log(roledata);
                        db.collection("roles", function(err, collection) {
                            collection.update({'_id':new BSON.ObjectID(id)},roledata,{safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred'});
                                } else {
                                    console.log(result);
                                    res.redirect('listroles');  
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

exports.listroles = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        db.collection('roles', function(err, collection) {
                            collection.find().toArray(function(err, roles) {
                                res.render('roles/listroles',{
                                    tag : 0,
                                    permission : item,    
                                	userinfo : req.session.user.name,
                                    roles:roles,
                                    title:"Ballroom - Role Lists",
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
}

exports.deleterole = function(req, res) {
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
                        db.collection("roles", function(err, collection) {
                            collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred - ' + err});
                                    res.redirect('/listroles');
                                } else {
                                    console.log('' + result + ' document(s) deleted');
                                    res.redirect('/listroles');
                                }
                            });
                        });     
                    } else {
                       res.redirect('/404');
                    }
                }
            });
        });
    } else {
        res.redirect('/login');
    }
}