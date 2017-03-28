var mongo = require('mongodb');
var nodemailer = require("nodemailer");
var util = require("util");
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "viral@bugletech.com",
        pass: "bugle.123"
    }
});

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

exports.finduserbyid = function(req,res) {
    var id = req.params.id;

    var field = req.query.field;
    if(typeof field=="undefined") {
        var map = {};
    }    
    else {
        var map = {};
        var tokens = field.split(',');
        for (var i=tokens.length; i--;) map[tokens[i]]=1;
    }
    db.collection('users', function(err, collection) {
        collection.find({'_id':new BSON.ObjectID(id)},map, function(err, item) {
            console.log(item);
            res.send(item);
        });
    });
}


exports.findById = function(req, res) {
    var path = req.path;
    var patharray = path.split("/");
    var dbname = patharray[1];
    var id = req.params.id;
    var field = req.query.field;
    if(typeof field=="undefined") {
        var map = {};
    }    
    else {
        var map = {};
        var tokens = field.split(',');
        for (var i=tokens.length; i--;) map[tokens[i]]=1;
    }
    db.collection(dbname, function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)},map, function(err, item) {
            console.log("inside");
            res.send(item);
        });
    });
};

exports.findAll = function(req, res) {
    console.log("Fist Call" + new Date());
    var query = req.query;
    console.log(query);
    var field = req.query.field;
    var limit = parseInt(0);
    var skip = parseInt(0);
    if(typeof field=="undefined") {
        var map = {};
    }    
    else {
        var key = "field";
	limit = parseInt(query['limit']);
	skip = parseInt(query['skip']);
        delete query[key];
	delete query['limit'];
        delete query['skip'];
        var map = {};
        var tokens = field.split(',');
        for (var i=tokens.length; i--;) map[tokens[i]]=1;
    }JSON.stringify({});
    console.log("LImit");
    console.log(limit);
    var tablename = req.path;
	console.log("Req.path: ", tablename);
    dbname = tablename.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
    db.collection(dbname, function(err, collection) {
       
        collection.find(query,map,{sort:{"_id":-1}}).limit(limit).skip(skip).toArray(function(err, items) {
		console.log("Response 1 " + new Date());
		if(err) {
		    console.log(err);
          	} else {
		  res.send(items);
		  console.log("Users List : " + items);
		  console.log("Response 2 " + new Date());
		}
        });
    });
};

