var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

var util = require('util');

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

exports.notifications = function(req,res) {
    var id = req.params.id;
    console.log(id);
	var tenDays = (24*60*60*1000) * 10;	// 10 Days
	var nowDate = new Date();
	nowDate.setTime(nowDate.getTime() - tenDays);
    db.collection('notifications', function(err, collection) {
        collection.find({"loginuserid":id, "seen":0, "created": {$gte: nowDate}}).sort({_id:-1}).limit(50).toArray(function(err, notifications) {
            if(err) {
                console.log('Error updating wine: ' + err); 
            }else {
                res.send(notifications);
				console.log("Notifications sent: ", util.inspect(notifications));
	        			db.collection('notifications', function(err, collection) {
									console.log("userid is :" + id);									
									collection.update({'loginuserid':id}, {$set:{seen:1}},{ multi: true }, {safe:true}, function(err, result) {
		    						if (err) {
							        console.log('Error updating wine: ' + err);
		      					  
		    						} else {  
							        console.log("true");
      					  	}
							  	});
								});
            }
        });
    });    
};

exports.notificationseen = function(req,res) {
    var id = req.params.id;
    console.log(id);

    db.collection('notifications', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, {$set:{seen:1}}, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating wine: ' + err);
                res.send({'error':'An error has occurred'});
            } else {  
                console.log("true");
                res.send("true");
            }
        });
    });
};

exports.notificationcount = function(req,res) {
    var id = req.params.id;
    console.log(id);
	//(From Stackoverflow, See Karim's answer:http://stackoverflow.com/questions/1296358/subtract-days-from-a-date-in-javascript)
	var tenDays = (24*60*60*1000) * 10;	//10 Days
	var nowDate = new Date();
	nowDate.setTime(nowDate.getTime() - tenDays);
    db.collection('notifications', function(err, collection) {
        collection.count({"loginuserid":id, seen:0, "created": {$gte: nowDate} },function(err, count) {
            if(err) {
                console.log('Error updating wine: ' + err); 
								return;
            }else {
								total = []
								notification = {};
								notification.total = count;
								total.push(notification);
								res.send(total);
								console.log("COUNT: ", util.inspect(notification));
								console.log("count is " + notification.toString());
								return;
						}
			  });
		}); 
};


/****************************************** For Group Notification ************************************/

exports.fetchAllGroupNotifications = function(req, res) {
    var id = req.params.id;
    console.log(id);
    var tenDays = (24 * 60 * 60 * 1000) * 10; // 10 Days
    var nowDate = new Date();
    nowDate.setTime(nowDate.getTime() - tenDays);
    db.collection('groupnotifications', function(err, collection) {
        collection.find({"loginuserid": id, "seen": 0, "created": { $gte: nowDate } })
											.sort({ _id: -1})
											.limit(50)
											.toArray(function(err, notifications) {
            if (err) {
                console.log('Error updating wine: ' + err);
								res.send(false);
            } else {
                res.send(notifications);
                console.log("Notifications sent: ", util.inspect(notifications));
                console.log("userid is :" + id);
                collection.update({ 'loginuserid': id }, { $set: { seen: 1 } }, { multi: true }, { safe: true }, function(err, result) {
                    if (err) {
                        console.log('Error updating wine: ' + err);
                    } else {
                        console.log("true");
                    }
                });
            }
        });
    });
};

exports.groupNotificationCount = function(req,res) {
    var id = req.params.id;
    console.log(id);
	//(From Stackoverflow, See Karim's answer:http://stackoverflow.com/questions/1296358/subtract-days-from-a-date-in-javascript)
	var tenDays = (24*60*60*1000) * 10;	//10 Days
	var nowDate = new Date();
	nowDate.setTime(nowDate.getTime() - tenDays);
    db.collection('groupnotifications', function(err, collection) {
        collection.count({"loginuserid":id, seen:0, "created": {$gte: nowDate} },function(err, count) {
            if(err) {
                console.log('Error Retrieving count of group notification: ' + err);
								res.send(false);
								return;
            }else {
								total = [];
								notification = {};
								notification.total = count;
								total.push(notification);
								res.send(total);
								console.log("COUNT: ", util.inspect(notification));
								console.log("count of group notifications is " + notification.toString());
								return;
						}
			  });
		}); 
};



