//require('newrelic');

var cluster = require('cluster');

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;
    for (var i = 0; i < 6; i += 1) {
        cluster.fork();
    }
    console.log(cpuCount);

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
    });

}else{


var express = require('express'),
    path = require('path'),
    http = require('http'),
    area = require('./routes/webservices/area.js'),
    notification = require('./routes/webservices/notifications.js'),
    feed = require('./routes/webservices/feeds.js'),
	groupfeed = require('./routes/webservices/groupfeed.js'),
    message = require('./routes/webservices/messages.js'),
    post = require('./routes/webservices/posts.js'),
    user = require('./routes/webservices/users.js'),
    search = require('./routes/webservices/search.js'),
    general = require('./routes/webservices/general.js'),
    events = require('./routes/webservices/events.js'),
    groups = require('./routes/webservices/groups.js'),
    adminarea = require('./routes/backend/area.js'),
    adminrole = require('./routes/backend/roles.js'),
    adminevent = require('./routes/backend/events.js'),
    adminpost = require('./routes/backend/posts.js'),
    adminuser = require('./routes/backend/users.js'),
    admingroup = require('./routes/backend/groups.js'),
    admindashboard = require('./routes/backend/dashboard.js'),
    adminerror = require('./routes/backend/error.js'),
    admin = require('./routes/backend/admins.js'),
	evntOrgzr = require('./routes/backend/eventorganizer/users.js'),
	evnt = require('./routes/backend/eventorganizer/events.js');
	
//	var fs = require('fs');
	http.globalAgent.maxSockets = 9999;


var app = express();
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');




app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
    //app.use(express.bodyParser()),	
	app.use(express.compress());
    app.use(express.cookieParser());
	app.use(express.cookieSession({secret:"viral"}, { cookie: { originalMaxAge: 360000*5 }}));
    //app.use(express.session({secret:"viral"}, { cookie: { originalMaxAge: 360000*5 }}));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(function (req, res, next) {

        if ('/robots.txt' == req.url) {
            res.type('text/plain')
            res.send("User-agent: *\nDisallow: /");
        } else {
            next();
        }
    });
});

// Web Services Routes Statement 

app.get('/organizer/signup', evntOrgzr.signup);
app.post('/organizer/signup', evntOrgzr.saveSignupUser);
app.get('/confirm', evntOrgzr.pendingOrganizer);
app.get('/organizer/login', evntOrgzr.showLoginPage);
app.post('/organizer/login', evntOrgzr.login);
app.get('/organizer/logout', evntOrgzr.logout);
app.get('/organizer/home', evnt.home);
app.get('/confirm/email/:id/garbage', evntOrgzr.confirmMyMail);
app.get('/organizer/addevent', evnt.showEventCreationPage);
app.post('/organizer/eventcreate', evnt.eventCreate);
app.get('/organizer/trylater', evnt.tryLater);
app.get('/organizer/sessionexpired', evnt.sessionExpired);
app.get('/organizer/myevents', evnt.listMyEvent);
app.get('/organizer/editevent/:id', evnt.editEventPage);
app.post('/organizer/eventedit', evnt.saveEditEvent);


/**** These routes line is find all users records, login, find user record by their id, follow/unfollow
      register, deactive account    ***/

app.get('/users/valid', user.validateNameEmail);
app.post('/users/profilepic', user.profileImage);
app.get('/users', general.findAll);
app.get('/pendingusers',general.findAll);
app.get('/image', user.imageTest);
app.post('/users/coverimage', user.coverImage);
app.post('/users/signup', user.save);
app.post('/users/fbsignup', user.fbSignup);
app.post('/users/fblogin', user.fbLogin);
app.post('/users/login', user.login);
app.get('/users/:id', general.findById);
app.get('/users/:id/:name', general.findColumn);
app.put('/users/follow',express.bodyParser(),user.follow);
app.put('/users/forgetpwd',express.bodyParser(),user.forgetpwd);
app.put('/users/logout',express.bodyParser(),user.logout);
app.put('/users/:id/:name',express.bodyParser(), general.updateById);
app.put('/users/unfollow',express.bodyParser(),user.unfollow);
app.delete('/users/:id/:name/:docid', general.deleteArrayById);
app.delete('/users/:id',general.deleteData);
app.get('/account/email/confirm/:id/:garbage', user.verifyUser);



