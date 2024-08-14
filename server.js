require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const dbUrl = "mongodb+srv://Nagashreeds:MongoBook@bookscluster.ufkbk.mongodb.net/"
const User = require('./models/users')
const Book = require('./models/books')
const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')
app.use(express.json())

const crypto = require('crypto')
const secretKey = crypto.randomBytes(32).toString('hex')

mongoose.connect(dbUrl).then(()=> {
    console.log("connected to mongo db")
}).catch((err)=> {
    console.log("failed to connect to mongo db",err)
})

const db = mongoose.connection 

function verifyManagerRole(req,res,next) {
    const authHeader= req.headers['authorization'];
    console.log("auth header",authHeader)

    if(!authHeader)
    {
        return res.status(401).json({message:"Access Denied"})
    }
    try{
        console.log("entered try of verify manager")
        // const decodedValue = jwt.verify(authHeader,secretKey);
        const decodedValue = jwt.verify(authHeader,process.env.SECRET_KEY);
        console.log("decoded",decodedValue)
        if(decodedValue.role!== 'Manager'){
            return res.status(403).json({message:"Forbidden:Only managers can perform this action"})
        }
        req.user = decodedValue;
        next();
    }
    catch(err){
        res.status(403).json({message:"Invalid Token"})
    }

}

function verifyCustomerRole(req,res,next) {
    const authHeader= req.headers['authorization'];
    console.log("auth header",authHeader)

    if(!authHeader)
    {
        return res.status(401).json({message:"Access Denied"})
    }
    try{
        console.log("entered try of verify manager")
        // const decodedValue = jwt.verify(authHeader,secretKey);
        const decodedValue = jwt.verify(authHeader,process.env.SECRET_KEY);
        console.log("decoded",decodedValue)
        if(decodedValue.role!== 'Customer'){
            return res.status(403).json({message:"Forbidden:Only customers can perform this action"})
        }
        req.user = decodedValue;
        next();
    }
    catch(err){
        res.status(403).json({message:"Invalid Token"})
    }

}
app.post('/api/auth/signup',async (req,res)=> {
    const hashedPassword = await bcrypt.hash(req.body.password,10)
    const userDetails = new User({
        username: req.body.username,
        password: hashedPassword,
        role: req.body.role
    })
    try {
       
        const newUser = await userDetails.save()
        // const tokenPayload = {
        //     username:newUser.username,
        //     // password:newUser.password,
        //     role:newUser.role
        // }
        
        // const createToken = jwt.sign(tokenPayload,secretKey,{expiresIn:'1h'})
        // res.json({accessToken:createToken})
        // res.status(201).json(newUser)
        res.status(201).json({message:"User created Successfully!"})
    }
    catch(err)
    {
        res.status(400).json({message:err.message})
    }
   
})
app.post('/api/auth/signin',async(req,res)=> {
    try{
        const user = await User.findOne({username:req.body.username});
        console.log("user name",user)
        if(!user)
        {
            return res.status(400).json({message:"invalid username or password"})
        }
        const isPasswordValid = await bcrypt.compare(req.body.password,user.password);
        if(!isPasswordValid)
        {
            return res.status(400).json({message:"invalid username or password"})
        }
        const tokenPayload = {
            username:user.username,
            role:user.role

        }
        // const accessToken = jwt.sign(tokenPayload,secretKey,{expiresIn:'1h'})
        const accessToken = jwt.sign(tokenPayload,process.env.SECRET_KEY,{expiresIn:'1h'})
        res.json({accessToken:accessToken})
    }
    catch(err) {
        res.status(400).json({message:err.message})
    }
})

app.post('/api/books',verifyManagerRole,async(req,res)=> {
    const bookDetails = new Book({
        bookName: req.body.bookName,
        status: req.body.status
    })
    try{
        const newBook = await bookDetails.save()
        res.status(201).json({message:"Book inserted successfully!"})
    }
    catch{(err)=> {
        res.status(400).json({message:err})
    }}
})
app.get('/api/books',async(req,res)=> {
    try{
        const books= await Book.find()
        res.json(books)
    }
    catch(err) {
        res.status(500).json({message:err.message})
    }
})

app.get('/api/books/:bookName',async(req, res)=> {
    try{

        const trimmedBookName = req.params.bookName.trim()
        const book = await Book.findOne({bookName:trimmedBookName})
        res.json(book)
    }
    catch(err) {
        res.status(404).json({message:"Book not found"})
    }
})
app.delete('/api/books/:bookName',verifyManagerRole,async(req,res)=> {
    try {
        const trimmedBookName = req.params.bookName.trim()
        const book = await Book.findOne({bookName:trimmedBookName})
        if(!book){
            return res.status(404).json({message:"Book not found"})
        }
        await Book.deleteOne({bookName:trimmedBookName})
        res.json({message:"Book deleted successfully"})

    }
    catch(err){
        res.status(500).json({message:err.message})
    }
})
app.post('/api/books/buy',verifyCustomerRole,async(req,res)=> {
    try{
        const bookName = req.body.bookName;
        const book = await Book.findOne({bookName:bookName})
        if(book.status === "Sold")
        {
            return res.status(404).json({message:"Book sold"})
        }
        if(!book)
        {
            return res.status(404).json({message:"Book not found"})
        }
        book.status = 'Sold';
        await book.save()
        res.json({message:"Book purchased successfully"})
    }
        catch(err){
            res.status(500).json({message:err.message})
        }
})

app.listen(4000,()=> {
    console.log('Server is running on port 4000')
})