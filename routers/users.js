const express = require('express');
const myUser = require('../models/users_schema');
const complain = require('../models/complain');
const paypal = require('paypal-rest-sdk');
const routers = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const config = require('../config/database');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/the_complain_app');
var ObjectId = require('mongoose').Types.ObjectId; 
var MongoClient = require('mongodb').MongoClient,
assert = require('assert');
var cmd = require('node-cmd');
const assign = require('../models/assign');

routers.get('/getNumbers',(req,res)=>{
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://127.0.0.1:27017/";
  MongoClient.connect(url, function(err, db) {
  if (err) console.log(err);
  var dbo = db.db('the_complain_app');
  var totalComplains = 0;
  var totalComplainRoad  = 0;
  var completed = 0;
  dbo.collection("complains").find().count((err,count)=>{
      if(err)console.log(err);
      else{
        // console.log("Total " + count);
        totalComplains = count;
      }
  });
  dbo.collection("complains").find({"type":"Road"}).count((err,count2)=>{
    if(err)console.log(err);
    else{
      // console.log("Road " + count2);
      totalComplainsRoad = count2;

    }
  });
  dbo.collection("complains").find({"completed":true}).count((err,count4)=>{
    if(err)console.log(err);
    else{
      // console.log("Completed" + count4);
      completed = count4;

    }
  });
  dbo.collection("complains").find({"type":"Water"}).count((err,count3)=>{
    if(err)console.log(err);
    else{
      // console.log("Water " + count3);
      var totalComplainsWater = count3;
      // console.log(totalComplains  + " " + totalComplainsRoad + " " + totalComplainsWater + " " + completed);
      var obj = {
        "total" : totalComplains,
        "Water" : totalComplainsWater,
        "Road" : totalComplainsRoad,
        "Completed" : completed
      }
      res.json(obj);
    }
  });


  db.close();
  }); 
});

routers.post('/progressOfComplain/:id',(req,res)=>{
    let cid = req.params.id;
    console.log(cid);
    console.log(req.body.status);
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://127.0.0.1:27017/";
    MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db('the_complain_app');
    var myquery = { 
        _id : new ObjectId(cid),
    };
    var newvalues = { $set: {status : req.body.number} };
    dbo.collection("complains").updateOne(myquery, newvalues, function(err) {
            if (err) console.log(err);
    });
    var myquery_ = {
        complainId : cid
    }

    if(req.body.number == 100){
      var newvalues_ = { $set: {completed : true} };
      dbo.collection("complains").updateOne(myquery, newvalues_, function(err) {
        if (err) console.log(err);
    });
    }
    dbo.collection("assigns").updateOne(myquery_, newvalues,(err)=>{
            if(err){
              res.json({success:false , msg:'there is some problem in updating progression.'});
              console.log(err);        
            }
            else  
              res.json({success:true , msg:'Complain s progression successfully UPDATED !!! '});
    });
        db.close();
    }); 

});

routers.post('/email', (req, res, next) => {
    sender_email = req.body.sender_email;
    sender_pw = req.body.sender_pw;
    receiver_email = req.body.receiver_email;
    message = req.body.message;
    console.log(sender_email + " "+ sender_pw + " "+ receiver_email + " "+ message);
    var pyProcess = cmd.get('python ./routers/sendOTP.py ' + sender_email + ' ' + sender_pw + ' ' + receiver_email + ' ' + message ,
              function(data, err, stderr) {
                if (!err) {
                  console.log("data from python script " + data);
                  res.json({success:true, msg : 'OTP sent successfully\n'});
                } else {
                  console.log("python script cmd error: " + err);
                  res.json({success:false, msg : 'Error in Sending Mail ! \n'});
                  }
                }
              );
});
 

