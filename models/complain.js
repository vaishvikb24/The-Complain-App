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
         status: {
             type: Boolean,
             required: true
         }
});
const complain = module.exports = mongoose.model('complains',complainSchema);

