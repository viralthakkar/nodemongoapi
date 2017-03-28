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

exports.recommendUser = function(req, res){
    console.log(req.params.id);
    var id = req.params.id;
    db.collection('users', function(err, usrCollection) {
        usrCollection.find({'_id':new BSON.ObjectID(id)},{"state":1}).limit(1).toArray(function(err, item) {
            //res.send(item);
            if(err){
                res.send(false);
            }else{
                db.collection('users', function(err, collection){
                    console.log("This is state", item.state);
                    collection.find({'state': "item.state", "_id": {$ne: new BSON.ObjectID(id)}},{"_id":1, "display_name":1, "image":1}).toArray(function(err, users) {
                        //res.send(items);
                        if(err){
                            console.log("Error");
                            console.log(err);
                            res.send(false);
                        }else{
                            console.log("All Users");
                            console.log(users);
                            if(users.length !== 0){
                                var indx = Math.floor(Math.random()*((users.length-1)-0+1)+0);
                                res.send(users[indx]);
                            }else{
                                res.send(false);
                            }                            
                        }                        
                    });
                });
            }
        });
    });
};

exports.recommendGroups = function(req, res){
    
    db.collection('groups', function(err, usrCollection) {
        usrCollection.find({"recommend":1},{"_id":1, "name":1, "coverimage":1}).toArray(function(err, groups) {
            //res.send(item);
            if(err){
                console.log("RecommendGroup Error");
                res.send(false);
            }else{
                console.log("All Groups");
                console.log(groups);
                if(groups.length !== 0){
                    var indx = Math.floor(Math.random()*((groups.length-1)-0+1)+0);
                    res.send(groups[indx]);
                }else{
                    console.log("There is no group to recommend");
                    res.send(false);
                }       
            }                 
        });
    });
};

exports.recommendEvents = function(req, res){
    console.log(req.params.id);
    var id = req.params.id;
    db.collection('users', function(err, usrCollection) {
        usrCollection.find({'_id':new BSON.ObjectID(id)},{"state":1}).limit(1).toArray(function(err, item) {
            //res.send(item);
            if(err){
                res.send(false);
            }else{
                db.collection('events', function(err, collection){
                    console.log("This is state", item.state);
                    collection.find({'state': item.state, "_id": {$ne: new BSON.ObjectID(id)}},{"_id":1, "name":1, "image":1, "address": 1}).toArray(function(err, users) {
                        //res.send(items);
                        if(err){
                            console.log("Error");
                            console.log(err);
                            res.send(false);
                        }else{
                            console.log("All Users");
                            console.log(users);
                            if(users.length !== 0){
                                var indx = Math.floor(Math.random()*((users.length-1)-0+1)+0);                  //To generate random number between userlength and zero
                                res.send(users[indx]);                                                          //Sending the random indexed event
                            }else{
                                res.send(false);
                            }                            
                        }                        
                    });
                });
            }
        });
    });
};



