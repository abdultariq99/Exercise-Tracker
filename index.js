const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config({path: 'sample.env'})
const mongoose = require('mongoose')
const bodyparser = require('body-parser');

const connectDatabase = async () =>{
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Successfully connected to MongoDB")
  } catch(err){
    console.log("Failed connecting to MongoDB")
  }
}

connectDatabase()

const trackerSchema = new mongoose.Schema({
  username: String,
  count: {type: Number, default: 0},
  log: [{
  _id : false,
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
}]
})

const tracker = mongoose.model('tracker', trackerSchema)

app.use(cors())
app.use(express.static('public'))
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


app.post('/api/users', (req,res)=>{
const createUser = async ()=>{ 
  try{
  await tracker.create({username: req.body.username})
  } catch(err){
    alert("Error creating username")
  }

  try{
   let user = await tracker.findOne({username: req.body.username})
   res.json({username: user.username, _id: user._id})
  } catch(err){
    console.log("Error finding username and id")
  }
  
}
  createUser()
})

const dateConvert = (date)=>{
  let dateConvert = new Date(date)
  let newDate = dateConvert.toDateString()
  return newDate
}

const toNumber = (val) =>{
  let newVal = parseInt(val)
  return newVal
}

app.post('/api/users/:_id/exercises',(req,res)=>{
    req.body.date = dateConvert(req.body.date)
  if(req.body.date == "Invalid Date"){
    req.body.date = dateConvert(new Date())
  }
  console.log(req.body.date)
  req.body.duration = toNumber(req.body.duration)
  let requestBody = req.body
  
  const updateData = async () =>{
    try{
        await tracker.updateOne({_id: req.params._id},{$push : {log: requestBody}, $inc: {count: 1}})

      } catch(err){
          console.log(err)
        }
    try{
      let userExercise = await tracker.findOne({_id: req.params._id})
      let userName = userExercise.username
      res.json({_id: req.params._id, username: userName, date: req.body.date, duration: req.body.duration, description: req.body.description,})
    }catch(err){
      console.log(err)
    }
  }
  updateData()
})

app.get('/api/users', (req,res)=>{
  const getAllUsers = async () =>{
    try{
      let allUsers = await tracker.find({}, {description: 0, duration: 0, date: 0, log: 0})
      res.json(allUsers)
    } catch(err){
      console.log("Error getting users")
    }
  }
  getAllUsers()
})

app.get('/api/users/:_id/logs', (req,res)=>{
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  const getUserDates = async () => {
    try{
      console.log("I am get user dates function")
      let findUser = await tracker.findOne({_id : req.params});
      let filterLog = findUser.log.filter(log =>{
        let logObj = new Date(log.date);
        return logObj >= new Date(from) && logObj<= new Date(to);
      })
      
      if(limit != undefined){
        filterLog = filterLog.slice(0, parseInt(limit))
      }
      res.json({username: findUser.username, count: findUser.count, _id: findUser._id, log: filterLog})
    } catch(err){
      console.log("Cannot find user exercises on specific dates")
    }
  }

  const getUserExercises = async () =>{
    if(limit != undefined){
      try{
       let findUserRoutine = await tracker.findOne({_id: req.params})
       let newLog = findUserRoutine.log.slice(0, parseInt(limit))
        res.json({username: findUserRoutine.username, count: findUserRoutine.count,_id: findUserRoutine._id, log: newLog})
      } catch(err){
        console.log("Failed to find user schedule")
      }
    }
    try{
      console.log("I am get user exercises function")
     let findUserRoutine = await tracker.findOne({_id: req.params})
      res.json({username: findUserRoutine.username, count: findUserRoutine.count,_id: findUserRoutine._id, log: findUserRoutine.log})
    } catch(err){
      console.log("Failed to find user schedule")
    }
  }

  if(from == undefined){
  getUserExercises()
  } else{
    getUserDates()
  }
})


