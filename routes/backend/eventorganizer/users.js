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

exports.saveSignupUser = function(req, res) {
    var form = new formidable.IncomingForm();
    form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
        res.redirect('/404')
        return;
    });

    form.on('error', function(){                                // Registering for error event and deciding the appropriate action to be taken
        res.redirect('/404');
        return;
    });

	form.parse(req, function(err, fields, files){
		console.log(fields);
		db.collection('eventorganizer', function(err, evntOrzCollection){
			if(err){
				console.log("Could not retrieve event organizer collection");
				res.redirect('/404');
				return;
			}
			fields['active'] = 0;
			evntOrzCollection.insert(fields, function(err, insrtedData){
				if(err){
					console.log("Error while saving user to to evnt Organiser collection");
					res.redirect('/404');
					return;
				}

				var mailOptions = {
						from: "Ballroom Dance  <viral@bugletech.com>", // sender address
						to: insrtedData[0].email, // list of receivers
						subject: "Ballroom Dance - Thank you", // Subject line
						text: "Thank you for registering to Ballroom Dance . Please click below link to verify your email address"+ '\n'+
								"http://api.ballroomnightz.com:3000/confirm/email/"+insrtedData[0]._id +"/"+uuid.v4() +"\n\n"
								+ "After verifying your email, you can login at: " + "http://api.ballroomnightz.com:3000/organizer/login"
					}

				smtpTransport.sendMail(mailOptions, function(error, response){
					if(error){
						console.log("Error occured while sending mail",error);
						res.redirect('/404');
						return;
					}else{       
						console.log("Message sent: " + response.message);
						res.redirect('/confirm');
						return;
					}
				});
				return;
			});

		});
	});

};

exports.signup = function(req, res) {
    res.render('eventorganizer/signup',{
        title:"Ballroom - Signup",
        header: "Header"
    });

};


exports.pendingOrganizer = function(req, res){
	res.render('eventorganizer/confirm', {
		title: "Registration successful",
		header: "Header",
		msg : "Congratulations, You are only one step away from becoming a member. Please click link sent to your email to confirm your email address."
	});
};


exports.confirmMyMail = function(req, res) {

	var user_id = req.params.id;
	console.log("I am in event organizer confim email");
	console.log("This is user_id: ", user_id);
	db.collection('eventorganizer', function(err, evntOrzCollection){
		if(err){
			console.log("Could not retrieve event organizer collection");
			res.redirect('/404');
			return;
		}
		evntOrzCollection.update({"_id": new BSON.ObjectID(user_id) }, 
								 { $set : {"active": 1} }, 
								function(err){
			if(err){
				console.log("Error while saving user to to evnt Organiser collection");
				res.redirect('/404');
				return;
			}
			// redirecting user to login page(exports.showLoginPage function)
			res.redirect('/organizer/login');
			
		});
	});
};

exports.login = function(req, res) {

	var form = new formidable.IncomingForm();
	form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
		console.log("Aborted");
		res.redirect('/404')
        return;
    });

    form.on('error', function(){                                // Registering for error event and deciding the appropriate action to be taken
		console.log("Form Error");
        res.redirect('/404');
        return;
    });
	
	form.parse(req, function(err, fields, files){
		if(fields.email === "" || fields.password === "" || typeof fields.email === "undefined" || typeof fields.password === "undefined"){
			console.log("fields are empty", fields);
			res.redirect('/404');
			return;
		}
		db.collection('eventorganizer', function(err, evntOrzCollection){
			if(err){
				console.log("Could not retrieve event organizer collection");
				res.redirect('/404');
				return;
			}

			evntOrzCollection.find({"email": fields.email , "password": fields.password})
									.limit(1)
									.toArray(function(err, found){
					if(err || found.length === 0){
						console.log("Error while saving user to to evnt Organiser collection");
						res.redirect('/404');
						return;
					}

					delete found[0].password;
					res.cookie('userDetails', found[0], { maxAge: 3600000 });

					res.redirect('/organizer/home');
					return;
					
			});
		});

	});

};


exports.showLoginPage = function(req, res) {
	console.log("In rendering");
	res.render('eventorganizer/login',{
        title:"Ballroom - login",
        header: "Header"
    });
};

exports.logout = function(req, res){	
	console.log("THis is req.session: ", req.session);
	req.session = null;
	res.clearCookie('userDetails');
	res.redirect('organizer/login');
};

