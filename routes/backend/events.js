var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

db.open(function(err, db) {
    if(err) {
        console.log(err);
        // console.log("Connected to 'ballroom' database");
    }
});

exports.ballroomevents = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.events=='1') {
                        db.collection('events', function(err, collection) {
                            collection.find().toArray(function(err, events) {
                                res.render('events/ballroomevents',{
                                    tag : 0,
                                    permission : item,
                                	userinfo : req.session.user.name,
                                    events: events,
                                    title:"Ballroom - Events Lists"
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

exports.deleteevent = function(req, res) {
    res.send(true);
    // if(typeof req.session['user'] != "undefined") {
    //     var id = req.session['user'].role_id
    //     db.collection('roles', function(err, collection) {
    //         collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
    //             console.log(item.userslist);
    //             if(item==null) {
    //                 res.redirect('/404');
    //             } else {
    //                 if(item.events=='1') {
    //                     var id = req.params.id;
    //                     console.log(id);
    //                     db.collection('events', function(err, collection) {
    //                         collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
    //                             if(item==null) {
    //                                 res.redirect('/ballroomevents');
    //                             }
    //                             else {
    //                                 console.log(item);
    //                                 db.collection("eventsdelete", function(err, collection) {
    //                                     collection.insert(item, {safe:true}, function(err, result) {
    //                                       if (err) {
    //                                            console.log(err)
    //                                       } else {
    //                                         db.collection("events", function(err, collection) {
    //                                             collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
    //                                                 if (err) {
    //                                                     console.log({'error':'An error has occurred - ' + err});
    //                                                     res.redirect('/ballroomevents');
    //                                                 } else {

    //                                                     console.log('' + result + ' document(s) deleted');
    //                                                     res.redirect('/ballroomevents');
    //                                                 }
    //                                             });
    //                                         });                           
    //                                       }
    //                                     });
    //                                 });                  
    //                             }
    //                         });
    //                     });
    //                 } else {
    //                     res.render('error/404',{
    //                         title : "Not Found"
    //                     });
    //                 }
    //             }        
    //         });
    //     });
    // } else {
    //     res.redirect('/login');
    // }
};



