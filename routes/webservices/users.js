var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

var nodemailer = require("nodemailer");
var fs = require('fs');
var formidable = require('formidable');
var gm = require('gm').subClass({ imageMagick: true });

var util = require('util');
var exec = require('child_process').exec;
var uuid = require('node-uuid');
var events = require('events');
var eventEmitter = new events.EventEmitter();
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

exports.login = function(req, res) {
	console.log("FIRST", new Date());
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        console.log(fields);
        var newid = new ObjectId();
        var displaydata =  fields['display_name'];
        var display_name = {};
        display_name['display_name']  = displaydata;
        var passworddata =  fields['password'];
        var password = {};
        password['password']  = passworddata;
        var user = [display_name,password];

        db.collection('users', function(err, collection) {
            collection.findOne({$and:user}, function(err, item) {
				var obj = {};
//console.log("This is user found: ", item);
                if(err) {
					console.log("error: ", err);
					obj.result = false;
					obj.msg = "Error occured. Please try after sometime";
                    res.send(obj);
					return;
                }else if(item == null){
					db.collection('pendingusers', function(err, pUserCollection){
						var obj = {};
						if(err){
							console.log("Error while retrieving pendig user collection");
							obj.status = false;
							obj.msg = "Error occured. Please try after sometime";
							res.send(obj);
							return;
						}else{
							pUserCollection.findOne({"display_name": display_name['display_name']}, function(err, result){
								if(err){
									console.log("Error while findOne email: login");
									obj.status = false;
									obj.msg = "Error occured. Please try after sometime";
									res.send(obj);
									return;
								}else if(result == null){
									console.log("No Account found");
									obj.status = false;
									obj.msg = "No account found with your credentials";
									res.send(obj);
									return;
								}else{
									console.log("FoundOne in pending users");
									obj.status = false;
									obj.msg = "You are registered already. Please check your mail to verify your account";
									res.send(obj);
									return;
								}
							});
						}
					});					
				}
                else {
                    var loggedin = {};
                    loggedin['user_id'] = item._id;
                    loggedin['login_id'] = newid;
                    db.collection('sessions', function(err, collection) {
						if(err){
							console.log("Error retrieving Session Collection");
							obj = {};
							obj.status = false;
							obj.msg = "An Error occured";
							res.send(obj);
							return;
						}
                        collection.insert(loggedin, {safe:true}, function(err, result) {
		                    if (err) {
		                        console.log('Error updating session collection: ' + err);
								obj = {};
								obj.status = false;
								obj.msg = "An Error occured. Please try after sometime";
								res.send(obj);
								return;
		                    } else {
		                        var loggedin = {};
		                        loggedin['user_id'] = item._id;
		                        loggedin['login_id'] = newid;
		                        loggedin['status'] = true;
		                        res.send(loggedin);
								console.log("LAST", new Date());
		                        console.log('' + result + ' document(s) updated');
								return;
		                    }
		                });
		            });
              }
            });
        });
    });
 }