exports.feedTest = function(req, res){
    var id = req.params.id;
    console.log("First");
		console.log("This is id: ", id);
		var query = req.query;
		console.log(query);
		var skip = Number(query.skip);
		var limit = Number(query.limit);
		if(isNaN(skip)){
			skip = 0;
		}
		if(isNaN(limit)){
			limit = 0;
		}
		
    db.collection('users', function(err, userCollection){
				if(err){
					console.log("This is an error while retrieving UserCollection in FeedPosts in feed.js");
					res.send(false);
					return;
				}
		
				userCollection.find({'_id':new BSON.ObjectID(id)},{"following":1}).limit(1).toArray(function(err, followers) {
							if(err){
								console.log('Oops! error');
								console.log(err);
								res.send(false);
								return;
							}else{
											db.collection('lastfeedcall', function(err, feedCallCollection){
												feedCallCollection.update({"user_id":id},{ $set: { "lastcall": new ObjectId()} } ,{safe:true}, function(feederr, result) {
													if(feederr){
														console.log("This is an error while updating lastfeedcall in feedposts");
													}
													else{
														console.log("lastcall modified in feedposts :)");
													}
												});
											});

											obj = {};
											obj['user_id'] = id;
											if(typeof followers[0].following === "undefined"){
												followers.following = [];
											}else{
												followers.following = followers[0].following;
												delete followers[0].following;
											}
											delete followers._id;
											followers.following.push(obj);
											console.log("Total following: ", followers.following);
											var allPosts = [];
											var post_collection = null;
											var fetch_users = function() {
													console.log(typeof  followers.following);
													if(typeof followers.following == "undefined"){
														console.log("This user does not have any followers")
														res.send(false);
														return;
													}
													var count = followers.following.length;
													var totalFolowing = count;
														for(var i=0; i<totalFolowing; ++i) {
															get_user(i, function() {
										 	           // Each time a query for one user is done we decrement the counter
										 	           count--;
										 	          // When the counter is 0 we know that all queries have been done
										 	          if(count === 0) {
													//	 			 console.log(allPosts);
																	 if(allPosts.length == 0){
										 		   	         res.send(false);
												 						 return;
																	 }
																 	eventEmitter.emit("fetchUserDetail", allPosts);
																}
														 });
													 };    
											};

											var get_user = function(i, callback) {
													console.log("This is for user:", followers.following[i]['user_id']);
													console.log("This is skip: ", skip);
													console.log("This is limit: ", limit);

													post_collection
															.find({"user_id": followers.following[i]['user_id']})
															.skip(Number(skip))
															.limit(Number(limit))
															.sort({"_id": -1})
															.toArray(function(err, post) {

																// Do something when you get error
																// Always call the callback function if there is one
																if(err) {
																    callback();
																    console.log("This is error: ", err);
																    return;
																}
												//				console.log("Post Length is: ", post.length);
																  for(var j=0; j<post.length; ++j) {
																      post[j]['created'] = ObjectId(post[j]['_id'].toString()).getTimestamp();
																			post[j]['date'] = post[j]['created'].toString().substr(4,11);
																      post[j]['time'] = post[j]['created'].toString().substr(16, 24);
																      allPosts.push(post[j]);
																  }
																  callback();
															});
											};

											// Get the collection, check for errors and then cache it!
											db.collection('posts', function(err, postCollection) {
													// Always check for database errors
													if(err) {
															console.log(err);
															res.send(false);
															return;
													}

													post_collection = postCollection;
													fetch_users();
											});


											 var get_user_detail = function(allPosts, i, usrCollection, callbak){
										//	 	console.log("Value of i in feed posts: ", i);
												usrCollection.find({"_id": new BSON.ObjectID(allPosts[i]['user_id'])}, 
																						{"display_name":1, "image": 1})
																						.limit(1)
																						.toArray(function	(err,user) {               
																								if(err){
																									console.log("Error getting user feedPosts");
																									res.send(false);
																									return;
																								}console.log(user);
																								allPosts[i]['display_name'] = user[0].display_name;
																								allPosts[i]['image'] = user[0].image;
																						//		console.log("FeedPosts: Calling callbak in get_user_detail with i: ", i);
																								callbak();
																							});
												};

											eventEmitter.once('fetchUserDetail', function(allPosts){
												console.log("Here in event handler");

												var totalPosts = allPosts.length;
												for(var i=0; i< totalPosts; ++i){
													get_user_detail(allPosts, i, userCollection, function(){
														totalPosts--;
														if(totalPosts === 0){
															try{
																if(!res.headersSent){
																	if(allPosts.length == 1){
																		res.send(allPosts);
																		console.log(allPosts);
																		return;
																	}else{
																		res.send(allPosts.sort(function(a, b){
												 	        		return b.created - a.created;
																		}));
		                                console.log("LAST");
																		//console.log(allPosts);
																		return;
																	}
																	return;
																}
															}catch(err){
																	console.log("Error while sending posts", err);
                                  console.log("LAST");
																	res.send(allPosts);
															}
															
														}
													});
												}
											});
						 				}
				    	});
			});
};
/*
exports.feedRecentPosts = function(req, res){
    var id = req.params.id;

    db.collection('users', function(usrerr, userCollection){
	if(usrerr){
	  console.log("This is an error while retrieving userCollection in feedPosts in feed.js");
	  res.send(false);
	  return;
	}
	userCollection.findOne({"_id": new BSON.ObjectID(id)}, {"following": 1}, function(err, user){
            if(err || !user){
                res.send(false);
                console.log("Error while getting user followers in feedRecentPosts");
                return;
        }else{
                var lstCall = null;
                
		obj = {};
                obj['user_id'] = id;
                if(typeof user.following == "undefined"){
                    user.following = [];
                }
                user.following.push(obj);

                var get_lastcall = function(lstCall){
                    feed_collection.findOne({"user_id": user._id}, function(err, lastfeed){
            if(lastfeed.lastcall == ""){
                            lstCall = lastfeed._id;
                        }else{
                            lstCall = lastfeed.lastcall;
                        }console.log("This is lstcall: ", lstCall);
                        console.log("This is last lastfeed:", lastfeed);
                        var allPosts = [];
                        var post_collection = null;

                        var fetch_users = function() {
                            if(typeof user.following === "undefined" || user === null){              //There is no follower of user, nothing to do
                                res.send(false);
                                console.log("This is followers:", user.following);
                                return;
                            }var count = user.following.length;
                            for(var i=0; i<user.following.length; ++i) {
                                get_user(i, function() {
                                    // Each time a query for one user is done we decrement the counter
                                    count--;
				// When the counter is 0 we know that all queries have been done
				if(count === 0) {
                                        console.log(allPosts);
                                        if(allPosts.length == 0){
                                            res.send(false);
                                            return;
                                        }
					console.log("This is all posts", allPosts);
					eventEmitter.emit("fetchUserDetail", allPosts);
                                        //res.send(allPosts.sort(function(a, b){
                                        //    return b.created - a.created;
                                        //}));
                                        set_lastcall();
                                        //return;
                                 }
				});
                            };    
                        };

			var get_user = function(i, callback) {
                            post_collection
                                .find({ $and: [{"_id": { $gte: lstCall }, 
                                                "user_id" : user.following[i]['user_id']
                                              }]
                                        })
                                .toArray(function(err, post) {

				// Do something when you get error
	                       // Always call the callback function if there is one
	                       if(err) {
                                        callback();
                                        console.log("This is error: ", err);
                                        return;
                                    }
                                    console.log("Post Length is: ", post.length);
				for(var j=0; j<post.length; ++j) {
                                        post[j]['created'] = ObjectId(post[j]['_id'].toString()).getTimestamp();
				 	post[j]['date'] = post[j]['created'].toString().substr(4,11);
        	                        post[j]['time'] = post[j]['created'].toString().substr(16, 24);

                                        allPosts.push(post[j]);
                                    }
                                    callback();
                                });
                        };
			
			var set_lastcall = function(){
                            feed_collection.update({"user_id": user._id }, { $set: { "lastcall": new ObjectId()} }, function(err, updatedFeed){
                                if(err){
                                    console.log("This is error in feed_collection in updating lastcall", err);
                                }else{
                                    console.log("Here is updated feed:", updatedFeed);    
                                }
                                
                            });
                        };
			// Get the collection, check for errors and then cache it!
			db.collection('posts', function(err, postCollection) {
				if(err) {
                                console.log(err);
                                res.send(false);
                                return;
                            }

                            post_collection = postCollection;
                            fetch_users();
                        });
                    });

                };

		var get_user_detail = function(i, allPosts, usrCollection, callbak){
					console.log("Value of i in feed recent posts: ", i);
                    usrCollection.findOne({"_id": new BSON.ObjectID(allPosts[i]['user_id'])},
                                              {"display_name":1, "image": 1},
                                              function(err, user){
                                                if(err){
                                                    console.log("Error getting user feedPosts");
                                                    res.send(false);
                                                    return;
                                                }
						allPosts[i]['display_name'] = user.display_name;
                                                allPosts[i]['image'] = user.image;
						if(i < allPosts.length)
	                                                callbak();
                                              }
                                            )
                };

		eventEmitter.once('fetchUserDetail', function(allPosts){
		    //console.log("This is all posts-2: ", allPosts);
                    totalPosts = allPosts.length;
                    for(var i=0; i< totalPosts; ++i){
                        get_user_detail(i, allPosts, userCollection, function(){
			if(totalPosts >= 0){
                            totalPosts--;
                            //console.log("totalPosts: ", totalPosts);
			
			    if(totalPosts == 0){
				console.log("Now total posts are zero");
				console.log("All posts Length: ", allPosts.length);

				if(allPosts.length ==1){
					console.log("Posts arr SINGLE");
					console.log("Posts to send, finally: ", allPosts);
					if(res.send(allPosts)){
						console.log("Posts sent");
					}else{
					console.log("Error sending posts");
					}
					
					return;
				}else{
					console.log("Posts are multiple");
					res.send(allPosts.sort(function(a, b){
                                           return b.created - a.created;
	                                 }));
					return;
				}
                            }
			}
                        });
                    }
                });




		db.collection('lastfeedcall', function(err, feedCallCollection){
                    if(err){
                        console.log("Error while retrieving feedCallCollection object");
                        return;
                    }else{
                        feed_collection = feedCallCollection;
                        get_lastcall(lstCall);

                    }
                });

            }
        });
    });
};
*/


