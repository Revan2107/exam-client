const {mainAPICall} = require('./controller/RequestController');
const credentials = require('./config');
const mongoose = require('mongoose');
const express = require('express')
const app = express()

mongoose.connect(`mongodb+srv://${credentials['db-user']}:${credentials['db-password']}@${credentials['db-host']}/${credentials['db-name']}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 200000
}).then(()=>{
    console.log('Successfully connected to MongoDB')
}).catch((error)=>{
    console.log(error);
})

app.get('/', (req, res, next)=>{
        console.log('start at', new Date());
        next()
},
    mainAPICall,
    ()=>{
        console.log('finish at', new Date());
        console.log('=================================');
})

app.listen(3000, ()=>{
    console.log('Client started on port 3000')
})