exports.save = function (req, res) {
    console.log("First in signup", new Date());
    var form = new formidable.IncomingForm({
        uploadDir: '/home/ballroomnightz/public/img',
        keepExtensions: true
    });
    form.parse(req, function (err, fields, files) {
        console.log("This is files in signup: ", files);
        var image = util.inspect(files.image);
        console.log(image);

        if (image !== 'undefined') {
            var imagePath = util.inspect(files.image.path);
            imagePath = imagePath.slice(1, imagePath.length - 1);
            imagePath = imagePath.substring(imagePath.lastIndexOf("/") + 1);
            fields['image'] = imagePath;
        }

        fields['email'] = fields['email'].toLowerCase();
				fields['fb'] = 0;
        db.collection('pendingusers', function (err, collection) {

            if (err) {
                console.log("error while findone in pendingUser signup: ", err);
                obj.status = false;
                obj.msg = "An error occured. Please try after sometime";
                res.send(obj);
                eventEmitter.emit("deleteImage");
                return;
            }

            collection.insert(fields, {safe: true}, function (err, result) {
                var obj = {};
                if (err) {
                    console.log(err);
                    obj.status = false;
                    obj.msg = "An error occured. Please try after sometime";
                    res.send(obj);
                    eventEmitter.emit("deleteImage");
                    return;
                } else {
                    console.log(result[0].email);
                    var mailOptions = {
                        from: "Ballroom Dance  <viral@bugletech.com>", // sender address
                        to: result[0].email, // list of receivers
                        subject: "Ballroom Dance - Thank you", // Subject line
                        text: "Thank you for registering to Ballroom Dance Mobile Application. Please click below link to complete 													the process" + '\n' +
                            "http://api.ballroomnightz.com:3000/account/email/confirm/" + result[0]._id + "/" + uuid.v4()

                    }

                    smtpTransport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            console.log(error);
                            obj.status = false;
                            obj.msg = "An error occured. Please try after sometime";
                            res.send(obj);
                            eventEmitter.emit("deleteImage");
                            return;
                        } else {
                            console.log("Message sent: " + response.message);
                            obj.status = true;
                            obj.msg = "Please click the link sent to your email address to complete the registration process";
                            res.send(obj);
                            console.log("LAST in signup", new Date());
                            return;
                        }
                    });
                }
            });
        });

    });

    eventEmitter.once('deleteImage', function () {
        console.log("Deleting Image");
        if (typeof files.image !== 'undefined') {
            fs.unlink(files.image.path, function (err) {
                if (err) {
                    console.log("Error deleting image: ", err);
                    console.log("Attempting again:");
                    fs.unlink(files.image.path, function (err) {
                        if (err) {
                            console.log("2nd attempt failed as well");
                        } else {
                            console.log("2nd attempt successful!");
                        }
                    });
                } else {
                    console.log("Profile image Deleted as signup failed");
                }
            });
        }
    });

};


/*
exports.save = function(req, res){
	console.log("First in signup", new Date());
    var form = new formidable.IncomingForm({ uploadDir: '/home/ballroomnightz/public/img', keepExtensions: true });
    form.parse(req, function(err, fields, files) {   
				console.log("This is files in signup: ", files);
        var image = util.inspect(files.image);
        console.log(image);
  //      console.log("This is image from files: ", typeof files.image);
  //      console.log("This is image from fields: ", typeof fields.image);
        if(image !== 'undefined'){
            var imagePath  = util.inspect(files.image.path);
            imagePath = imagePath.slice(1, imagePath.length-1);
            imagePath = imagePath.substring(imagePath.lastIndexOf("/")+1);
            fields['image'] = imagePath;
        }

		fields['email'] = fields['email'].toLowerCase();
		db.collection('users', function(err, userCollection){
			var obj = {};
			if(err){
				console.log("Error retrieving user collection: signup");
				obj.status = false;
				obj.msg = "An error occured. Please try after sometime";
				res.send(obj);
				eventEmitter.emit("deleteImage");
				return;
			}
			else{
				userCollection.findOne({ $or : [ { "email": fields['email'] }, { "display_name": fields['display_name'] } ] },function(err, result){
					if(err){
						obj.status = false;
						obj.msg = "An error occured. Please try after sometime";
						console.log("error finding already existing user");
						res.send(obj);
						eventEmitter.emit("deleteImage");
						return;
					}else if(result === null){
						db.collection('pendingusers', function(err, collection) {
							collection.findOne({ $or : [ { "email": fields['email'] }, { "display_name": fields['display_name'] } ] },function(err, pResult){
									if(err){
											console.log("error while findone in pendingUser signup: ", err);
											obj.status = false;
											obj.msg = "An error occured. Please try after sometime";
											res.send(obj);
											eventEmitter.emit("deleteImage");
											return;
									}else if(pResult === null){
											collection.insert(fields, {safe:true}, function(err, result) {
													var obj = {};										
													if (err) {
															console.log(err);
															obj.status = false;
															obj.msg = "An error occured. Please try after sometime";
															res.send(obj);
															eventEmitter.emit("deleteImage");
															return;
														}else{
															console.log(result[0].email);
															var mailOptions = {
																from: "Ballroom Dance  <viral@bugletech.com>", // sender address
																to: result[0].email, // list of receivers
																subject: "Ballroom Dance - Thank you", // Subject line
																text: "Thank you for registering to Ballroom Dance Mobile Application. Please click below link to complete 													the process"+ '\n'+
																		"http://api.ballroomnightz.com:3000/account/email/confirm/"+result[0]._id +"/"+uuid.v4() 

															}

															smtpTransport.sendMail(mailOptions, function(error, response){
																if(error){
																	console.log(error);
																	obj.status = false;
																	obj.msg = "An error occured. Please try after sometime";
																	res.send(obj);
																	eventEmitter.emit("deleteImage");
																	return;
																}else{       
																	console.log("Message sent: " + response.message);
																	obj.status = true;
																	obj.msg = "Please click the link sent to your email address to complete the registration process";
																	res.send(obj);
																	console.log("LAST in signup", new Date());
																	return;
																}
															});
														}
													});									
								}else{
										console.log("display_name or email is already taken by someone");
										obj.status = false;
										obj.msg = "Either name or e-mail address already exists.";
										res.send(obj);
										eventEmitter.emit("deleteImage");
										return;
								}
							});

						});												
					}else{
						console.log("Email/Display_name already exist");
						obj.status = false;
						obj.msg = "Either e-mail or name already exists";
						res.send(obj);
						eventEmitter.emit("deleteImage");
						return;
					}
				});
			}
		});

		eventEmitter.once('deleteImage', function(){
			console.log("Deleting Image");
			if(typeof files.image !== 'undefined'){
				fs.unlink(files.image.path, function(err){
					if(err){
						console.log("Error deleting image: ", err);
						console.log("Attempting again:");
						fs.unlink(files.image.path, function(err){
							if(err){
								console.log("2nd attempt failed as well");
							}else{
								console.log("2nd attempt successful!");
							}
						});
					}else{
						console.log("Profile image Deleted as signup failed");
					}
				});
			}
		});
   });
};

*/

