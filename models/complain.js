const mongoose = require('mongoose');
const complainSchema = mongoose.Schema({

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
         city:{
            type: String,
            required: true
         },
         area:{
            type: String,
            required: true
         },
         time:{
             type: Date,
             required: true
         },
         image: {
             type: Object
         },
         completed: {
             type: Boolean,
             required: true
         } ,
         status: {
             type: Number,
             required: true
         },
         assigned: {
             type: Boolean,
             required: true
         }
   

});
const complain = module.exports = mongoose.model('complains',complainSchema);

