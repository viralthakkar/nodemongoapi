var mongo = require('mongodb');
var fs = require('fs');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var ObjectId = require('mongodb').ObjectID;
var formidable = require('formidable');
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('ballroom', server, {safe: true});
var util = require('util');

db.open(function(err, db) {
    if(!err) {
        // console.log("Connected to 'ballroom' database");
    }
});

exports.ballroomgroups = function(req, res) {
	console.log("THis is session data of user: ", req.session);
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.groups=='1') {
                        db.collection('groups', function(err, collection) {
                            collection.find().toArray(function(err, groups) {
                                res.render('groups/ballroomgroups',{
                                    tag : 0,
                                    permission : item,
                                   	userinfo : req.session.user.name,
                                    groups: groups,
                                    title:"Ballroom - Groups Lists"
                                });
                            });
                        });
                    } else {
                        res.render('error/404',{
                            title : "Not Found"
                        });
                    }
                }
            });
        });
    } else {
        res.redirect('/login');
    }    
};

exports.deletegroup = function(req, res) {
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                console.log(item.userslist);
                if(item==null) {
                    res.redirect('/404');
                } else {
                    if(item.groups=='1') {
                        var id = req.params.id;
                        console.log(id);
                        db.collection('groups', function(err, collection) {
                            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                                if(item==null) {
                                    res.redirect('/ballroomgroups');
                                }
                                else {
                                    console.log(item);
                                    db.collection("groupsdelete", function(err, collection) {
                                        collection.insert(item, {safe:true}, function(err, result) {
                                          if (err) {
                                               res.send({'error':'An error has occurred'});
                                          } else {
                                            db.collection("groups", function(err, collection) {
                                                collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                                                    if (err) {
                                                        res.send({'error':'An error has occurred - ' + err});
                                                        res.redirect('/ballroomgroups');
                                                    } else {
                                                        console.log('' + result + ' document(s) deleted');
                                                        res.redirect('/ballroomgroups');
                                                    }
                                                });
                                            });                           
                                          }
                                        });
                                    });                  
                                }
                            });
                        });
                    } else {
                        res.render('error/404',{
                            title : "Not Found"
                        });
                    }
                }
            });
        });
    } else {
        res.redirect('/login');
    }
}

exports.createGroup = function(req, res){
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                if(item==null) {
                    res.redirect('/404');
                } else { 
                    if(item.groups=='1') {
                       res.render('groups/creategroup',{
                            tag : 1,
                            permission : item,
                            userinfo : req.session.user.name,
                            title:"Ballroom - Create a group",
                       });
                    } else {
                        res.render('error/404',{
                            title : "Not Found"
                        });
                    }

                }
            });
        });
    } else {
        res.redirect('/login'); 
    }
};

exports.addGroup = function(req,res) {
  if(typeof req.session['user'] != "undefined") {
      var id = req.session['user'].role_id
console.log("This is ID: ", id);
      db.collection('roles', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
          if(item==null) {
              res.redirect('/404');
          } else { 
              if(item.groups=='1') {  
                 var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/Group', multiple: true});
                 form.parse(req, function(err, fields, files){
                      if(fields['recommend'] !== "undefined")
                         fields['recommend'] = 1;
                     else
                         fields['recommend'] = 0;
                     if(files.image.name !== ''){            
                         var extn = files.image.type.substr(files.image.type.lastIndexOf("/") + 1);
                         console.log("This is extension for image", extn);
                         fs.rename(files.image.path, files.image.path+'.'+extn);
                         fields['image'] = files.image.path.substr(files.image.path.lastIndexOf("/")+1) + "."+ extn;
                     }
                         
                     else{
                         fs.unlink(files.image.path, function(){
                             console.log("Some garbage image was deleted");
                         });
                         fields['image'] = '';
                     }
                         console.log("This is fileds:", fields);
			console.log("This is files: ", files);
                     if(files.coverimage.name !==""){
                         var extn = files.coverimage.type.substr(files.coverimage.type.lastIndexOf("/") + 1);
                         console.log("This is extension for cover image", extn);
                         fs.rename(files.coverimage.path, files.coverimage.path+'.'+extn);
                         fields['coverimage'] = files.coverimage.path.substr(files.coverimage.path.lastIndexOf("/")+1) + "."+ extn;
                     }
                     else{
                         fs.unlink(files.coverimage.path, function(){
                             console.log("Some garbage cover image was deleted");
                         });
                         fields['coverimage'] = '';
                     }
                         
                     console.log(fields);
                     console.log(fields['recommend']);
                     db.collection('groups', function(err, collection) {
                         collection.insert(fields, {safe:true}, function(err, result) {
                           if (err) {
                                res.send({'error':'An error has occurred'});
                           } else {
                             res.redirect('/ballroomgroups');
                           }
                         });
                     });
                 });
              }else {
                  res.render('error/404',{
                      title : "Not Found"
                  });
              }
          }
        });
      });
    } else {
      res.redirect('/login'); 
    }
};