exports.verifyUser = function(req, res){
	var user_id = req.params.id;
	console.log("This is ID: ", user_id);
	
	db.collection('pendingusers', function(err, pUserCollection){
		if(err){
			console.log("Could not retrieve pendinuser collection");
			res.send("false");
		}else{
			pUserCollection.findOne({"_id": new BSON.ObjectID(user_id)},
									function(err, pendingUser){
										if(err || pendingUser === null){
											console.log("Could not find any pending user");
											res.send(false);
										}else{
											db.collection('users', function(err, userCollection){
												if(err){
													console.log("Could not retrieve user Collection in verify User");
													res.send("Please try after some time");
												}else{
													console.log("Pending User: ", pendingUser)
													delete pendingUser._id;
													userCollection.insert(pendingUser, function(err, insrtData){
														if(err){
															console.log("Could not save new user to users collection");
															res.send(false);
														}else{
															db.collection('lastfeedcall', function(err, feedCallCollection){
				                								if(err){
												                    console.log("This is error in FeedLastCall in signup process");
												                }else{
												                    feedCallCollection.insert({"user_id": insrtData[0]._id, "lastcall": ''}, 																		function(feedErr, feedResult){
					                        							console.log("New Entry Made in lastfeedcall with:", feedResult);
												                    });
												                }
												            });						
															console.log("Resgistration Process is complete", insrtData);
															res.send("Registration process is complete, now you can login using your credentials");
															pUserCollection.remove({"_id": new BSON.ObjectID(user_id)}, function(err, result){
																if(err){
																	console.log("Could not delete from pendinguser ");
																}else{
																	console.log("Deleted from pendinguser");
																}
															});
														}
													});
										
												}
											});
										}
									}
									);
		}
	});
};

