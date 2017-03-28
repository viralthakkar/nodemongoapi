var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});
var events = require('events');
var eventEmitter = new events.EventEmitter();
var util = require('util');

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "viral@bugletech.com",
        pass: "bugle.123"
    }
});


//IMPORTANT: Create a middieware to check if user is member of the group or not

exports.groupFeed = function(req, res){
	var groupId = req.params.id;
	var userId = req.params.userid;
	if(groupId === null || groupId.length !== 24 ){
		console.log("Not valid GroupID");
		res.send(false);
		return;
	}

	var skip = Number(req.query.skip);
	var limit = Number(req.query.limit);

	if(isNaN(skip)){
		skip = 0;
	}
	if(isNaN(limit)){
		limit = 0;
	}

	db.collection('groupposts', function(err, gPostCollection){
		if(err){
			console.log("Error retrieving group post collection");	
			res.send(false);
			return;
		}
		gPostCollection.find({"group_id": new BSON.ObjectID(groupId)})
									.sort({"_id": -1})
									.limit(limit)
									.skip(skip)
									.toArray(function(err, groupFeed){
			if(err){
				console.log("Error while retrieving group feed");
				res.send(false);
				return;
			}
			if(groupFeed.length === 0){
				console.log("No posts in group Feed");
				res.send(false);
				return;
			}
			var get_user_detail = function(i, usrCollection, callback) {
				usrCollection.find({
						"_id": groupFeed[i]['user_id']
					}, {
						"display_name": 1,
						"image": 1
					})
					.limit(1)
					.toArray(function(err, user) {
						if (err) {
						    console.log("Error getting user feedPosts");
						    res.send(false);
						    return;
						}
						console.log(user);
						groupFeed[i]['display_name'] = user[0].display_name;
						groupFeed[i]['image'] = user[0].image;
						//		console.log("FeedPosts: Calling callbak in get_user_detail with i: ", i);
						callback();
					});
			};
			db.collection('users', function(err, usrCollection){
				if(err){
					console.log("Error retrieving user collection");
					res.send(false);
					return;
				}
				var totalPosts = groupFeed.length;
				var count = totalPosts;
				for(var i=0; i<totalPosts; ++i){
					get_user_detail(i, usrCollection, function(){
						count--;
						if(count === 0){
							res.send(groupFeed);
							return;
						}
					});
				}
				
			});
			return;
		});
	});

};

