const socket = require('socket.io');

const initialzeSocket = (server) => {
    
    const  io = socket(server,{
        cors:{
            origin: "http://localhost:5173",
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.io('joinChat',()=>{

        })
        socket.io('sendMessage',()=>{

        })
        socket.io('disconnect',()=>{
            
        })

    });

};

module.exports = initialzeSocket;