exports.coverImage = function(req, res){
    
    var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/coverimage/', keepExtensions:true});

    form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
        res.send(false);
        return;
    });

    form.on('error', function(){                                // Registering for error event and deciding the appropriate action to be taken
        res.send(false);
        return;
    });

    form.parse(req, function(err, fields, files){
        
        var user_id = fields.user_id;
	console.log("This is cover Image: ", files);
	console.log("This is fields: ",fields );
        db.collection('users', function(err, userCollection){
            if(err){
                console.log("Error retrieving user collection: addCoverImage user.js");
                return;
            }
            userCollection.findOne({"_id": new BSON.ObjectID(user_id)},
                                      {},
                                      function(err, user){
                                            if(err){
                                                console.log("User not found");
                                                res.send(false);
                                                return;
                                            }
                                            if(typeof files.image !== "undefined"){
                                                if(files.image.size == 0){
                                                    fs.unlink(files.image.path, function(err){
                                                        if(!err){
                                                            console.log("zero sized cover image deleted");
                                                        }
                                                    });
                                                    res.send(false);
                                                    return;
                                                }
                                                if(typeof user.coverimage !== "undefined"){
                                                    fs.unlink('/home/ballroomnightz/public/img/coverimage/'+ user.coverimage, function(err){
                                                        if(err){
                                                            console.log("Error deleting coverimage");
                                                            res.send(false);
                                                            return;
                                                        }
                                                    });
                                                }
                                                fields['image'] = files.image.path.substring(files.image.path.lastIndexOf("/")+1);
                                                
                                                userCollection.update({"_id": new BSON.ObjectID(user_id)},
                                                                      {$set: 
                                                                            {"coverimage": fields['image']} 
                                                                       },
                                                                      function(err){
                                                                        if(err){
                                                                            console.log("Could not add cover image");
                                                                            res.send(false);
                                                                            fs.unlink(files.image.path, function(err){});
                                                                            return;
                                                                        }else{
																																						var obj = {};
																																						var ary = [];
																																						obj.coverimage = fields['image'];
																																						ary.push(obj);
									    																											res.send(ary);
                                                                            return;
									}			
                                                                      }
                                                                    );                 
                                            }else{
						res.send(false);
						return;
					    }
                                      });
        });

    });
//    form.on('end', function(){                                         // Upon completion of form, respond with true
//        res.send(true);
//        return;
//    });
};

exports.imageTest = function(req, res){
    console.log("I am here");
    console.log(req.connection.remoteAddress);
    gm('/home/ballroomnightz/public/img/7ba1520029448805b4538fb34dc078fa.jpg')
                .resize(72, 72)
                .noProfile()
                .write('/home/ballroomnightz/public/img/7ba1520029448805b4538fb34dc078fa.jpg', function (err) {
                  if (!err) {
                        console.log('done');
			res.send(true);
                    }else{
                        console.log("Error: ", err);
			res.send(false);
                    }
            });
};

exports.profileImage = function(req, res){
    
    var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/', keepExtensions:true});
		console.log("Profile Pic Start : ", new Date());
    form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
        res.send(false);
        return;
    });

    form.on('error', function(){                                // Registering for error event and deciding the appropriate action to be taken
        res.send(false);
        return;
    });
    form.parse(req, function(err, fields, files){
        
        var user_id = fields.user_id;

        db.collection('users', function(err, userCollection){
            if(err){
                console.log("Error retrieving user collection: profileImage user.js");
								res.send(false);
                return;
            }
            userCollection.findOne({"_id": new BSON.ObjectID(user_id)},
                                      {},
                                      function(err, user){
                                            if(err){
                                                console.log("User not found");
                                                res.send(false);
                                                return;
                                            }
                                            console.log( typeof user.coverimage === 'undefined');
                                            if(typeof files.image !== "undefined"){
                                                if(files.image.size == 0){
                                                    fs.unlink(files.image.path, function(err){
                                                        if(!err){
                                                            console.log("zero sized cover image deleted");
                                                        }
                                                    });
                                                    res.send(false);
                                                    return;
                                                }

                                                
                                                var old_image = '/home/ballroomnightz/public/img/'+ user.image;
                                                fields['image'] = files.image.path.substring(files.image.path.lastIndexOf("/")+1);
                                                
                                                userCollection.update({"_id": new BSON.ObjectID(user_id)},
                                                                      {$set: 
                                                                            {"image": fields['image']} 
                                                                       },
                                                                      function(err){
                                                                        if(err){
                                                                            console.log("Could not add cover image");
                                                                            res.send(false);
                                                                            fs.unlink(files.image.path, function(err){});
                                                                            return;
                                                                        }else{
                                                                            fs.unlink(old_image, function(err){
                                                                                if(err){
                                                                                    console.log("attempt 1 failed to delete profile pic");
                                                                                    fs.unlink(old_image, function(err){
                                                                                        if(!err){
                                                                                            console.log("Old Profile pic deleted");
                                                                                        }
                                                                                    });
                                                                                }else{
                                                                                    console.log("Old Profile pic deleted");
                                                                                }
                                                                            });
																																						var ary = [];
																																						var obj = {};
																																						obj.image = fields['image'];
																																						ary.push(obj);
																																						console.log("Profile Pic End : ", new Date());
                                                                            res.send(ary);
                                                                            return;
                                                                        }
                                                                      }
                                                                    );                 
                                            }else{
                                                res.send(false);
                                                return;
                                            }
                                      });
        });

    });
    // form.on('end', function(){                                         // Upon completion of form, respond with true
    //     //     res.send(true);
    //         //     return;
 
