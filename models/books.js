const mongoose = require('mongoose')
const bookSchema = new mongoose.Schema ({
    bookName:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true
    }
})
module.exports = mongoose.model('Books',bookSchema)