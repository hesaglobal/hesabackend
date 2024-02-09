const socketIo = (socket, id) => {
    console.log('id', id) 

    socket.on('addDoc', doc => {
        console.log('doc', doc) 
    })

}

module.exports = socketIo