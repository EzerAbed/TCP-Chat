const net = require('net')
const colors = require('colors')

// Store connected clients
const clients = new Map()
let clientIdCounter = 1

const server = net.createServer((socket) => {
    const clientId = clientIdCounter++
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`

    // store client information
    clients.set(clientId, {
        socket: socket,
        username: `User${clientId}`,
        address: remoteAddress
    })

    console.log(`Client #${clientId} connected from ${remoteAddress}`.cyan)


    // sending welcome messages to the newly connected client 
    socket.write(`Welcome to the chat server! Your ID is #${clientId}\n`)
    socket.write(`There are ${clients.size} client(s) connected \n`)
    socket.write('Set your username with: /nick <username> \n')
    socket.write('List online users with: /list \n')
    socket.write('send private message with: /pm <user_id> <message>\n')
    socket.write('Disconnect with /quit\n')

    //Broadcast new user connection to all other clients
    broadcastMessage(clientId, `Client #${clientId} has joined the chat`)

    socket.on('data', (data) => {
        const message = data.toString().trim()
        console.log(`From ${clientId} (${clients.get(clientId).username}) - ${message}`.yellow)

        // Check if message is a command
        if (message.startsWith('/')){
            handleCommand(clientId, message)
        } else {
            broadcastMessage(clientId, message)
        }
    })

    socket.on('close', () => {
        console.log(`Client #${clientId} disconnected from ${remoteAddress}`.magenta)
        broadcastMessage(clientId, `Client #${clientId} (${clients.get(clientId).username}) has left the chat`)
        clients.delete(clientId)
    })

    socket.on('error', (err) => {
        console.error(`Error on client #${clientId} from ${remoteAddress} - ${err}`.red)
        clients.delete(clientId)
    })
})

function broadcastMessage(senderId, message) {
    const sender = clients.get(senderId)
    if(!sender) return

    const senderName = sender.username
    clients.forEach((clientIdCounter, id) => {
        if(id !== senderId){
            clientIdCounter.socket.write(`${senderName} : ${message}\n`)
        }
    })
}

function sendPrivateMessage(senderId, receiverId, message){
    const sender = clients.get(senderId)
    const receiver = clients.get(parseInt(receiverId))

    if(!sender ||!receiver){
        if(sender){
            sender.socket.write(`Error: User #${receiverId} not found\n`)
        }
        return
    }

    receiver.socket.write(`[PM from ${sender.username}] : ${message}\n`)
    sender.socket.write(`[PM to ${receiver.username}] : ${message}\n`)
}

function handleCommand(clientId, message) {
    const client = clients.get(clientId)
    if(!client) return

    const parts = message.split(' ')
    const command = parts[0].toLowerCase()

    switch(command) {
        case '/nick':
            if (parts.length < 2) {
                client.socket.write('Usage: /nick <username>\n')
                return
            }

            const newUsername = parts[1]
            const oldUsername = client.username
            client.username = newUsername
            client.socket.write(`You changed your username to ${newUsername}\n`)
            broadcastMessage(clientId, `${oldUsername} changed their username to ${newUsername}`)
            break
        
        case '/list' : 
            let userList = 'Online users: \n'
            clients.forEach((c, id) => {
                userList += `#${id}: ${c.username} (${c.address})\n`
            })
            client.socket.write(userList)
            break

        case '/pm':
            if (parts.length < 3) {
                client.socket.write('Usage: /pm <user_id> <message>\n')
                return
            }

            const receiverId = parts[1]
            const pmMessage = parts.slice(2).join(' ')
            sendPrivateMessage(clientId, receiverId, pmMessage)
            break

        case '/quit' : 
            client.socket.end('Goodbye! See you soon! \n')
            break
        
        default:
            client.socket.write('Unknown command. Type /help for a list of commands.\n')
    }
}

const PORT = 8000
const HOST = '127.0.0.1'

server.listen(PORT, HOST, () => {
    console.log(`Chat server is running on ${HOST}:${PORT}`.green)
})