exports.groupRecentFeed = function(req, res){
	//console.log("This is date: ", req.params.date);
	//var newDate = new Date(req.params.date);
	//console.log(newDate);
	//res.send(newDate);

	var groupId = req.params.id;
	var fromDateTime = req.params.date;

	db.collection('groupposts', function(err, gPostCollection){
		if(err){
			console.log("Error retrieving group post collection");	
			res.send(false);
			return;
		}
		gPostCollection.find({"group_id": new BSON.ObjectID(groupId), "created": {$gt: new Date(fromDateTime)}})
									.sort({"_id": -1})
									.toArray(function(err, groupFeed){
			if(err){
				console.log("Error while retrieving group feed");
				res.send(false);
				return;
			}
			if(groupFeed.length === 0){
				console.log("No posts in group Feed");
				res.send(false);
				return;
			}
			var get_user_detail = function(i, usrCollection, callback) {
				usrCollection.find({
						"_id": groupFeed[i]['user_id']
					}, {
						"display_name": 1,
						"image": 1
					})
					.limit(1)
					.toArray(function(err, user) {
						if (err) {
						    console.log("Error getting user feedPosts");
						    res.send(false);
						    return;
						}
						console.log(user);
						groupFeed[i]['display_name'] = user[0].display_name;
						groupFeed[i]['image'] = user[0].image;
						//		console.log("FeedPosts: Calling callbak in get_user_detail with i: ", i);
						callback();
					});
			};
			db.collection('users', function(err, usrCollection){
				if(err){
					console.log("Error retrieving user collection");
					res.send(false);
					return;
				}
				var totalPosts = groupFeed.length;
				var count = totalPosts;
				for(var i=0; i<totalPosts; ++i){
					get_user_detail(i, usrCollection, function(){
						count--;
						if(count === 0){
							res.send(groupFeed);
							return;
						}
					});
				}
				
			});
			return;
		});
	});
	
};
/*
exports.likePostofGroupTest = function(req, res){
     console.log("THis is body: ", req.body);
    console.log("This is paraeter: ", req.params.postid);

	var userId = req.body.user_id;
    //userId = userId.substr(1, userId.length-1);
	if(userId === "undefined" || userId.length !== 24){
		res.send(false);
		return;
	}
	db.collection('groupposts', function(err, gPostCollection){
		if(err){
			console.log("Error in retrieving ");
		}   
		var likeObject = {};
	    likeObject.user_id = userId.toString();
		likeObject.id = new ObjectId();
		likeObject.created = new Date();
		gPostCollection.update( {
									"_id": new BSON.ObjectID(req.params.postid), 
									"likes.user_id": {$ne: userId}
								}, 
								{$push: {likes: likeObject} }, 
								{safe: true}, 
								function(err, updatedData){
			if(err){
				console.log("Error while adding like to group post", err);
				res.send(false);
				return;
			}
			console.log("THis is updated data: ", updatedData);
			//res.send(true);
			db.collection('users', function(err, collection) {
				collection.find({ '_id': new BSON.ObjectID(userId) }, { "display_name": 1,  "image":1, "email": 1}).toArray(function(err, user) {
					// console.log(user);
		            if(err){
						console.log("Error while adding comment to group post", err);
						res.send(false);
						return;
					}
					if(user.length === 0){
						console.log("No user");
						res.send(false);
						return;
					}
		            likeObject.display_name = user[0].display_name;
		            likeObject.image = user[0].image;
		            res.send(likeObject);
		            //return;


					gPostCollection.find({"_id": new BSON.ObjectID(req.params.postid)}).limit(1).toArray(function(err, postData){
						if(err){
							console.log("Error finding one post in goupposts to create notification");
							return;
						}
						if( postData[0].userId.toString() !==  userId.toString() ){
							var mailOptions = {
								from: "Ballroom Dance  <viral@bugletech.com>", // sender address
								to: user[0].email, // list of receivers
								subject: "Ballroom Dance - New Notification", // Subject line
								text: user[0].display_name + "likes your post", // plaintext body
							}
							smtpTransport.sendMail(mailOptions, function(error, response) {
								if (error) {
									console.log(error);
								} else {
									console.log("Message sent: " + response.message);
								}
							});
	
							var notification = {};
							notification.created = new Date();
							notification.seen = 0;
							notification.loginuserid = userId;
							if(postData[0].mediatype === "video"){
								notification.rightimage = "img/Group/thumbnail/" + postData[0].mediapath;
							}else{
								notification.rightimage = "img/Group/post/" + postData[0].mediapath;
							}
							notification.link = "groupposts/" + postData[0]._id;
							notification.leftimage = "img/" + user[0].image;
							notification.message = user[0].display_name + " likes your post";
							console.log("Finally inserting data to gNotifiction");
							gNotificationCollection.insert(notification, {safe: true}, function(err, insertedData){
								if(err){
									console.log("Error like data inserting in group notification ");
									return;
								}
								console.log("Data inserted in group notification");
								return;
							});


						}

					});

					if( userId !== user[0]._id.toString() ){
						console.log("Inside: ");
						

						db.collection('groupnotifications', function(err, gNotificationCollection){
							if(err){
								console.log("Error retrieving group Notificaton collection: ", err);
								return;
							}


						});
					}
				});
			});
			
		});
	});
};
*/

