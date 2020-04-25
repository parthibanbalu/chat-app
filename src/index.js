const path = require('path')
const express = require('express')
const app = express()
const socketio = require('socket.io')
const http = require('http')
const server = http.createServer(app)
const Filter = require('bad-words')
const io = socketio(server)
const {generatemessage,generatelocationmessage} = require('./utils/messages')
const {addUser,removeuser,getuser,getusersinroom} = require('./utils/user')

const port = process.env.PORT || 3000
const publicdirectorypath = path.join(__dirname,'../public')

app.use(express.static(publicdirectorypath))
const msg = 'Welcome!'
io.on('connection' ,(socket) => {
    console.log('new server connection')

    socket.on('join',(options,callback) => {
        const {error,user} = addUser({id: socket.id,...options})
        if(error){
           return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generatemessage('Admin','welcomes you'))
        socket.broadcast.to(user.room).emit('message',generatemessage('Admin has informed that',`A ${user.username} has been joined`))
        io.to(user.room).emit('roomdata',{
            room: user.room,
            users: getusersinroom(user.room)
        })
        callback()
    })
    socket.on('sendmessage',(msg,callback) => {
        const user = getuser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(msg)){  
            return callback('profane is not allowed')
        }
        io.to(user.room).emit('message',generatemessage(user.username,msg))
        callback()
    })
    socket.on('send-location',(coords,callback) => {
        const user = getuser(socket.id)
        io.to(user.room).emit('locationmsg',generatelocationmessage(user.username,`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })



    socket.on('disconnect',() =>{
        const user = removeuser(socket.id)
        if(user){
            io.to(user.room).emit('message',generatemessage('This is informed by Admin that',`${user.username} has left`))
            io.to(user.room).emit('roomdata',{
                room: user.room,
                users: getusersinroom(user.room)
            })
        }
        
        
    })

})

server.listen(port,() => {
    console.log('server is on port '+ port)
})