exports.findColumn = function(req, res) {
    var query = req.query;
    console.log("Query"  + query);
    var path = req.path;
    var patharray = path.split("/");
    var dbname = patharray[1];
    var id = req.params.id;
    var field = req.params.name;
    var limit = 0;
    var skip = 0;
    if(typeof field=="undefined") {
        var map = {};
    }    
    else {
	if(query['limit']) {
	    limit = parseInt(query['limit']);
	    delete query['limit'];
	}
	if(query['skip']) {	
            skip = parseInt(query['skip']);
            delete query['skip'];
	}        

        var map = {};
        var tokens = field.split(',');
        for (var i=tokens.length; i--;) map[tokens[i]]=1;
    }
    db.collection(dbname, function(err, collection) {
        collection.find({'_id':new BSON.ObjectID(id)},map).toArray(function(err, items) {
	   
            if(field === "likes") {
               if(typeof items[0].likes == "undefined" || items[0].likes === '') {
                    res.send(false);
		    return;
                } else {
                var total_items = items[0].likes.length;

                for(i = 0;i < items[0].likes.length; i++) {
                     
                     var userid = items[0].likes[i].user_id;
                     db.collection('users', function(err, collection) {
			  if(err) {
                          	res.send(false);
				return;
			  } else {
                          var newid = userid;
                          var likesdata = items; 
                          var cnt = i;
                          collection.findOne({'_id':new BSON.ObjectID(newid)},{display_name:1,image:1},function(err, item) {
                                if(err) {
                                  res.send("false");
                                } else { 
				  
                                  likesdata[0].likes[cnt]["display_name"] = item.display_name;       
                                  likesdata[0].likes[cnt]["image"] = item.image;
                                  console.log(likesdata[0].likes); 
                                  total_items = total_items - 1;
                                  if(total_items==0) {
                                    res.send(likesdata);
				    return;
                                  }                      
                                  
                                }
                            });
			  }
                        }); 

                }
		return;
	      }
            }
	    	   
            if(field === "comments") {
                if(typeof items[0].comments == "undefined" || items[0].comments === '') {
                    res.send(false);
		    return;
                } else {
                var total_items = items[0].comments.length;

                for(i = 0;i < items[0].comments.length; i++) {
                     
                     var userid = items[0].comments[i].user_id;
                     db.collection('users', function(err, collection) {
			 if(err) {
			   res.send(false);
			   return;
			}
                        else {  
                          var newid = userid;
                          var commentsdata = items; 
                          var cnt = i;
                          collection.findOne({'_id':new BSON.ObjectID(newid)},{display_name:1,image:1},function(err, item) {
                                if(err) {
                                  res.send("false");
                                } else { 
				  
                                  commentsdata[0].comments[cnt]["display_name"] = item.display_name;       
                                  commentsdata[0].comments[cnt]["image"] = item.image;
                                  console.log(commentsdata[0].likes); 
                                  total_items = total_items - 1;
                                  if(total_items==0) {
                                    res.send(commentsdata);
				    return;
                                  }                      
                                  
                                }
                            });
			}
                        }); 

                }
		return
              }  
                
            }
            if(field=="following") {
                if(typeof items[0].following == "undefined" || items[0].following =='') {
                    res.send(false);
                }
                else {
                    var cnt = [];
		            console.log("first" + limit);
		            if(limit == 0) {
		    	        limit = items[0].following.length;
			            var totallimit = parseInt(limit);
		            }	
		            else {
		    	        var totallimit = parseInt(limit + skip);
		            }
        		    if(totallimit == skip) {
        		    	res.send(false);
        		    }
        		    console.log("Outside" + limit);
		            console.log("Following " + items[0].following);
                    for (var i = skip; i < totallimit; i++) {
                        var id = items[0].following[i].user_id;
                        db.collection('users', function(err, collection) {
                            var newid = id;
                            collection.findOne({'_id':new BSON.ObjectID(newid)},{display_name:1,about:1,image:1,following:1,followers:1},function(err, item) {
                                cnt.push(item);
                                if(cnt.length == (totallimit-skip)){
                                    res.send(cnt.sort(function(a,b){
                                    	return b['_id'] - a['_id'];
                                    }));
                                }
                            });
                        });                     
                    }
                }
            }
            else if(field == "followers") {
                if(typeof items[0].followers == "undefined" || items[0].followers=='') {
                    res.send(false);
                } else {
                    var cnt = [];
        		    if(limit == 0) {
        		    	limit = items[0].followers.length;
        			var totallimit = parseInt(limit);
        		    }	
        		    else {
        		    	var totallimit = parseInt(limit + skip);
        		    }
        		    if(totallimit == skip) {
        		    	res.send(false);
        		    }
                    for (var i = 0; i < totallimit; i++) {
                        var id = items[0].followers[i].user_id;
                        db.collection('users', function(err, collection) {
                            var newid = id;
                            collection.findOne({'_id':new BSON.ObjectID(newid)},{display_name:1,about:1,image:1,following:1,followers:1},function(err, item) {
                                cnt.push(item);
                                if(cnt.length == (totallimit-skip)){
                                    res.send(cnt.sort(function(a,b){
                                    	return b['_id'] - a['_id'];
                                    }));
                                }
                            });
                        });                     
                    }
                }
            } else {
                res.send(items);
            }
        });
    });
};