exports.editGroup = function(req, res){
    if(typeof req.session['user'] != "undefined") {
        var id = req.session['user'].role_id
        db.collection('roles', function(err, collection) {
            collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
                if(item==null) {
                    res.redirect('/404');
                } else { 
                    if(item.groups=='1') {  
                        console.log(req.params.id);
                        db.collection('groups', function(err, collection) {
                           collection.findOne({'_id':new BSON.ObjectID(req.params.id)}, function(err, group) {
                                if(group==null) {
                                    res.redirect('/404');
                                }
                                else {
                                    res.render('groups/editgroup',{
                                        tag : 2,
                                        permission : item,
                                        userinfo : req.session.user.name,
                                        title:"Ballroom - Edit group",
                                        group: group
                                    });
                                }    
                           });
                       });
                    } else {
                        res.redirect('/404');
                    }
                }
            });
        });
    } else {
        res.redirect('/login'); 
    }
};

exports.updateGroup = function(req, res){
   var form = new formidable.IncomingForm({uploadDir: '/home/ballroomnightz/public/img/Group', multiple: true});
   form.parse(req, function(err, fields, files){
       console.log("this is fields:  ", fields);
        if(files.image.name !== ''){            
           var extn = files.image.type.substr(files.image.type.lastIndexOf("/") + 1);
           fs.rename(files.image.path, files.image.path+'.'+extn);
            fields['image'] = files.image.path.substr(files.image.path.lastIndexOf("/")+1) + "."+ extn;
            console.log("This is extension for image", extn);
       }
       else{
           fs.unlink(files.image.path, function(){
//                console.log("Some garbage image was deleted");
           });
           fields['image'] = fields['oldImage'];
//            console.log("this is value", files.image.value);
       }
           
       if(files.coverimage.name !==""){
           var extn = files.coverimage.type.substr(files.coverimage.type.lastIndexOf("/") + 1);
            console.log("This is extension for cover image", extn);
           fs.rename(files.coverimage.path, files.coverimage.path+'.'+extn);
           fields['coverimage'] = files.coverimage.path.substr(files.coverimage.path.lastIndexOf("/")+1) + "."+ extn;
       }
       else{
           fs.unlink(files.coverimage.path, function(){
//                console.log("Some garbage cover image was deleted");
           });
           fields['coverimage'] = fields['oldCoverImage'];
           console.log("this is CI value", files.coverimage.value);
       }
        var id = fields['id'];
           delete fields.id;
           console.log("this is ID", id);
           delete fields.oldImage;
           delete fields.oldCoverImage;
       
        db.collection('groups', function(err, collection) {
           collection.update({"_id": new BSON.ObjectID(id.toString())}, fields, {safe:true}, function(err, result) {
               if(err) {
                   res.redirect('/404');
               }
               else {
                   res.redirect('/ballroomgroups');
               }
           });
       });
   });
};