exports.likePostofGroup = function(req, res){
     console.log("THis is body: ", req.body);
    console.log("This is paraeter: ", req.params.postid);

	var userId = req.body.user_id;
    //userId = userId.substr(1, userId.length-1);
	if(userId === "undefined" || userId.length !== 24){
		res.send(false);
		return;
	}
	db.collection('groupposts', function(err, gPostCollection){
		if(err){
			console.log("Error in retrieving ");
		}   
		var likeObject = {};
	    likeObject.user_id = userId.toString();
		likeObject.id = new ObjectId();
		likeObject.created = new Date();
		gPostCollection.findAndModify( {
									"_id": new BSON.ObjectID(req.params.postid), 
									"likes.user_id": {$ne: userId}
									}, 
									[],		//Sorting Order
									{$push: {likes: likeObject} }, 
									{}, 	//Options (upsert/new/remove)
									function(err, updatedData){
			if(err){
				console.log("Error while adding like to group post", err);
				res.send(false);
				return;
			}
			console.log("THis is updated data: ", updatedData);
			//res.send(true);
			db.collection('users', function(err, collection) {
				collection.find({ '_id': new BSON.ObjectID(userId) }, { "display_name": 1,  "image":1, "email": 1})
								.limit(1)
								.toArray(function(err, user) {
					// console.log(user);
		            if(err){
						console.log("Error while adding comment to group post", err);
						res.send(false);
						return;
					}
					if(user.length === 0){
						console.log("No user");
						res.send(false);
						return;
					}
		            likeObject.display_name = user[0].display_name;
		            likeObject.image = user[0].image;
		            res.send(likeObject);
		            //return;

					if( updatedData.user_id.toString() !== userId ){
						var mailOptions = {
							from: "Ballroom Dance  <viral@bugletech.com>", // sender address
							to: user[0].email, // list of receivers
							subject: "Ballroom Dance - New Notification", // Subject line
							text: user[0].display_name + "likes your post", // plaintext body
						}
						smtpTransport.sendMail(mailOptions, function(error, response) {
							if (error) {
								console.log(error);
							} else {
								console.log("Message sent: " + response.message);
							}
						});

						var notification = {};
						notification.created = new Date();
						notification.seen = 0;
						notification.loginuserid = userId;
						if(updatedData.mediatype === "video"){
							notification.rightimage = "img/Group/thumbnail/" + updatedData.mediapath;
						}else{
							notification.rightimage = "img/Group/post/" + updatedData.mediapath;
						}
						notification.link = "groupposts/" + updatedData._id;
						notification.leftimage = "img/" + user[0].image;
						notification.message = user[0].display_name + " likes your post";
						console.log("Finally inserting data to gNotifiction");
						db.collection('groupnotifications', function(err, gNotificationCollection){
							if(err){
								console.log("Error retrieving gorup notification collection");
								return;
							}
							gNotificationCollection.insert(notification, {safe: true}, function(err, insertedData){
								if(err){
									console.log("Error like data inserting in group notification ");
									return;
								}
								console.log("Data inserted in group notification");
								return;
							});							
						});
					}

				});
			});
			
		});
	});
};

/*

exports.commentOnGroupPostTest = function(req, res){
    var userId = req.body.user_id;
    var comment = req.body.comment;
    if(typeof req.body.comment === "undefined" || req.body.comment === "" || req.body.comment === null){
		res.send(false);
		return;
	}
    //userId = userId.substr(1, userId.length-1);
	if(userId === "undefined" || userId.length !== 24){
		res.send(false);
		return;
	}
	db.collection('groupposts', function(err, gPostCollection){
		if(err){
			console.log("Error in retrieving ");
            return;
		}   
		var commentObject = {};
	    commentObject.user_id = userId.toString();
		commentObject.id = new ObjectId();
        commentObject.comment = comment;
		commentObject.created = new Date();
		gPostCollection.update({"_id": new BSON.ObjectID(req.params.postid)}, {$push: {comments: commentObject} }, {safe: true}, function(err, updatedData){
			if(err){
				console.log("Error while adding comment to group post", err);
				res.send(false);
				return;
			}console.log("WOW", updatedData);
			db.collection('users', function(err, collection) {
				collection.find({ '_id': new BSON.ObjectID(userId) }, { "display_name": 1,  "image":1, "email": 1}).toArray(function(err, user) {
					// console.log(user);
		            if(err){
						console.log("Error while adding comment to group post", err);
						res.send(false);
						return;
					}
					if(user.length === 0){
						console.log("No user");
						res.send(false);
						return;
					}
		            var obj = {};
		            obj.comment = commentObject.comment;
		            obj.created = commentObject.created;
		            obj.display_name = user[0].display_name;
		            obj.image = user[0].image;
		            obj.user_id = user[0]._id;
		            obj._id = commentObject.id;
		            res.send(obj);
		            //return;
					if( userId !== user[0]._id.toString() ){
						var mailOptions = {
							from: "Ballroom Dance  <viral@bugletech.com>", // sender address
							to: user[0].email, // list of receivers
							subject: "Ballroom Dance - New Notification", // Subject line
							text: user[0].display_name + " commented on your post", // plaintext body
						}
						smtpTransport.sendMail(mailOptions, function(error, response) {
							if (error) {
								console.log(error);
							} else {
								console.log("Message sent: " + response.message);
							}
						});

						db.collection('groupnotifications', function(err, gNotificationCollection){
							if(err){
								console.log("Error retrieving group Notificaton collection: ", err);
								return;
							}
							gPostCollection.find({"_id": new BSON.ObjectID(req.params.postid)}).limit(1).toArray(function(err, postData){
								if(err){
									console.log("Error finding one post in goupposts to create notification");
									return;
								}
								var notification = {};
								notification.created = new Date();
								notification.seen = 0;
								notification.loginuserid = userId;
								if(postData[0].mediatype === "video"){
									notification.rightimage = "img/Group/thumbnail/" + postData[0].mediapath
								}else{
									notification.rightimage = "img/Group/post/" + postData[0].mediapath
								}
								notification.link = "groupposts/" + postData[0]._id;
								notification.leftimage = "img/" + user[0].image;
								notification.message = user[0].display_name + "commented on your post";

								gNotificationCollection.insert(notification, {safe: true}, function(err, insertedData){
									if(err){
										console.log("Error like data inserting in group notification ");
										return;
									}
									console.log("Data inserted in group notification");
									return;
								});
							});

						});
					}
				});
			});

		});
	});

};
*/