routers.get('/getUsers',(req,res,next)=>{

  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
      var users = [];
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
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

routers.get('/getAsscomplains/:wid',(req,res,next)=>{
  let wid = req.params.wid;
  console.log(wid);
  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
      var users = [];
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
          var cursor = db1.collection('assigns').find({"workerId": wid});
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

routers.post('/addComplain',(req,res,next)=>{
  const time = new Date();
  let newComp = new complain({
    complainerName : req.body.complainerName,
    complainName : req.body.complainName,
    type : req.body.type,
    city : req.body.city,
    area : req.body.area,
    complainerId : req.body.complainerId,
    time : time,
    image : null,
    assigned : false,
    status: 0,
    completed: false,
    source : "The Complain APP",
    Location : {
      latitude : req.body.latitude,
      longitude: req.body.longitude
    },
    payment : false,
    worker : []
  });
  console.log(newComp);
  newComp.save((err)=>{
      if(err){res.json({success:false , msg:'there is some problem .'});
              console.log(err);        
      }
      else  res.json({success:true , msg:'Complain is successfully registred.'});
  });
});

routers.post('/assignComplainToWorker',(req,res,next)=>{
  console.log("Assigning complain to worker");
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://127.0.0.1:27017/";
  MongoClient.connect(url, function(err, db) {
  if (err) console.log(err);
  var dbo = db.db('the_complain_app');
  var myquery = { 
      _id : new ObjectId(req.body.complainId),
  };
  var newvalues = { $set: {assigned : true} };
  dbo.collection("complains").updateOne(myquery, newvalues, function(err) {
          if (err) console.log(err);
  });
      db.close();
  }); 

  const time = new Date();
  let newAssign = new assign({
    complainerName : req.body.complainerName,
    complainName : req.body.complainName,
    complainerId : req.body.complainerId,
    complainId : req.body.complainId,
    time : time,
    status: 0,
    type: req.body.type,
    workerId : req.body.workerId,
    workerName : req.body.workerName
  });
  // console.log(newAssign);
  newAssign.save((err)=>{
      if(err){res.json({success:false , msg:'There is some problem in assingning Try agian later.'});
              console.log(err);        
      }
      else  res.json({success:true , msg:'Workers complain has been successfully assigned. Thank You !!'});
  });
});

routers.get('/viewComplains/:name',(req,res,next)=>{
  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
      let name = req.params.name;
      // console.log("view complains " + name);
      var complains = [];
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
        if(name != "GiveMeAllComplains"){
          var cursor = db1.collection('complains').find({"complainerId":name});
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
        }else{
          var cursor = db1.collection('complains').find();
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
        }

  });
});

routers.get('/viewComplainById/:id',(req,res,next)=>{
  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
      let name = req.params.id;
      let myid =  new ObjectId(name);
      console.log("view complain with id " + name + "             " + myid);
      var complains = null;
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
          var cursor = db1.collection('complains').find({"_id":myid});
          cursor.forEach(
          function(doc) {
              complains = doc;
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
        type : req.body.acc_type,
        category : req.body.category,
        varified : false,
        complains : []
    }); 
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
        var dbo = db.db('the_complain_app');
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

    MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
        var users = [];
        assert.equal(err, null);
        var db1 = db.db('the_complain_app');
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
const mongoURI = 'mongodb://localhost:27017/the_complain_app';
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

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'ARnIB36gmVQVudXCSEvGUf_JNN35-jgG2F-bMYgwtnItSsVhRPGxqNL0bHediVCuGvvV_LgZwdVu1NCg',
  'client_secret': 'EKjXTh_U4R4C1YOR_mCzn9RdaDulT4W9exmGwEXYilCFND0e7_4Oz1il5BGnl3bpG82Iugvpm6yu653y'
});

routers.post('/pay', (req, res) => {
  // console.log("paying");

  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:4000/users/success/"+req.body.price,
        "cancel_url": "http://localhost:4000/users/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": req.body.name,
                "sku": "001",
                "price": req.body.price,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": req.body.price
        },
        "description": req.body.discription
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      console.log(error);
      res.send({url : 'you should have internet connection for payment',
          success: false});
      // console.log(err)or;
  } else {

      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          // console.log("URL : " + payment.links[i].hrefs);  
          res.send({url :payment.links[i].href,
                    success: true});
        }
      }
  }
});

});

routers.get('/success/:money', (req, res) => {
  let money_ = req.param("money"); 
  // console.log(money_); 
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": money_
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        console.log(err);
    } else {
      MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {
          var db1 = db.db('the_complain_app');
          let payment_ = db1.collection("payment"); 
          payment_.insertOne(payment , (err,res)=>{
              if(err){
                  console.log("Err " + err);
              }else {
                  console.log("REs " + res);
              }
          });      
          console.log(payment.transactions[0].item_list.items[0].name);
          var newvalues2 =  { $set: {payment : true} }
          var myquery = { 
            _id : new ObjectId(payment.transactions[0].item_list.items[0].name),
        };
          db1.collection("complains").updateOne(myquery,newvalues2,(err)=>{
                  if(err) console.log(err);
          });

      });
      // console.log(payment.id);
      res.redirect("http://localhost:4200/payment/" + payment.id);
    }
});
});

routers.get('/cancel', (req, res) => res.send('Cancelled'));

routers.get('/paymentDetails/:id',(req,res,next)=>{
  // console.log("start");  
  let id_ = req.param("id"); 
  // console.log(id_);
  MongoClient.connect('mongodb://localhost:27017/the_complain_app', function(err, db) {

      var users = null;
      assert.equal(err, null);
      var db1 = db.db('the_complain_app');
          var cursor = db1.collection('payment').find();
          cursor.forEach(
          function(doc) {
              // console.log(doc);
              if(doc.id == id_)
                  users = doc;
                  console.log(users);
           },
          function(err) {
              if(err) return err;
              db.close();
             res.json(users);
          }
      );
  });
});