exports.feedRecentPosts = function (req, res) {
    var id = req.params.id;

    db.collection('users', function (usrerr, userCollection) {
        if (usrerr) {
            console.log("This is an error while retrieving userCollection in feedPosts in feed.js");
            res.send(false);
            return;
        }
        userCollection.findOne({
            "_id": new BSON.ObjectID(id)
        }, {
            "following": 1
        }, function (err, user) {
            if (err || !user) {
                res.send(false);
                console.log("Error while getting user followers in feedRecentPosts");
                return;
            } else {
                var lstCall = null;

                var obj = {};
                obj['user_id'] = id;
                if (typeof user.following == "undefined") {
                    user.following = [];
                }
                user.following.push(obj);
				user = user.following;
				//console.log("Users: ", user);
                var a = [];
                for (var i = 0; i < user.length; i++) {
					a[i] = user[i].user_id;
                }
                user = a;
				console.log("Listing users: ", user);
                var get_lastcall = function (lstCall) {

					//console.log("This is feed collection: ", feed_collection);
					//console.log("This is userID: ", id);
                    feed_collection.findOne({ "user_id": new BSON.ObjectID(id) }, function (err, lastfeed) {
						if(err) {

							console.log("Error retrieving data");
							res.send(false);
							return;
						}

						if (lastfeed.lastcall == "") {
                            lstCall = lastfeed._id;
                        } else {
                            lstCall = lastfeed.lastcall;
                        }
                        //console.log("This is lstcall: ", lstCall);

                        var allPosts = [];

                        feed_collection.update({ "user_id": new BSON.ObjectID(req.params.id) }, { $set: { "lastcall": new ObjectId() } },{safe: true},  function (err, updatedFeed) {
                            if (err) {
                                console.log("This is error in feed_collection in updating lastcall", err);
                            } else {
                                console.log("Here is updated feed:", updatedFeed);
                            }

                        });
							//console.log("Listing users: ", user);
                        // Get the collection, check for errors and then cache it!
                        db.collection('posts', function (err, postCollection) {
                            if (err) {
                                console.log(err);
                                res.send(false);
                                return;
                            }
							//console.log("Listing users: ", user);
							//console.log("Type of lstcall: ", lstCall);
                            postCollection.find({"user_id": {$in: user}, "_id": { $gte: lstCall } }).sort({ "_id": -1 }).toArray(function (err, posts) {
                                if (err) {
                                    console.log("Error");
                                    res.send(false);
									return;
                                }
                                //res.send(posts);
								//console.log("These are posts: ", posts);
                                if (posts.length === 0) {
                                    res.send(false);
                                    return;
                                }
                                eventEmitter.emit('fetchedfollowers', posts);

                            });
                        });
                    });

                };

                var get_user_detail = function (i, allPosts, usrCollection, callbak) {
                    console.log("Value of i in feed recent posts: ", i);
                    usrCollection.findOne({
                            "_id": new BSON.ObjectID(allPosts[i]['user_id'])
                        }, {
                            "display_name": 1,
                            "image": 1
                        },
                        function (err, user) {
                            if (err) {
                                console.log("Error getting user feedPosts");
                                res.send(false);
                                return;
                            }
                            allPosts[i]['display_name'] = user.display_name;
                            allPosts[i]['image'] = user.image;
                            allPosts[i]['created'] = ObjectId(allPosts[i]['_id'].toString()).getTimestamp();
                            allPosts[i]['date'] = allPosts[i]['created'].toString().substr(4, 11);
                            allPosts[i]['time'] = allPosts[i]['created'].toString().substr(16, 24);
                            if (i < allPosts.length)
                                callbak();
                        }
                    )
                };

                eventEmitter.once('fetchedfollowers', function (allPosts) {
                    //console.log("This is all posts-2: ", allPosts);
                    totalPosts = allPosts.length;
                    for (var i = 0; i < totalPosts; ++i) {
                        get_user_detail(i, allPosts, userCollection, function () {
                            if (totalPosts >= 0) {
                                totalPosts--;
                                //console.log("totalPosts: ", totalPosts);

                                if (totalPosts == 0) {
                                    //console.log("Now total posts are zero");
                                    //console.log("All posts Length: ", allPosts.length);
                                    //console.log("Posts to send, finally: ", allPosts);
                                    if(!res.headersSent){
										res.send(allPosts);
									}
									return;
                                }
                            }
                        });
                    }
                });


                db.collection('lastfeedcall', function (err, feedCallCollection) {
                    if (err) {
                        console.log("Error while retrieving feedCallCollection object");
                        return;
                    } else {
                        feed_collection = feedCallCollection;
						console.log("Calling get_lastcall");
                        get_lastcall(lstCall);

                    }
                });

            }
        });
    });
};