/**** These routes line is find all posts, all users specific postss, find by post id, likes,comments, 
        add post, deactive post    ***/

app.post('/posts', post.uploadMedia);
app.get('/posts', general.findAll);
app.get('/posts/:id', post.getSinglePostWithUserDetails);
app.get('/posts/:id/:name', general.findColumn);
app.put('/posts/abuse/:id', post.postabuse);
//app.put('/posts/:id/likes', express.bodyParser(), feed.likeOnPost);
app.put('/posts/:id/:name',express.bodyParser(),general.updateById);
app.delete('/posts/:id/:name/:docid', general.deleteArrayById);
app.delete('/posts/:id',general.deleteData);
app.get('/count/posts/:id', post.postsCountByUser);

/**** These routes line is find all events, all users specific events, find by event id, invites,rsvp, 
      deactive event    ***/
app.post('/events/checkdate', events.checkdate);
app.get('/events/all/:date/:id', events.getAllEvents);
app.post('/events/add', events.addEvent);
app.get('/events', general.findAll);
app.get('/myevents/:id',events.myevents);
app.get('/events/:id', general.findById);
app.put('/events/:id/:name',express.bodyParser(),general.updateById);
app.get('/events/:id/:name', general.findColumn);
app.delete('/events/:id/:name/:docid', general.deleteArrayById);
app.delete('/events/:id',general.deleteData);

//for testing perpose ,for developement 
app.post('/test', post.uploadMedia);
app.get('/test', general.findAll);
app.get('/test/:id',general.findById);
app.get('/test/:id/:name', general.findColumn);
app.put('/test/:id/:name', general.updateById);
app.delete('/test/:id/:name/:docid', general.deleteArrayById);
app.delete('/test/:id',general.deleteData);

/********** Group Feed ***************/
app.get('/groups/feed/:id', groupfeed.groupFeed);
app.get('/groups/feed/recent/:id/:date', groupfeed.groupRecentFeed);
app.put('/groups/post/likes/:postid', express.bodyParser(), groupfeed.likePostofGroup);

app.get('/groups/post/:id', groups.getSingleGroupPostWithUserDetails);
app.get('/groupposts/:id/:name', general.findColumn);

app.put('/groups/post/comments/:postid', express.bodyParser(), groupfeed.commentOnGroupPost);
app.delete('/groupposts/:id/:name/:docid', general.deleteArrayById);
/**** These routes line is find all groups, all users specific groups, find by group id, users can join group ***/


app.get('/groups/notifications/:id',notification.fetchAllGroupNotifications);
app.get('/groups/notifications/count/:id',notification.groupNotificationCount);
app.get('/groups', general.findAll);
app.get('/groups/all/:id', groups.findAllGroups);
app.get('/mygroups/:id',groups.mygroups);
app.get('/groups/:id', general.findById);
app.get('/groups/:id/:name', general.findColumn);
app.post('/groups/post', groups.postNewContent);
app.put('/groups/:id/:name',express.bodyParser(),general.updateById);
app.delete('/groups/:id/:name/:docid', general.deleteArrayById);
app.delete('/groups/:id',general.deleteData);


/********** This routes line is used for sending messages, to get all chat history between two users,
            to get last chat history of login user id with all users which login user has communicate *********/

app.post('/messages',express.bodyParser(),message.message);
app.get('/getallmessages/:fromid',message.messages);
app.get('/messages',general.findAll);
app.get('/messages/:id', general.findById);
app.put('/messages/:msgid',message.messageseen);
app.delete('/messages/:id/:name/:docid', general.deleteArrayById);
app.delete('/messages/:id',general.deleteData);

/*** This route will give you max viewed posts in ballroom in order wise ****/

app.get('/explore',post.explore);

/** This routes lines gives notification for specific user id ***/
app.get('/notifications',general.findAll);
app.get('/notifications/:id',notification.notifications);
app.get('/notifications/count/:id',notification.notificationcount);
app.put('/notification/seen/:id',notification.notificationseen);
app.delete('/notifications/:id',general.deleteData);





