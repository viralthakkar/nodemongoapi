var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});
var formidable = require('formidable');
var uuid = require('node-uuid');
var nodemailer = require("nodemailer");
var util = require('util');
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


exports.eventCreate = function(req, res){

    var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/Event', keepExtensions: true});

	form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
		res.send('/organizer/trylater');
		return;
	});

	form.on('error', function(err){                                // Registering for error event and deciding the appropriate action to be taken
		console.log("Form Error, event create: ", err);
		res.send('/organizer/trylater');
		return;
	});

    form.parse(req, function(err, fields, files){
		console.log(fields);
		var date = fields['to_time'];
		date = new Date(date);
		console.log("This is date: ",date);
		fields['date'] = date;

        if(typeof files.image !== "undefined"){                        
			fields['image'] = files.image.path.substr(files.image.path.lastIndexOf("/")+1);
			console.log(fields['image']);
        }   
        if(files.image.size === 0){
            fs.unlink(files.image.path, function(){
                console.log("Some garbage image was deleted");
            });
            fields['image'] = '';
        }
		fields['country'] = fields['country'].substr(24);
        db.collection('events', function(err, collection) {
            collection.insert(fields, {safe:true}, function(err, savedEvent) {
              if (err) {
					res.redirect('/404');
					console.log("Error creating eveent");
					return;
              } else {
                console.log("This is event saved: ", savedEvent);
				req.session.eventID = savedEvent[0]._id;
				res.redirect('/organizer/home');
				return;
			}
          });
        });

	});

};

exports.showEventCreationPage = function(req, res) {

	// Session might have expired, need to check
	if(typeof req.cookies.userDetails === "undefined"){
		res.redirect('/organizer/sessionexpired');
		console.log("Session Expired");
	}
	else{
		db.collection('countries', function(err, countryCollection){
			if(err){
				console.log("Error retrieving state collection");
				res.redirect('/organizer/trylater');
				return;
			}
			countryCollection.find({}).toArray(function(err, allCountries){
				if(err){
					console.log("Error finding states");
					res.redirect('/organizer/trylater');
					return;
				}

				res.render('eventorganizer/eventcreate',{
					title:"Ballroom - Create Event",
					header: "Header",
					email: req.cookies.userDetails.email,
					country: allCountries
				});
				return;
			});
		});
	}
};


exports.home = function(req, res){

	// Session might have expired, need to check
	if(typeof req.cookies.userDetails === "undefined"){
		res.redirect('/organizer/sessionexpired');
		console.log("Session Expired");
		return;
	}

	if(typeof req.session.eventID === "undefined"){
		res.render('eventorganizer/home',{
			title:"Ballroom | Home",
			userDetails : req.cookies.userDetails,
			event : "notAvailable"
		});
	}else{
		db.collection('events', function(err, eventCollection){
			if(err){
				console.log("Error retrieving event collection");
				res.redirect('/404');
				return;
			}
			eventCollection.find({"_id": new BSON.ObjectID(req.session.eventID)})
								.limit(1)
								.toArray(function(err, foundEvent){
				if(err || foundEvent.length === 0){
					console.log("Error finding the event");
					res.redirect('/404');
					return;
				}
				console.log("This is found event: ",  foundEvent);
				res.render('eventorganizer/home',{
					title:"Ballroom | Home",
					userDetails : req.cookies.userDetails,
					event: foundEvent[0]
				});
			});
		});
	}
	return;
};

exports.listMyEvent = function(req, res){

	// Session might have expired, need to check
	if(typeof req.cookies.userDetails === "undefined"){
		res.redirect('/organizer/sessionexpired');
		console.log("Session Expired");
		return;
	}

	var email = req.cookies.userDetails.email;
	console.log("This is my email: ", email);
	db.collection('events', function(err, eventCollection){
		if(err){
			console.log("Error retrieving event collection in listMyEvent: eventOrganizer");
			res.redirect('/404');
			return;
		}
		console.log("This hai: ", req.cookies.userDetails.email);
		eventCollection.find({"creator": req.cookies.userDetails.email}).toArray(function(err, myAllEvents){
			if(err){
				console.log("Error retrieving all events of eventOrganizer in listMyEvent");
				res.redirect('/404');
				return;
			}
			console.log(myAllEvents);
			res.render('eventorganizer/listevent', {
				title: "Ballroom | List Events",
				events: myAllEvents,
				creator: req.cookies.userDetails.email
			});
			return;

		});

	});
};

exports.sessionExpired = function(req, res){
	res.render('error/sessionexpired', {
		title: "Ballroom | Session Expired"
	});
	return;
};

exports.tryLater = function(req, res){
	res.render('error/trylater', {
		title: "Ballroom | Error"
	});
	return;
};

exports.editEventPage = function(req, res){
	// Session might have expired, need to check
	if(typeof req.cookies.userDetails === "undefined"){
		res.redirect('/organizer/sessionexpired');
		console.log("Session Expired");
		return;
	}

	var eventId = req.params.id;

	db.collection('events', function(err, eventCollection){
		if(err){
			console.log("Error retrieving event collection in edit event");
			res.redirect('/404');
			return;
		}

		eventCollection.find({"_id": new BSON.ObjectID(eventId), "creator": req.cookies.userDetails.email})
							.limit(1)
							.toArray(function(err, event){
			if(err || event.length === 0){
				console.log("Error retrieving all events of eventOrganizer in listMyEvent");
				res.redirect('/404');
				return;
			}
			db.collection('countries', function(err, countryCollection){
				if(err){
					console.log("Error retrieving state collection");
					res.redirect('/organizer/trylater');
					return;
				}
				countryCollection.find({}).toArray(function(err, allCountries){
					if(err){
						console.log("Error finding states");
						res.redirect('/organizer/trylater');
						return;
					}
					res.render('eventorganizer/editevent', {
						title: "Ballroom | Edit Event",
						event: event[0],
						country: allCountries,
						creator: req.cookies.userDetails.email
					});
					return;
				});
			});
			
			return;

		});

	});
};

exports.saveEditEvent = function(req, res){
	var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/Event', keepExtensions: true});
	form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
		res.send('/organizer/trylater');
		return;
	});

	form.on('error', function(err){                                // Registering for error event and deciding the appropriate action to be taken
		console.log("Form Error, Error fbSignup: ", err);
		res.send('/organizer/trylater');
		return;
	});

	form.parse(req, function(err, fields, files){
		var evntId = fields['id'];
		db.collection('events', function(err, eventCollection){
			if(err){
				console.log("Error retrieving event collection in edit event");
				res.redirect('/404');
				return;
			}

			fields.to_time = new Date(fields.to_time);

			if(file.image.size === 0){
				fields.image = fields.old_image;
				var deleteFile = files.image.path;
			}else{
				fields['image'] = files.image.path.substr(files.image.path.lastIndexOf("/")+1);
				deleteFile = fields.old_image.substr(fields.old_image.lastIndexOf("/")+1);
			}

			fs.unlink(deleteFile, function(err){
				if(!err)
					console.log("garbage file deleted in event edit");
				else
					console.log("Error in deleting event image while editing");
			});

			eventCollection.update({"_id": new BSON.ObjectID(eventId), "creator": req.cookies.userDetails.email}, 
								{ $set: {"name": fields.name, "description": fields.description, "image": fields.image, "category": fields.category, 
										 "from_time": fields.from_time, "to_time": fields.to_time, "date": fields.date} }, 
								function(err){
									console.log("Successfully edited event");
									res.redirect('/organizer/myevent');
									return;
								});
		});
	});		

};

