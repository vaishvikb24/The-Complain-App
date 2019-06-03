const express = require('express');
const myUser = require('../models/users_schema');
const complain = require('../models/complain');
const routers = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('../config/database');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/renting_system');
var ObjectId = require('mongoose').Types.ObjectId; 
var MongoClient = require('mongodb').MongoClient,
assert = require('assert');
var cmd = require('node-cmd');


routers.post('/email', (req, res, next) => {

    // console.log(req);
    sender_email = req.body.sender_email;
    sender_pw = req.body.sender_pw;
    receiver_email = req.body.receiver_email;
    message = req.body.message;
    console.log(sender_email + " "+ sender_pw + " "+ receiver_email + " "+ message);
    var pyProcess = cmd.get('python ./routers/sendOTP.py ' + sender_email + ' ' + sender_pw + ' ' + receiver_email + ' ' + message ,
              function(data, err, stderr) {
                // console.log(data)
                // console.log("**********")
                // console.log(err)
                if (!err) {
                  console.log("data from python script " + data)
                } else {
                  console.log("python script cmd error: " + err)
                  }
                }
              );
    res.json({success:true, msg : 'OTP sent successfully\n'});
});
 

routers.post('/addComplain',(req,res,next)=>{
  // console.log(req.body);
  const time = new Date();
  let newComp = new complain({
    complainerName : req.body.complainerName,
    complainName : req.body.complainName,
    type : req.body.type,
    city : req.body.city,
    area : req.body.area,
    time : time,
    image : null,
    status : false
  });
  console.log(newComp);
  newComp.save((err)=>{
      if(err){res.json({success:false , msg:'there is some problem .'});
              console.log(err);        
      }
      else  res.json({success:true , msg:'Complain is successfully registred.'});
  });
});


routers.get('/viewComplains/:name',(req,res,next)=>{
  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
      let name = req.params.name;
      console.log("view complains " + name);
      var complains = [];
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
          var cursor = db1.collection('complains').find({"complainerName":name});
          cursor.forEach(
          function(doc) {
              complains.push(doc);

           },
          function(err) {
              if(err) return err;
              db.close();
              console.log(complains);
             res.json(complains);
          }
      );
  });
});

routers.get('/viewComplains',(req,res,next)=>{

  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
      var complains = [];
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
          var cursor = db1.collection('complains').find();
          cursor.forEach(
          function(doc) {
              complains.push(doc);
           },
          function(err) {
              if(err) return err;
              db.close();
             res.json(complains);
          }
      );
  });
});

routers.post('/register',(req,res,next)=>{
    
    let newUser = new myUser({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        url: req.body.url,
        phoneNum: req.body.phoneNum,
        type : "Citizen"
    }); 
    // /console.log("reguster");
    // console.log(newUser);
    myUser.addUser(newUser,(err,myUser)=>{
        if(err){res.json({ success:false , msg:'failed to connect : '});}
        else{res.json({success:true ,msg:'connected succesfully '});
        }
    });
   
});

routers.get('/profile', passport.authenticate('jwt', {session:false}), (req, res, next) => {
    res.json({user: req.user});
});

routers.post('/changePassword',(req,res,next)=>{
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";
    console.log(req.body);
    MongoClient.connect(url, function(err, db) {
        if (err) console.log(err);
        var dbo = db.db('renting_system');
        // console.log(req.body);
        dbo.collection('users').find({username : req.body.username}).toArray((err, users) => {
            if(err) {
                console.log(err);
                res.json({success:false , msg:'Could not change password !'});
                return false;
            }else{
                // console.log(users[0]);
                if(users[0] == null){
                    res.json({ success:false , msg:'Could not find any user by this username ' + req.body.username});
                    return false;
                }
                let newUser = users[0];
                newUser.password = req.body.newPassword;
                // console.log(newUser);
                let newUser2 = new myUser({
                    name: newUser.name,
                    email: newUser.email,
                    password: newUser.password,
                    username: newUser.username,
                    url: newUser.url,
                    phoneNum: newUser.phoneNum
                }); 
                console.log("start");
                console.log(newUser2);
                myUser.addUser(newUser2,(errs,myUser)=>{
                    if(errs){console.log("error" + errs);
                            res.json({ success:false , msg:'Could not change password ! '});
                    }
                });
                dbo.collection('users').deleteOne({username:req.body.username},(error_,suc)=>{
                    // console.log(suc);
                    if(error_){res.json({ success:false , msg:'Could not change password ! '});}
                    else{res.json({success:true ,msg:'Password has been successfully changed !'});
                    }
                    db.close();
                });
               
               
            }

        });

    }); 
});

routers.get('/getUsers',(req,res,next)=>{

    MongoClient.connect('mongodb://localhost:27017/renting_system', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('renting_system');
            var cursor = db1.collection('users').find();
            cursor.forEach(
            function(doc) {
                users.push(doc);
             },
            function(err) {
                if(err) return err;
                db.close();
               res.json(users);
            }
        );
    });
});
    
routers.post('/authentication',(req,res,next)=>{
    const username = req.body.username;
    const password = req.body.password;

    // console.log("----")
    console.log("Password: "+ password + "    " + username);
    myUser.getUserByUsername(username , (err,user)=>{
        if(err)console.log(err);
        if(!user)return res.json({success:false , msg:'User not found , Enter Valid Username ! '});
        myUser.comparePassword(password , user.password ,(err,isMatch)=>{
                if(err){
                    //console.log("vvvvvvvv");
                    console.log(err);}
                if(isMatch){
                    //console.log("/////");
                    const token =jwt.sign(user.toJSON(),config.secert,{
                        expiresIn :100000  //1 week 
                    });
                    res.json({success:true , msg:'Successfully LoggedIn ',token:'JWT '+token ,
                    user:{
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        url: user.url
                    }
                });
                }
                else 
                {
                  return res.json({success:false ,msg:'Incorrect Passowrd , Enter Valid Password !'});
                }
        })
    })
  
});

module.exports = routers;
const crypto = require('crypto');
const mongoose2 = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
// Mongo URI
const mongoURI = 'mongodb://localhost:27017/renting_system';
// Create mongo connection
const conn = mongoose2.createConnection(mongoURI);
// Init gfs
let gfs;
conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose2.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = file.originalname; //+ path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage  });

// @route GET /
// @desc Loads form
routers.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
routers.post('/upload', upload.single('file'), (req, res) => {
  res.json({success:true , msg:'uploaded'});
});

// @route GET /files
// @desc  Display all files in JSON
routers.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
routers.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
routers.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
routers.delete('/files/:id', (req, res) => {
  console.log("deleting");  
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
    res.json({success:true , msg:'deleted'});
    // res.redirect('/');
  });
});