//	});

};
      
exports.forgetpwd = function(req,res) {
    var email = req.body.email;
    
    db.collection('users', function(err, collection) {
        collection.findOne({'email':email}, function(err, item) {
            if(err) {
                res.send(false);
            } else {
                var chars = 'acdefhiklmnoqrstuvwxyz0123456789'.split('');
                var newpassword = '';
                for(var i=0; i<8; i++){
                    var x = Math.floor(Math.random() * chars.length);
                    newpassword += chars[x];
                }
                if(newpassword) {
                    db.collection('users', function(err, collection) {
                        collection.update({'email':email},{$set:{"password":newpassword}},function(err) {
                           if(err) {
                                res.send("false")
                            } else {
                                var mailOptions = {
                                    from: "Ballroom Dance  <viral@bugletech.com>", // sender address
                                    to: 'viral@bugletech.com', // list of receivers
                                    subject: "Ballroom Dance - New Password", // Subject line
                                    text: "Your Password has been reset. You can login with following password " + newpassword // plaintext body
                                }
                                smtpTransport.sendMail(mailOptions, function(error, response){
                                    if(error){
                                        // res.send(error);
                                        res.send("false");
                                    }else{
                                        res.send("Message sent: " + response.message);
                                        res.send("true");
                                    }
                                });
                            }
                        });
                    }); 
                }
                else {
                    res.send("false");
                }      
            }
        });    
    });    
}

exports.logout = function(req,res) {
    var loginid = req.body.login_id;
    var logoutid = new ObjectId();
    //res.send(logoutid);
    db.collection('sessions', function(err, collection) {
        collection.update({'login_id':new BSON.ObjectID(loginid)},{$set:{"logout_id":logoutid}},function(err) {
            if(err) {
                res.send("false")
            } else {
                res.send("true");
            }
        });
    }); 
};

exports.validateNameEmail = function(req, res){
		var chkName = req.query.n;												// n stands for name
		var chkMail = req.query.m;													// m stands for e-mail
		chkMail = chkMail.toLowerCase();
		db.collection('users', function(err, usrCollection){
				var obj = {};
				if(err){
						console.log("Error retrieving users collection in validateNameEmail");
						obj.status = false;
						obj.msg = "An error occured. Please try after sometime";
						res.send(obj);
						return;
				}
				usrCollection.find({ $or : [ { "email": chkMail }, { "display_name": chkName } ] })
													.limit(1)
													.toArray(function(err, usr){
															if(err){
																	console.log("Error retrieving user in validateNameEmail");
																	obj.status = false;
																	obj.msg = "An error occured. Please try after sometime";
																	res.send(obj);
																	return;
															}
															else if(usr.length === 0){
																	db.collection('pendingusers', function(err, pUsrCollection){
																				var obj = {};
																				if(err){
																						console.log("Error retrieving pUsrCollection");
																						obj.status = false;
																						obj.msg = "An error occured. Please try after sometime";
																						res.send(obj);
																						return;
																				}
																				pUsrCollection.find({ $or : [ { "email": chkMail }, { "display_name": chkName } ] })
																														.limit(1)
																														.toArray(function(err, pUsr){
																																if(err){
																																	console.log("Error occured pendingusers in validateNameEmail");
																																	obj.status = false;
																																	obj.msg = "An error occured. Please try after sometime";
																																	res.send(obj);
																																	return;
																																}
																																else if(pUsr.length === 0){
																																		obj.status = true;
																																		obj.msg = "Valid name and e-mail";
																																		res.send(obj);
																																		return;
																																}
																																else{
																																		obj.status = false;
																																		if(pUsr[0].display_name === chkName){
																																				obj.msg = "Display Name already exists";
																																		}else{
																																				obj.msg = "E-mail already exists";
																																		}																																		
																																		res.send(obj);
																																		return;

																																}
																														});
																	});
															}
															else{
																	obj.status = false;
																	if(usr[0].display_name === chkName){
																			obj.msg = "Display Name already exists";
																	}else{
																			obj.msg = "E-mail already exists";
																	}																																		
																	res.send(obj);
																	return;
															}
													});

		});
};


