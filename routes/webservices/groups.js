var mongo = require('mongodb');
var nodemailer = require("nodemailer");
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

var formidable = require('formidable');
var exec = require('child_process').exec;


/*
exports.mygroups = function(req,res) {
    id = req.params.id;
    console.log(id);
    db.collection("groups", function(err, collection) {
        collection.find({"members.user_id":id},{name:1,description:1,image:1,coverimage:1,recommend:1,createdby:1}).toArray(function(err,groups) {
            res.send(groups);
        });
    });
};
*/

exports.mygroups = function(req,res) {
    id = req.params.id;
    console.log(id);
    db.collection("groups", function(err, collection) {
        collection.find({"members.user_id":id}).toArray(function(err,groups) {
            res.send(groups);
        });
    });
};


exports.postNewContent = function (req, res){
	
	var form = new formidable.IncomingForm({uploadDir: "/home/ballroomnightz/public/img/Group/post",
											multiple: false,
											keepExtensions: true
											});

	form.on('error', function(){
		console.log("Error while Posting data to group");
		//obj.status = false;
		//obj.mssage = "An error occured, please try again";
		res.send(false);
		return;
	});

	form.on('aborted', function(){
		console.log("Error while Posting data to group");
		//obj.status = false;
		//obj.mssage = "An error occured, please try again";
		res.send(false);
		return;
	});

	form.parse(req, function(err, fields, files){
		if(typeof fields.user_id === "undefined" || fields.user_id.length !== 24 || typeof fields.group_id === "undefined" || fields.group_id.length !==24){
			res.send(false);
			return;
		}

		db.collection('groups', function(err, groupCollection){
			if(err){
				console.log("Error retrieveing GroupPost cololection");
				res.send(false);
				return;
			}
			groupCollection.find({"members.user_id": fields.user_id}, function(err, user){
				if(err || (user=== null)){
					console.log("No user found");
					res.send(false);
					return;
				}
				var media = [];
				console.log("This is files: ", files);
				if(typeof files.video !== "undefined"){
					if (files.video.size == 0 || files.video.size == '0') {
					    fs.unlink(files.video.path, function (err) {});
					    res.send(false);
					    return;
					}

					var videoPath = files.video.path;
					//videoPath = videoPath.slice(1, videoPath.length - 1);
					var vidName = videoPath.substr(0, videoPath.lastIndexOf("."));
					vidName = vidName.substr(vidName.lastIndexOf("/") + 1);
					videoThumbPath = '/home/ballroomnightz/public/img/Group/thumbnail/';
					console.log(files.video.type);
					console.log(videoThumbPath + vidName + '.png');

					var exec = require('child_process').exec;
					exec('ffmpeg  -i ' + videoPath + ' -ss 00:00:02 -f image2 -vframes 1 ' + videoThumbPath + vidName + '.png', function (err) {
						if(err){
							console.log("THis is error while generating thumbnail: ", err);
						}
					});
					media.push('video');
					videoPath = vidName + ".png";
					media.push(videoPath);
				}
				if(typeof files.image !== "undefined"){
					if (Number(files.image.size) === 0) {
						fs.unlink(files.image.path, function (err) {});
						res.send(false);
						return;
					}
					var imagePath = files.image.path;
					//imagePath = imagePath.slice(1, imagePath.length - 1);
					console.log("This is imagepath before: ", imagePath);
					imagePath = imagePath.substring(imagePath.lastIndexOf("/") + 1);
					console.log("This is imagepath after: ", imagePath);
					media.push('image');
					media.push(imagePath);
				}


				// Prepare an object to be inserted in collection
				var insert_data = {
				    user_id: new BSON.ObjectID(fields.user_id),
					group_id: new BSON.ObjectID(fields.group_id),
				    mediatype: media[0],
				    mediapath: media[1],
					created: new Date()					
				};
				// If the post has any text data, add it.
				if (typeof fields.description !== "undefined") {
				    var desc = fields.description;
				    insert_data.description = desc;
				}
				db.collection('groupposts', function(err, gPostCollection){
					if(err){
						console.log("Error retrieving group post collection");	
						res.send(false);
						return;
					}
					gPostCollection.insert(insert_data, {safe: true}, function(err, insertedData){
						if(err){
							console.log("Error while adding post to group post collection");
							res.send(false);
							return;
						}
						res.send(insertedData);
						console.log("Inserted data in group post collection: ", insertedData);
						return;
					});

				});
			});
		});
	});
	
};


exports.getSingleGroupPostWithUserDetails = function(req, res){
	var postId = req.params.id;								// id is postID
	if(postId === null || postId.toString().length !== 24){
		console.log("ID is null or ID Length is less than 24");
		res.send(false);
		return;
	}
	db.collection('groupposts', function(err, postCollection){
		if(err){
			console.log("Error retrieving post collection");
			res.send(false);
			return;
		}
		postCollection.find({"_id": new BSON.ObjectID(postId)})
							.limit(1)
							.toArray(function(err, singlePost){
			if(err){
				console.log("Error retrieving total posts of a user");
				res.send(false);
				return;
			}
			console.log("This is single post: ", singlePost);

			db.collection('users', function(err, usrCollection){
				if(err || singlePost.length === 0){
					console.log("Error retrieving user collection");
					res.send(false);
					return;
				}
				singlePost = singlePost[0];
				usrCollection.find({"_id": singlePost.user_id},
									{"display_name": 1, "image": 1})
									.limit(1)
									.toArray(function(err, singleUser){
					if(err){
						console.log("Error retrieving single user:getSinglePostWithUserDetails in POSTS ");
						res.send(false);
						return;
					}
					singlePost.display_name = singleUser[0]['display_name'];
					singlePost.image = singleUser[0]['image'];
					singlePost.created = ObjectId(singlePost._id.toString()).getTimestamp();
					singlePost.date = singlePost.created.toString().substr(4,11);
					singlePost.time = singlePost.created.toString().substr(16,24);

					res.send(singlePost);
					return;
				});
			});
		});
	})
};


exports.findAllGroups = function(req, res){
	var userId = req.params.id;
	console.log("This is userID: ", userId);
	if(userId === "undefined" || userId.length !== 24 || userId === null){
		console.log("No userID provided to find all groups");
		res.send(false);
		return;
	}

	db.collection('groups', function(err, groupCollection){
		if(err){
			console.log("Error while retrieving group collection to find all groups");
			res.send(false);
			return;
		}
		groupCollection.find({'members.user_id': {$ne: userId} }).toArray(function(err, groups){
			if(err){
				console.log("Error while finding all groups excent mine");
				res.send(false);
				return;
			}
			if(groups.length === 0){
				res.send(false);
				console.log("No groups ");
				return;
			}
			res.send(groups);
			return;
		});
	});

};

