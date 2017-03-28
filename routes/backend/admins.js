var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

db.open(function(err, db) {
    if(err) {
        console.log("Backend : admin.js Database Connection" + err);
    }
});

exports.adminlogin = function(req,res) {
    var emaildata = req.body.email;
    var email = {};
    email['email']  = emaildata;
    var passworddata = req.body.password;
    var password = {};
    password['password']  = passworddata;
    var user = [email,password];
    // console.log(user);
    db.collection('admin', function(err, collection) {
        if(err) {
            console.log("Backend : admin.js adminlogin function" + err);
        } else {
            collection.findOne({$and:user}, function(err, item) {
                if(err) {
                    console.log("Backend : admin.js adminlogin function" + err);
                } else {
                    if(item==null) {
                        res.redirect('/login');
                    }
                    else {
                        req.session.cookie.expires =  new Date(Date.now() + 3600000*5);
                        req.session.cookie.maxAge = new Date(Date.now() + 3600000*5);
                        req.session.user = item;
			console.log(req.session.user);
                        var title = "Ballroom - Dashboard";
                        console.log("THis is session data: ", req.session);
                        console.log(req.session['user'].role_id);
                        var id = req.session['user'].role_id
                        db.collection('roles', function(err, collection) {
                            if(err)  {
                                console.log("Backend : admin.js adminlogin function" + err);
                            } else {
                                collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                                    if(err) {
                                        console.log("Backend : admin.js adminlogin function" + err);
                                    } else {
                                        if(item==null) {
                                            res.redirect('/404');
                                        } else {
                                            res.redirect('/dashboard');
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    });
};

exports.loginview = function(req,res) {
    res.render('admins/login',{
        title:"Ballroom - Login",
        header: "some lists"
    });
};

exports.adminlist = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        db.collection('admin', function(err, collection) {
                            collection.find().toArray(function(err, admins) {
                                console.log(admins);
                                res.render('admins/ballroomadmin',{
                                    tag : 0,
                                    permission : item,
                                	userinfo : req.session.user.name,
                                    admins:admins,
                                    title:"Ballroom - Admin Users",
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

exports.adduserform = function(req,res) {
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
                                console.log(roles);
                                res.render('admins/addadminuser',{
                                    tag : 0,
                                    permission : item,
                                	userinfo : req.session.user.name,
                                    roles:roles,
                                    title:"Ballroom - Add Admin User"
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
    } else  {
        res.redirect('/login');
    }
}

exports.addadmin = function(req,res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1' && item.groups=='1' && item.posts=='1' && item.users=='1') {
                        var admin = req.body;
                        db.collection('roles', function(err, collection) {
                            collection.findOne({'_id':new BSON.ObjectID(req.body.role_id)}, function(err, role) {
                                if(err) {
                                    console.log(error);
                                } else {
                                    console.log(role.description);
                                    admin['description'] = role.description;
                                    db.collection("admin", function(err, collection) {
                                        collection.insert(admin, {safe:true}, function(err, result) {
                                            if (err) {
                                                res.send({'error':'An error has occurred'});
                                            } else {
                                                console.log(result);
                                                res.redirect('ballroomadmin');  
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

exports.deleteadmin = function(req, res) {
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
                        db.collection("admin", function(err, collection) {
                            collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                if (err) {
                                    res.send({'error':'An error has occurred - ' + err});
                                    res.redirect('/ballroomadmin');
                                } else {
                                    console.log('' + result + ' document(s) deleted');
                                    res.redirect('/ballroomadmin');
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

exports.logout = function(req,res) {
    //req.session.destroy();
    req.session = null;
    res.redirect('login');   
}