exports.fbSignup = function(req, res){
	var form = new formidable.IncomingForm({ uploadDir: '/home/ballroomnightz/public/img', keepExtensions: true });

	form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
		var obj = {};
		obj.status = false;
		obj.msg = "Signup process was aborted, Please try after some time";
		res.send(obj);
		return;
	});

  form.on('error', function(err){                                // Registering for error event and deciding the appropriate action to be taken
        console.log("Form Error, Error fbSignup: ", err);
        var obj = {};
        obj.status = false;
        obj.msg = "Error occured while signing up, Please try after some time";
        res.send(obj);
        return;
  });

  form.parse(req, function(err, fields, files){
      var obj = {};
      if(err){
        console.log("Error parsing fbSignup form: ", err);
        obj.status = false;
        obj.msg = "Error occured while signing up";
        res.send(obj);
        return;
      }
				fields['fb'] = 1;
				fields.email = fields.email.toLowerCase();
        if(typeof files.image === "undefined"){
          console.log("No Profile Pic was found");
          var obj = {};
          obj.status = false;
          obj.msg = "Please provide profile picure";
          res.send(obj);
          return;
        }else{
          fields.image = files.image.path.substr(files.image.path.lastIndexOf("/")+ 1);
        }

        db.collection('users', function(err, usrCollection){
          if(err){
              console.log("Error retrieving users collection in fbSignup: ", err);
              obj.status = false;
              obj.msg = "Error occured while signing up, Please try after some time";
              res.send(obj);
              return;
          }
          usrCollection.insert(fields, function(err, insrtData){
            if(err){
                console.log("Error insert data in users collection FBSignup: ", err);
                obj.status = false;
                obj.msg = "Error occured while signing up, Please try after some time";
                res.send(obj);
                return;
            }

						db.collection('lastfeedcall', function(err, feedCallCollection){
							if(err){
								console.log("This is error in FeedLastCall in signup process");
							}else{
								feedCallCollection.insert({"user_id": insrtData[0]._id, "lastcall": ''},function(feedErr, feedResult){
					      	console.log("FB Signup: New Entry Made in lastfeedcall with:", feedResult);
								});
							}
						});		
            var newid = new ObjectId();
            obj['user_id'] = insrtData[0]._id;
		        obj['login_id'] = newid;
		        obj['status'] = true;
            res.send(obj);
						delete loggedin.status;
						db.collection('sessions', function(err, collection) {
								if(err){
										console.log("Error retrieving Session Collection");
								}
				        collection.insert(loggedin, {safe:true}, function(err, result) {
							      if (err) {
						          console.log('Error updating session collection: ' + err);
							      } else {
											console.log("inserted value successfully in session");
							      }
						    });
					  });
            return;
          });
      });
  });

};