exports.commentOnGroupPost = function(req, res){
    var userId = req.body.user_id;
    var comment = req.body.comment;
    if(typeof req.body.comment === "undefined" || req.body.comment === "" || req.body.comment === null){
		res.send(false);
		return;
	}
    //userId = userId.substr(1, userId.length-1);
	if(userId === "undefined" || userId.length !== 24){
		res.send(false);
		return;
	}
	db.collection('groupposts', function(err, gPostCollection){
		if(err){
			console.log("Error in retrieving ");
            return;
		}   
		var commentObject = {};
	    commentObject.user_id = userId.toString();
		commentObject.id = new ObjectId();
        commentObject.comment = comment;
		commentObject.created = new Date();
		gPostCollection.findAndModify({"_id": new BSON.ObjectID(req.params.postid)
									  }, 
									[],
									{$push: {comments: commentObject} }, 
									{},
									function(err, updatedData){
			if(err){
				console.log("Error while adding comment to group post", err);
				res.send(false);
				return;
			}console.log("Updated Data: ", updatedData);
			db.collection('users', function(err, collection) {
				collection.find({ '_id': new BSON.ObjectID(userId) }, { "display_name": 1,  "image":1, "email": 1}).toArray(function(err, user) {
					// console.log(user);
		            if(err){
						console.log("Error while adding comment to group post", err);
						res.send(false);
						return;
					}
					if(user.length === 0){
						console.log("No user");
						res.send(false);
						return;
					}
		            var obj = {};
		            obj.comment = commentObject.comment;
		            obj.created = commentObject.created;
		            obj.display_name = user[0].display_name;
		            obj.image = user[0].image;
		            obj.user_id = user[0]._id;
		            obj._id = commentObject.id;
		            res.send(obj);
		            //return;
					if( userId !== updatedData.user_id ){
						var mailOptions = {
							from: "Ballroom Dance  <viral@bugletech.com>", // sender address
							to: user[0].email, // list of receivers
							subject: "Ballroom Dance - New Notification", // Subject line
							text: user[0].display_name + " commented on your post", // plaintext body
						}
						smtpTransport.sendMail(mailOptions, function(error, response) {
							if (error) {
								console.log(error);
							} else {
								console.log("Message sent: " + response.message);
							}
						});

						db.collection('groupnotifications', function(err, gNotificationCollection){
							if(err){
								console.log("Error retrieving group Notificaton collection: ", err);
								return;
							}

							var notification = {};
							notification.created = new Date();
							notification.seen = 0;
							notification.loginuserid = userId;
							if(updatedData.mediatype === "video"){
								notification.rightimage = "img/Group/thumbnail/" + updatedData.mediapath
							}else{
								notification.rightimage = "img/Group/post/" + updatedData.mediapath
							}
							notification.link = "groupposts/" + updatedData._id;
							notification.leftimage = "img/" + user[0].image;
							notification.message = user[0].display_name + " commented on your post";

							gNotificationCollection.insert(notification, {safe: true}, function(err, insertedData){
								if(err){
									console.log("Error like data inserting in group notification ");
									return;
								}
								console.log("Data inserted in group notification");
								return;
							});


						});
					}
				});
			});

		});
	});

};


