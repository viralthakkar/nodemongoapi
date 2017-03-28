var mongo = require('mongodb');
var fs = require('fs');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
var formidable = require('formidable');
db = new Db('ballroom', server, {safe: true});
var util = require('util');
var exec = require('child_process').exec;

db.open(function(err, db) {
    if(err) {
        console.log("events.js Database Connection" + err);
    }
});

/*
 * *   This Function is used to create events.
 * *
 * */

exports.addEvent = function(req,res) {

    var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/Event', keepExtensions: true});

	form.on('aborted', function(){                              // If form submission was aborted while submission, response with false
		res.send(false);
		return;
	});

	  form.on('error', function(err){                                // Registering for error event and deciding the appropriate action to be taken
		    console.log("Form Error, Error fbSignup: ", err);
		    res.send(false);
		    return;
	  });

    form.parse(req, function(err, fields, files){
		var obj = {};
        obj.user_id = fields.user_id;
        obj.id = new ObjectId();
		var ary = [];
		ary.push(obj);
		fields['rsvps'] = ary;
        console.log("This is image", files);
		var date = fields['date'];
		date = new Date(date);

//		var endTime = fields['to_time'];
//		var endTimeHour = endTime.substr(0,2);
//		var endTimeMinute = endTime.substr(3,2);


		fields['date'] = date;
		console.log("This is final date to be saved in DB: ", fields['date']);

        if(files.image.name !== ''){            
            
		fields['image'] = files.image.path.substr(files.image.path.lastIndexOf("/")+1);
		console.log(fields['image']);
        }   
        else{
            fs.unlink(files.image.path, function(){
                console.log("Some garbage image was deleted");
            });
            fields['image'] = '';
        }
        console.log(fields);
 
        db.collection('events', function(err, collection) {
            collection.insert(fields, {safe:true}, function(err, result) {
              if (err) {
                   res.send(false);
                   console.log('events.js and addEvent function ' + err); 
              } else {
                console.log("This is event saved: ", result);
                res.send(true);
              }
            });
        });
    });
};

// this function will give list of events that i am going or i have went.

exports.myevents = function(req,res) {
    id = req.params.id;
    console.log(id);
    db.collection("events", function(err, collection) {
        collection.find({"rsvps.user_id":id},{rsvps:1,address:1,name:1,description:1,image:1,date:1,from_time:1,to_time:1,user_id:1},
                        {sort:{_id:-1}}).toArray(function(err,events) {
	        for(var i=0; i< events.length; ++i){
                 events[i]['time'] = events[i]['from_time'] + " to " + events[i]['to_time'];
                 delete events[i]['from_time'];
                 delete events[i]['to_time'];
            };
            res.send(events);
        });
    });
};

exports.getAllEvents = function(req, res){
    var date = req.params.date;
	var user_id = req.params.id;
	if(date === null || user_id === null){
		console.log("No date supplied");
		res.send(false);
		return;
	}
    db.collection('events', function(err, evntCollection){
        if(err){
            console.log("Error retrieving event collection in getAllEvents");
            res.send(false);
            return;
        }
		console.log("This is date in parameter: ", date);
		var now = new Date(date);
		//var now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		console.log("THis is now date: ", now);
        evntCollection.find({"date": {$gte: now}, "rsvps.user_id":{ $ne: user_id }},
                            {"user_id":1, "description":1, "date":1, "from_time":1, "to_time":1, "state":1, "country":1, "address":1, "image":1, "name":1, 								 "address": 1, "rsvps": 1, "category": 1})
							.sort({"_id": -1})
							.toArray(function(err, evntData){
                            if(err){
                                console.log("Error retrieving all events in getAllEvents");
                                res.send(false);
                                return;
                            }
                            if(evntData.length == 0){
                                res.send(false);
                                return;
                            }
			    for(var i=0; i< evntData.length; ++i){
                                evntData[i]['time'] = evntData[i]['from_time'] + " to " + evntData[i]['to_time'];
                                delete evntData[i]['from_time'];
                                delete evntData[i]['to_time'];
                            }
							console.log("New date is: ", new Date());
							console.log("Event date is : ", evntData[0].date);
							console.log("Compare date in event: ", new Date > evntData[0].date);
                            res.send(evntData);
                        });
    });
};

exports.checkdate = function(req, res){
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files){
		var date = fields['date'];
		console.log(date);
		console.log(typeof date);

		date = date.substr(0, 10);
		console.log("Date after substr: ", date);
		date = date.replace("-", "/");
		date = new Date(date);
		date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		console.log("This is date in UTC", date);

		var endTime = fields['to_time'];
		var endTimeHour = endTime.substr(0,2);
		var endTimeMinute = endTime.substr(3,2);

		date.setHours(endTimeHour, endTimeMinute);
		console.log("date in UTC after adding hours", date);

		console.log("to time: ", fields['to_time']);
		var startTime = fields['from_time'];
		var startTimeHour = startTime.substr(0, 2);
		var startTimeMinute = startTime.substr(3,2);
		console.log("Current date is greater:");
		console.log(new Date() > date);

		console.log(date);
	res.send(date);		
	});

};