exports.fbLogin = function(req, res){
	var form = new formidable.IncomingForm();

	form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
		var obj = {};
		obj.status = false;
		obj.msg = "Facebook signin process was aborted, Please try after sometime";
		res.send(obj);
		return;
	});

  form.on('error', function(err){                                // Registering for error event and deciding the appropriate action to be taken
        console.log("Form Error, Error fbSignin: ", err);
        var obj = {};
        obj.status = false;
        obj.msg = "An error occured while signing in, Please try after sometime";
        res.send(obj);
        return;
  });

	form.parse(req, function(err, fields, files){
		var email = fields['email'].toLowerCase();
		db.collection('users', function(err, usrCollection){
			if(err){
				console.log("Error in FB sign in");
				var obj = {};
				obj.status = false;
				obj.msg = "An error occured in signin process, Please try after sometime";
				res.send(obj);
				return;
			}
			usrCollection.find({"email": email, "fb": 1})
												.limit(1)
												.toArray(function(err, user){
					if(err){
						console.log("Error in FB sign in");
						var obj = {};
						obj.status = false;
						obj.msg = "An error occured in signin process, Please try after sometime";
						res.send(obj);
						return;
					}
					else if(user.length === 0){
						console.log("No FB User found");
						var obj = {};
						obj.status = false;
						obj.msg = "You do not have Account. Please signup using facebook first";
						res.send(obj);
						return;
					}else{
						var loggedin = {};
			      loggedin['user_id'] = user[0]._id;
			      loggedin['status'] = true;
						loggedin['login_id'] = new ObjectId();
			      res.send(loggedin);
						delete loggedin.status;
						db.collection('sessions', function(err, collection) {
								if(err){
										console.log("Error retrieving Session Collection");
								}
				        collection.insert(loggedin, {safe:true}, function(err, result) {
							      if (err) {
						          console.log('Error updating session collection: ' + err);
							      } else {
											console.log("inserted value successfully in session");
							      }
						    });
					  });
						return;
					}
			});

		});
	});

};


exports.follow = function(req,res) {
	var follow = req.body;
	var following_id = new ObjectId();
	var follower_id = new ObjectId(); 
	var following = {};
	following['id'] = following_id;
	following['user_id'] = req.body.followerid;
	var follower = {};
	follower['id'] = follower_id;
	follower['user_id'] = req.body.followingid;
	db.collection('users', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(req.body.followingid)}, {$push:{following:following}}, {safe:true}, function(err, result) {
        	if(err) {
        		res.send("false") 
        	} else {
        		db.collection('users', function(err, collection) {
        			collection.update({'_id':new BSON.ObjectID(req.body.followerid)}, {$push:{followers:follower}}, {safe:true}, function(err, result) {
        				if(err) {
        					res.send("false");
        				} else {
        					var notification = {};
                			db.collection('users', function(err, collection) {
	     						collection.find({'_id':new BSON.ObjectID(req.body.followingid)},{display_name:1,image:1}).
	     							toArray(function(err, users) {
	     							if(err) {
	     								console.log("false");
	     							}
	     							else {
                                        notification['loginuserid'] = req.body.followerid;
		             					notification['link'] =  'users' + "/" + req.body.followingid;
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
		                                                collection.find({'_id':new BSON.ObjectID(req.body.followerid)},{email:1}).
		                                                	toArray(function(err, user) {
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
		                							res.send("true");
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
        });
    });
};

exports.unfollow = function(req,res) {
	var unfollowing = {};
	unfollowing['user_id'] = req.body.followerid;
	console.log("Followers: ", req.body.followerid);
	var unfollow = {};
	unfollow['user_id'] = req.body.followingid;
	console.log("Following: ", req.body.followingid);
	db.collection('users', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(req.body.followingid)},{$pull:{following:unfollowing}} ,{safe:true}, function(err, result) {
            if (err) {
                res.send("false");
            } else {
                db.collection('users', function(err, collection) {
                	console.log("test" + req.body.followerid);
        			collection.update({'_id':new BSON.ObjectID(req.body.followerid)},{$pull:{followers:unfollow}} ,
        		   	  {safe:true}, function(err, result1) {
        				if(err) {
        					res.send("false") 
        				} else {
						console.log("This is result1: ", result1);
        					res.send("true");
        				}
        			});
        		});	
            }
        });
    });
}
