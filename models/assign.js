const mongoose = require('mongoose');
const assignSchema = mongoose.Schema({
         complainId:{
             type: String,
             required: true
         },
         complainName:{
            type: String,
            required: true
         },
         complainerName:{
            type: String,
            required: true
         },
         complainerId : {
             type: String,
             required: true
         },
         type:{
            type: String,
            required: true
         },
         time:{
             type: Date,
             required: true
         },
         status:{
             type: Number
         },
         workerId : {
             type: String
         },
         workerName : {
             type: String
         }
   

});
const assign = module.exports = mongoose.model('assign',assignSchema);