exports.feedPosts = function(req, res){
	var user_id = req.params.id;
	var skip = Number(req.query.skip);
	var limit = Number(req.query.limit);

	db.collection('users', function(err, usrCollection){
		if(err){
			console.log("Error");
			res.send(false);
			return;
		}
		usrCollection.find({"_id": new BSON.ObjectID(user_id)}, 
							{"following": 1})
							.limit(1)
							.toArray(function(err, user){
				if(err){
					console.log("Error");
					res.send(false);
					return;
				}

				db.collection('lastfeedcall', function(err, feedCallCollection){
					feedCallCollection.update({"user_id":user_id},{ $set: { "lastcall": new ObjectId()} } ,{safe:true}, function(feederr, result) {
						if(feederr){
							console.log("This is an error while updating lastfeedcall in feedposts");
						}
						else{
							console.log("lastcall modified in feedposts :)");
						}
					});
				});

				obj = {};
				obj['user_id'] = user_id;
				if(typeof user[0].following === "undefined"){
					user.following = [];
				}else{
					user.following = user[0].following;
				}
				user.following.push(obj);
				user = user.following;
				var a = [];
				for(var i=0; i< user.length; i++){
					a[i] = user[i].user_id;
				}
				user = a;

				db.collection('posts', function(err, postCollection){
					if(err){
						console.log("Error");
						res.send(false);
						return;
					}
					postCollection.find({ "user_id": { $in : user } }).sort({"_id": -1}).skip(skip).limit(limit).toArray(function(err, posts){
						if(err){
							console.log("Error");
							res.send(false);
						}
						//res.send(posts);
						if(posts.length === 0){
							res.send(false);
							return;
						}
						eventEmitter.emit('fetchedposts', posts);
					});
				});

				var get_user = function(i, posts, callback) {
						usrCollection.find({"_id": new BSON.ObjectID(posts[i].user_id)},
												{"display_name": 1, "image": 1})
												.limit(1)
												.toArray(function(err, usrData){

								posts[i]['display_name'] = usrData[0]['display_name'];
								posts[i]['image'] = usrData[0]['image'];
								posts[i]['created'] = ObjectId(posts[i]['_id'].toString()).getTimestamp();
								posts[i]['date'] = posts[i]['created'].toString().substr(4,11);
								posts[i]['time'] = posts[i]['created'].toString().substr(16, 24);
								callback();
							});

				};			


				eventEmitter.once('fetchedposts', function(posts){
					var totalPosts = posts.length;

					for(var i=0; i< totalPosts; ++i){
							get_user(i, posts, function(){
								totalPosts--;
								if(totalPosts === 0){
									if(!res.headersSent){
										res.send(posts);
									}
								}
							});
							
						}

				});
				
			});
		});

};


