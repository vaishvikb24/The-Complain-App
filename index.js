const passport = require('passport');
const express = require('express');
const path= require('path');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const users = require('./routers/users');
const config = require('./config/database');
const app = express();

// **************************************************************************************************
const port = 4000;

var server = app.listen(port ,()=>{
    console.log("server is running on port : " + port );
    // console.log(new Date(2025,07,24));
});
// connecting to a database..
mongoose.connect(config.database);
//console.log(config.secret); just using dataTypes from cingfig/database 's file
mongoose.connection.on('connected' ,()=>{
    console.log("connectd to " + config.database);
});

// error handling 
mongoose.connection.on('error' ,(err)=>{
    console.log("error is :" + err);
});
//setting up the middle-wares ..
app.use(cors());
app.use(bodyParser.json());

//passport for authentication ...
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);
// set static folder :
//app.use(express.static(path.join(__dirname ,'public')));
app.use(express.static(path.join(__dirname,'/angular/dist')));

app.use('/users',users);
// index main file of application 
app.get('/',(req,res,next)=>{  // write req before the res and next ....
    res.send("invalid endpoint : ");
});

app.get('*',(req,res)=>{
    res.send(path.join(__dirname , 'public/index.html'));
});

