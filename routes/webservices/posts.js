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
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
}); 

exports.uploadMedia = function (req, res) {

    var form = new formidable.IncomingForm({
        uploadDir: '/home/ballroomnightz/public/img/MediaDetail',
        keepExtensions: true
    });

    form.parse(req, function (err, fields, files) {
        console.log("THis is fields", fields);
        console.log("This is files", files);
        var media = [];
        var video = util.inspect(files.video);
		//Check if post is an video or not
        if (video !== 'undefined') {
            if (files.video.size == 0 || files.video.size == '0') {
                fs.unlink(files.video.path, function (err) {});
                res.send(false);
                return;
            }

            var videoPath = util.inspect(files.video.path);
            videoPath = videoPath.slice(1, videoPath.length - 1);
            var vidName = videoPath.substr(0, videoPath.lastIndexOf("."));
            vidName = vidName.substr(vidName.lastIndexOf("/") + 1);
            videoThumbPath = '/home/ballroomnightz/public/img/thumbnail/';
            console.log(files.video.type);
            console.log(videoThumbPath + vidName + '.png');

            var exec = require('child_process').exec;
            exec('ffmpeg  -i ' + videoPath + ' -ss 00:00:02 -f image2 -vframes 1 ' + videoThumbPath + vidName + '.png', function () {});
            media.push('video');
            videoPath = vidName + ".png";
            media.push(videoPath);

        }
		// Check if post is am image or not
        var image = util.inspect(files.image);
        if (image !== 'undefined') {
            if (Number(files.image.size) == 0) {
                fs.unlink(files.image.path, function (err) {
                    //	res.send(false);
                });
                res.send(false);
                return;
            }
            var imagePath = util.inspect(files.image.path);
            imagePath = imagePath.slice(1, imagePath.length - 1);

            imagePath = imagePath.substring(imagePath.lastIndexOf("/") + 1);
            console.log("This is imagepath after: ", imagePath);
            media.push('image');
            media.push(imagePath);

        }

        var usr_id = util.inspect(fields.user_id);
        usr_id = usr_id.substring(1, usr_id.length - 1);

		// Prepare an object to be inserted in post collection
        var insert_data = {
            user_id: usr_id,
            mediatype: media[0],
            mediapath: media[1]
        };
		// If the post has any text data, add it.
        if (typeof fields.description !== "undefined") {
            var desc = fields.description;
            insert_data.description = desc;
        }else{
			insert_data.description = 'n';
		}


        db.collection('posts', function (err, collection) {
			collection.insert(insert_data, { safe: true }, function (err, result) {
                if (err) {
                    res.send(false);
                    console.log(err);
                } else {
                    console.log(result);
                    console.log("This is result of Post insertion: ", result);
                    res.send(result);
                }
            });
        });
    });
};


exports.postabuse = function(req, res) {
    var id = req.params.id;
    console.log(id);
    db.collection('posts', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)},{ $inc: { abuse: 1 } } ,{safe:true}, function(err, result) {
            if (err) {
                //res.send({'error':'An error has occurred' + err});
                res.send("false");
            } else {
                console.log('posts has been abused');
                res.send("true");
            }
        });
    });
}    

exports.explore = function(req,res) {
    db.collection('posts', function(err, collection) {
        collection.aggregate({$unwind:"$likes"},{$unwind:"$comments"},
                {$group:{_id:"$_id", total:{$sum:1}}},{$sort:{total:-1}},function(err, items) {
            if(err) {
                res.send({'error':'An error has occurred' + err})
            } else{
                  var cnt = [];
                  for (var i = 0; i < items.length; i++) {
                        var id = items[i]._id;
                        var total = items[i].total;
                        db.collection('posts', function(err, collection) {
                            var newid = id;
                            var newtotal = total
                            collection.findOne({'_id':new BSON.ObjectID(newid.toString())},{comments:0,likes:0},function(err, item) {
							    item['total'] = newtotal;		                              
                                cnt.push(item);
                                if(cnt.length === items.length){
                                    res.send(cnt.sort(function(a,b){
                                    	return b['total'] - a['total'];
                                    }));
                                }
                            });
                        });                     
                    }
	            }
       	  });
    });
};

exports.postsCountByUser = function(req, res){

	var user_id = req.params.id;
	if(user_id === null || user_id.toString().length !== 24){
		console.log("ID is null or ID Length is less than 24");
		res.send(false);
		return;
	}

	db.collection('posts', function(err, postCollection){
		if(err){
			console.log("Error retrieving post collection");
			res.send(false);
			return;
		}
		postCollection.find({"user_id": user_id})
							.count(function(err, totalPosts){
			if(err){
				console.log("Error retrieving total posts of a user");
				res.send(false);
				return;
			}
			console.log(typeof totalPosts);
			console.log("Total n. of posts: ", totalPosts);
			res.send(totalPosts.toString());
			return;
		});
	});
};

exports.getSinglePostWithUserDetails = function(req, res){
	var postId = req.params.id;								// id is postID
	if(postId === null || postId.toString().length !== 24){
		console.log("ID is null or ID Length is less than 24");
		res.send(false);
		return;
	}
	db.collection('posts', function(err, postCollection){
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
				usrCollection.find({"_id": new BSON.ObjectID(singlePost.user_id)},
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
