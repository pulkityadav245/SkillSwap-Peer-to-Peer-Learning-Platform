const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)

app.get("/", (req,res)=>{
res.send("SkillSwap Backend Running")
})

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err))

app.listen(process.env.PORT, ()=>{
console.log("Server running on port " + process.env.PORT)
})