exports.updateById = function(req, res) {
    var newid = new ObjectId();
    var path = req.path;
    var patharray = path.split("/");
    var dbname = patharray[1];
    var id = req.params.id;
    var wine = req.body;
    var field = req.params.name;
    if(typeof field=="undefined") {
        var map = {};
    }    
    else {
        var map = {};
        var tokens = field.split(',');
        for (var i=tokens.length; i--;) map[tokens[i]]=wine;
        map[field]['id'] = newid;
        map[field]['created'] = new Date();
    }
    delete wine._id;
		console.log(map);
		//res.send(true);
		//return;
    db.collection(dbname, function(err, collection) {
        collection.findAndModify(
								{'_id':new BSON.ObjectID(id)},
								[],
								{$push:map},
								{safe:true},
								{},
						 function(err, result) {
            if (err) {
                console.log('Error updating wine: ' + err);
                 res.send(false);
            } else {
							//console.log("Result of updation: ", result);
               if(field == "members" || field == "followers") {  
               			res.send(wine);
							 }
                if(field == "comments" || field == "rsvps" || field == "likes") {
				
	                // console.log(id);
	                // console.log(wine.user_id);
	                var userid = wine.user_id;
	                var otherid = id;

	                var notification = {};
			var commentarry = wine;
		            db.collection('users', function(err, collection) {
		     			collection.find({'_id':new BSON.ObjectID(userid)},{display_name:1,_id:0,image:1,email:1}).toArray(function(err, users) {
		     			if(err) {
		     				console.log('Error updating wine: ' + err);
		     			}
		     			else {
		     				console.log(dbname);
									var comments = [];
									commentarry.display_name = users[0].display_name;
									commentarry.image = users[0].image;
								  console.log("new comment variable test" + commentarry);
									res.send(commentarry);
									if(userid != result.user_id){

		     					db.collection(dbname, function(err, collection) {
	  				      			collection.find({'_id':new BSON.ObjectID(otherid)}).toArray(function(err, others) {
	  				      				if(err) {
	  				      					console.log('Error updating wine: ' + err);	
	  				      				}else {
		             						// console.log(others);
		             						// console.log(users);
		             						// console.log(field);
		             						notification['loginuserid'] = others[0].user_id;
                                            console.log(others[0].email)
		             						notification['link'] =  dbname + "/" + others[0]._id;
                                            notification['seen'] = 0;
		             						notification['leftimage'] = "img/" + users[0].image;
		             						if(field == "comments") {
															if(others[0].mediatype == "video") {
			             							notification['rightimage'] = "img/thumbnail/" + others[0].mediapath;
															} else if(others[0].mediatype == "image") {
																notification['rightimage'] = "img/MediaDetail/" + others[0].mediapath;
															}		             								
																notification['message'] = users[0].display_name + " comment on your post";
             								}
		             						else if(field == "likes") {
		             							if(others[0].mediatype == "video") {
			             							notification['rightimage'] = "img/thumbnail/" + others[0].mediapath;
															} else if(others[0].mediatype == "image") {
																notification['rightimage'] = "img/MediaDetail/" + others[0].mediapath;
															}	
		             							notification['message'] = users[0].display_name + " likes on your post";
		             						}
		             						else if(field == "rsvps") {
		             							notification['rightimage'] = "img/Event/" + others[0].image;
		             							notification['message'] = users[0].display_name + " going to your event";
		             						}
															notification['created'] = new Date();
		             						console.log(notification);
		             						db.collection('notifications', function(err, collection) {
        										collection.insert(notification, {safe:true}, function(err, result) {
            										if (err) {
                										console.log({'error':'An error has occurred'});
            										} else {
                                                            db.collection('users', function(err, collection) {
                                                                collection.find({'_id':new BSON.ObjectID(others[0].user_id)},{email:1}).toArray(function(err, user) {
                                                                    // console.log(user);
                                                                    var mailOptions = {
                                                                        from: "Ballroom Dance  <viral@bugletech.com>", // sender address
                                                                        to: user[0].email, // list of receivers
                                                                        subject: "Ballroom Dance - New Notification", // Subject line
                                                                        text: notification['message'], // plaintext body
                                                                    }
                                                                    smtpTransport.sendMail(mailOptions, function(error, response){
                                                                        if(error){
                                                                            console.log(error);
                                                                        }else{
                                                                            console.log("Message sent: " + response.message);
                                                                        }
                                                                    });                        
                                                                });
                                                            });
                										console.log('Success: ' + JSON.stringify(result[0]));
                									}
        										});
    										});
	             						}
	        						});
	    						});
							}
							}
	             		});
		    		});
	            }
	            else if(field == "invites") {
								res.send(wine);
	            	console.log(id);
                	console.log(wine.user_id);
                	var inviteuserid = wine.user_id;
                	var eventid = id;
                	var notification = {};
                	db.collection('events', function(err, collection) {
	     				collection.find({'_id':new BSON.ObjectID(eventid)},{user_id:1,_id:1,image:1}).toArray(function(err, events) {
	     					if(err) {
	     						console.log('Error updating wine: ' + err);
	     					}
	     					else {
	     						console.log(events);
	     						var userid = events[0].user_id;
	     						db.collection('users', function(err, collection) {
	     							collection.find({'_id':new BSON.ObjectID(userid)},{display_name:1,_id:0,image:1}).toArray(function(err, users) {
	     								if(err) {
	     									console.log('Error updating wine: ' + err);
	     								}
	     								else {
	     									// console.log(users);
	     									notification['loginuserid'] = inviteuserid;
		             						notification['link'] = dbname + "/" + events[0]._id;
		             						notification['rightimage'] = "img/Event/" + events[0].image;
		             						notification['leftimage'] = "img/" + users[0].image;
                                            notification['seen'] = 0;
		             						notification['message'] = users[0].display_name + " invites you join an event";
		             						console.log(notification);
		             						db.collection('notifications', function(err, collection) {
        										collection.insert(notification, {safe:true}, function(err, result) {
            										if (err) {
                										console.log({'error':'An error has occurred'});
            										} else {
                                                            db.collection('users', function(err, collection) {
                                                                collection.find({'_id':new BSON.ObjectID(inviteuserid)},{email:1}).toArray(function(err, user) {
                                                                    console.log(user);
                                                                    var mailOptions = {
                                                                        from: "Ballroom Dance  <viral@bugletech.com>", // sender address
                                                                        to: user[0].email, // list of receivers
                                                                        subject: "Ballroom Dance - New Notification", // Subject line
                                                                        text: notification['message'], // plaintext body
                                                                    }
                                                                    smtpTransport.sendMail(mailOptions, function(error, response){
                                                                        if(error){
                                                                            console.log(error);
                                                                        }else{
                                                                            console.log("Message sent: " + response.message);
                                                                        }
                                                                    });                        
                                                                });
                                                            });                                                        
                										console.log('Success: ' + JSON.stringify(result[0]));
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
	            else if(field == "following") {
								res.send(wine);
	            	console.log(id);
                	console.log(wine.user_id);
                	var userid = id;
                	var folowerid = wine.user_id;
                	var notification = {};
                	db.collection('users', function(err, collection) {
	     				collection.find({'_id':new BSON.ObjectID(userid)},{display_name:1,image:1}).toArray(function(err, users) {
	     					if(err) {
	     						console.log('Error updating wine: ' + err);
	     					}
	     					else {
	     						console.log(users);
	     						notification['loginuserid'] = folowerid;
		             			notification['link'] =  'users' + "/" + userid;
		             			notification['leftimage'] = "img/" +  users[0].image;
                                notification['seen'] = 0;
											
		             			notification['message'] = users[0].display_name + " follow you";
		             			console.log(notification);	     						
           						db.collection('notifications', function(err, collection) {
									collection.insert(notification, {safe:true}, function(err, result) {
   										if (err) {
      										console.log({'error':'An error has occurred'});
        								} else {
                                            db.collection('users', function(err, collection) {
                                                collection.find({'_id':new BSON.ObjectID(folowerid)},{email:1}).toArray(function(err, user) {
                                                    console.log(user);
                                                    var mailOptions = {
                                                        from: "Ballroom Dance  <viral@bugletech.com>", // sender address
                                                        to: user[0].email, // list of receivers
                                                        subject: "Ballroom Dance - New Notification", // Subject line
                                                        text: notification['message'], // plaintext body
                                                    }
                                                    smtpTransport.sendMail(mailOptions, function(error, response){
                                                        if(error){
                                                            console.log(error);
                                                        }else{
                                                            console.log("Message sent: " + response.message);
                                                        }
                                                    });                        
                                                });
                                            });                                            
                							console.log('Success: ' + JSON.stringify(result[0]));
                						}
        							});
    							});
	     					}
	     				});
	     			});
	            }
            }
        });
    });
}

exports.deleteData = function(req, res) {
    var path = req.path;
    console.log(path);
    var patharray = path.split("/");
    var dbname = patharray[1];
    console.log(dbname);
    var id = req.params.id;
    console.log(id);
    console.log('Deleting wine: ' + id);
    db.collection(dbname, function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

exports.deleteArrayById = function(req, res) {
    var path = req.path;
    var patharray = path.split("/");
    var dbname = patharray[1];
    var docid = req.params.docid;
    console.log(docid);    
    console.log(dbname);
    var id = req.params.id;
    var field = req.params.name;
    if(typeof field=="undefined") {
        var map = {};
    }    
    else {
        var map = {};
        console.log(field);
        var tokens = field.split(',');
        wine = {}       ;
        wine['id'] = new BSON.ObjectID(docid);
        for (var i=tokens.length; i--;) map[tokens[i]]=wine;
    }
    console.log(map);    
    console.log('Deleting wine: ' + id);
    console.log(map);
    db.collection(dbname, function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)},{$pull:map} ,{safe:true}, function(err, result) {
            if (err) {
                res.send("false");
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send("true");
            }
        });
    });
};


exports.findTime = function(req, res){
	var obj = {};
    obj.now = new ObjectId();
    obj.now = obj.now.getTimestamp();
    res.send(obj);
};

