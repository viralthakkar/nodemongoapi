var mongo = require('mongodb');
var nodemailer = require("nodemailer");
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


exports.messages = function(req,res) {
			var fromid = req.params.fromid;
			var toid = req.params.toid;      
			db.collection('messages', function(err, collection) {
      	collection.find({
				    $or : [ { 'members.fromid' : fromid }, { 'members.toid' : fromid }]
				},{ messages: { $slice: -1 } }).toArray(function(err, items) {
	   			if(err) {
		  		  console.log(err);
         	} else {
		  			res.send(items);
					}
      });
  });
}

exports.message = function(req,res) {
  var msg = req.body;
	db.collection('messages',function(err,collection) {
        collection.find({$or : [
        { $and : [ { "members.fromid" : msg.fromid }, { "members.toid" : msg.toid } ] },
        { $and : [ { "members.toid" : msg.fromid }, { "members.fromid" : msg.toid } ] }
    ]}).toArray(function(err,checkmsg) {
	   if(err) {
	      res.send("false");
	    } else {
				
				if(checkmsg.length) {
							var conid = checkmsg[0]._id;
					    db.collection('users',function(err,collection) {
				        collection.find({'_id':new BSON.ObjectID(msg.fromid)},{display_name:1,image:1}).toArray(function(err,fromuser) {
	   							if(err) {
							      res.send("false")
										return;
	    						} else {
											var msgid = new ObjectId();
						   	    	var newmsg = {};
											console.log("fromuser" + fromuser);
											newmsg.fromid = fromuser[0]._id;
					  	        newmsg.name = fromuser[0].display_name;
											newmsg.body = msg.message;
											newmsg.id = msgid;
											newmsg.created = new Date();
											var msgsend = [];
											msgsend.push(newmsg);
											db.collection("messages", function(err, collection) {
						      		  collection.update({'_id':conid}, {$push:{messages:newmsg}}, {safe: true}, function(err, result) {
		    									if(err) {
														res.send("false");
											      return;
											    } else {
                            console.log("Result to be sent: ", result);
                            if(Number(result) === 1){
                              res.send(msgsend);
                              return;
                            }else{
                              res.send(false);
                              return;
                            }
		    									}
		  					   			});
	       						  });
	    					}
							 });
    			   });
				} else {
    			db.collection('users',function(err,collection) {
        		collection.find({'_id':new BSON.ObjectID(msg.fromid)},{display_name:1,image:1}).toArray(function(err,fromuser) {
	   					if(err) {
					      res.send(false)
	    				} else {
					      db.collection('users',function(err,collection) {
		    					collection.find({'_id':new BSON.ObjectID(msg.toid)},{display_name:1,image:1}).
		    						toArray(function(err,touser) {
										if(err) {
					    		   res.send(false)
	    							} else {
		  	    					var msgid = new ObjectId();
									    console.log("Msg ID " + msgid);
			     						var addmsg = {};
 				    	  	    var members = [];
  			              var fromarray = {};
		                  var toarray = {};
  		  	            fromarray['fromid'] = msg.fromid;
 		  	              toarray['toid'] = msg.toid;
										 var messages = [];
										 var newmsg = {};
										 fromarray['name'] = fromuser[0].display_name;
										 fromarray['image'] = fromuser[0].image;
										 toarray['name'] = touser[0].display_name;
										 toarray['image'] = touser[0].image;
										 members.push(fromarray);
										 members.push(toarray);	
										 addmsg['members'] = members;	  
										 newmsg.fromid = fromuser[0]._id;
										 newmsg.name = fromuser[0].display_name;
										 newmsg.body = msg.message;
										 newmsg.id = msgid;
										 newmsg.created = new Date();
										 messages.push(newmsg);
										 addmsg['messages'] = messages;
										 var msgsend = [];
										 msgsend.push(newmsg);
										 db.collection("messages", function(err, collection) {
											 collection.insert(addmsg, {safe:true}, function(err, result) {
				     							if (err) {
													 	res.send("false");
														return;
											    } else {
														console.log(result);
				        						res.send(result);
														return;
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
	   }
	   });
	 });
}

exports.messageseen = function(req, res) {
    var id = req.params.id;
    var msgid = req.params.msgid;
    console.log(msgid);
    db.collection('messages', function(err, collection) {
        collection.update({'messages.id': msgid } ,{$set:{seen:1}},    
	  		{safe:true},function(err, items) {
		if(err) {
		   res.send("false");			
		   console.log(err);
		} else {		
	            res.send(items);
		}
        });
    });
};


