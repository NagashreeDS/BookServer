const mongoose = require('mongoose')
const userSchema = new mongoose.Schema ({
    username :{
        type:String,
        required:true
    },
    password :{
        type:String,
        require:true
    },
    role :{
        type:String,
        default:"Customer"
        // required:true
    }
})
module.exports = mongoose.model('Users',userSchema)