app.get('/recommend/users/:id', feed.recommendUser);
app.get('/recommend/events/:id', feed.recommendEvents);
app.get('/recommend/groups', feed.recommendGroups);
app.get('/feed/posts/:id', feed.feedPosts);
app.get('/feed/recentposts/:id', feed.feedRecentPosts);
app.get('/feed/test/:id', feed.feedTest);
/*** this routes line gives list countries and list of states in perticular country ***********/

app.get('/countries',area.country);
app.get('/countries/:id',area.findstate);

/*** Session Management ****/

app.get('/sessions',general.findAll);

/*** Get server time ****/

app.get('/time', general.findTime);

// Backend Routes Statement 

/** error page route line ****/

app.get('/404',adminerror.error404);

/******** This route line is useful to know about various analysis about number of users,posts,events etc.. ****/

app.get('/dashboard',admindashboard.dashboard);

/***********  These are the routes lines for admin login,main admin can add,update,delete admin give them certain access 
              to manage system  ***/ 

app.get('/login',admin.loginview);
app.post('/index',express.bodyParser(),admin.adminlogin);
app.get('/ballroomadmin',admin.adminlist);
app.get('/logout',admin.logout);
app.get('/addadminuser',admin.adduserform);
app.post('/addadmin',express.bodyParser(),admin.addadmin);  
app.get('/ballroomadmin/delete/:id',admin.deleteadmin);  

/********* These are the routes for add,update,delete groups in ballroom ****************/

app.get('/ballroomgroups',admingroup.ballroomgroups);
app.get('/ballroomgroup/delete/:id',admingroup.deletegroup);
app.get('/creategroup', admingroup.createGroup);
app.post('/addgroup',  admingroup.addGroup);
app.get('/ballroomgroups/edit/:id', admingroup.editGroup);
app.post('/ballroomgroups/update', admingroup.updateGroup)

/*********** These are the routes lines for delete and suspend users, reactive the suspended users,
             and can also see active users **********/

app.get('/ballroomusers',adminuser.userslist);
app.get('/ballroomuser/delete/:id',adminuser.deleteuser);
app.get('/ballroomuser/suspend/:id',adminuser.suspenduser);
app.get('/ballroomuser/active/:id',adminuser.activeuser);
app.get('/ballroomsuspendusers',adminuser.suspenduserlist);

/*********** These are the routes lines for monitoring abuse requests of posts and can also delete abuse 
             posts from ballroom application ***************/

app.get('/ballroompost/abuse/:id',adminpost.abusepost);
app.get('/abuserequests',adminpost.abuserequests);
app.get('/abusedposts',adminpost.abusedposts);

/********  These are the routes lines for monitoring events in ballroom and can delete dummy events **********/

app.get('/ballroomevents',adminevent.ballroomevents);
app.get('/ballroomevent/delete/:id',adminevent.deleteevent);

/********* These are the routes lines for create,update,delete new role and in that admin can define what type
           access admin want to give other admin Ex. users,groups,events,posts etc.  *************/

app.get('/ballroomrole/delete/:id',adminrole.deleterole);
app.get('/editroles/:id',adminrole.editroles);
app.post('/updateroles',express.bodyParser(),adminrole.updateroles);
app.get('/ballroomroles',adminrole.ballroomroles);
app.post('/addroles',express.bodyParser(),adminrole.addroles);
app.get('/listroles',adminrole.listroles);

/*********** These are the routes lines for add,delete states in country  *********/

app.get('/addstate',adminarea.addstate);
app.post('/savestate',express.bodyParser(),adminarea.savestate);
app.get('/countrylist',adminarea.countrylist);
app.get('/statelist/:id',adminarea.statelist);
app.get('/statelist/delete/:id',adminarea.statedelete);

/*** Search *********/

app.get('/searchuser', search.searchusers);
app.get('/searchevent', search.searchevents);
app.get('/searchgroup', search.searchgroups);

/*** any routes that is not define in above lines for that it will redirect to 404 page *********/

app.get('*',function(req,res) {
    res.redirect('/404');
});

app.post('*',function(req,res) {
    res.redirect('/404');
});




http.createServer(app).listen(app.get('port'), function (error,response) {
    console.log(error);
    console.log("Express server listening on port " + app.get('port'));
});

}