exports.likeOnPost = function(req, res){

	var postId = req.params.id;
	var userId = req.body.user_id;
	if(postId.length !== 24 || userId.length !== 24){
		res.send(false);
		console.log("Invalid UserID or PostID");
		return;
	}

	db.collection('posts', function(err, postCollection){
		if(err){
			console.log("Error reteieving Post Collection in Like on post, feed.js");
			res.send(false);
			return;
		}
		var likeObject = {};
		likeObject.user_id = userId;
		likeObject.id = new ObjectId();
		likeObject.created = new Date();
		postCollection.findAndModify(
									{"_id": new BSON.ObjectID(postId), "likes.user_id": {$ne: userId}},
									[],
									{$push: {"likes": likeObject} },
									{},
									function(err, likedPost){
			if(err){
				console.log("Error adding like to post");
				res.send(false);
				return;
			}

			db.collection('users', function(err, userCollection) {
				userCollection.find({ '_id': new BSON.ObjectID(userId) }, { "display_name": 1,  "image":1, "email": 1})
							.limit(1)
							.toArray(function(err, user) {
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
					console.log("Post wala user: ", likedPost.user_id);
					console.log("User wala user: ", userId);

					if( likedPost.user_id.toString() !== userId.toString() ){
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
						if(likeObject.mediatype === "video"){
							notification.rightimage = "img/thumbnail/" + likeObject.mediapath;
						}else{
							notification.rightimage = "img/MediaDetail/" + likeObject.mediapath;
						}
						notification.link = "posts/" + likeObject._id;
						notification.leftimage = "img/" + user[0].image;
						notification.message = user[0].display_name + " likes your post";
						console.log("Finally inserting data to notifiction for like");
						db.collection('notifications', function(err, notificationCollection){
							if(err){
								console.log("Error retrieving gorup notification collection");
								return;
							}
							notificationCollection.insert(notification, {safe: true}, function(err, insertedData){
								if(err){
									console.log("Error like data inserting in group notification ");
									return;
								}
								console.log("Data inserted in notification");
								return;
							});
							db.close();
						});
					}

				});
			});
		});
	});

};
