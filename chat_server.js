const net = require('net')
const colors = require('colors')

// Store connected clients
const clients = new Map()
let clientIdCounter = 1

const server = net.createServer((socket) => {
    const clientId = clientIdCounter++
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`
    
    // Store client information
    clients.set(clientId, {
        socket: socket,
        username: `User${clientId}`,
        address: remoteAddress,
        inChatMode: false
    })
    
    console.log(`Client #${clientId} connected from ${remoteAddress}`.cyan)
    
    // Send welcome message to the newly connected client
    socket.write(`Welcome to the chat server! Your ID is #${clientId}\n`)
    socket.write(`There are ${clients.size} client(s) connected\n`)
    socket.write(`Set your username with: /nick <username>\n`)
    socket.write(`List online users with: /list\n`)
    socket.write(`Send private message with: /pm <user_id> <message>\n`)
    socket.write(`Leave chat mode with: /leave\n`)
    socket.write(`Disconnect with: /quit\n`)
    
    socket.on('data', (data) => {
        const message = data.toString().trim()
        console.log(`From #${clientId} (${clients.get(clientId).username}) - ${message}`.yellow)
        
        // Check if message is a command
        if (message.startsWith('/')) {
            handleCommand(clientId, message)
        } else {
            // Regular message, only process if client is in chat mode
            const client = clients.get(clientId)
            if (client && client.inChatMode) {
                broadcastMessage(clientId, message, false)
            } else {
                socket.write('You must enter chat mode with /join before sending messages\n')
            }
        }
    })
    
    socket.on('close', () => {
        if (clients.has(clientId)) {
            const client = clients.get(clientId)
            console.log(`Client #${clientId} (${client.username}) disconnected from ${remoteAddress}`.magenta)
            
            // Only broadcast disconnection if they were in chat mode
            if (client.inChatMode) {
                broadcastToOthers(clientId, `*** ${client.username} (#${clientId}) has left the chat ***`)
            }
            
            // Remove the client
            clients.delete(clientId)
        }
    })
    
    socket.on('error', (err) => {
        console.error(`Error on client #${clientId} from ${remoteAddress} - ${err}`.red)
        if (clients.has(clientId)) {
            const client = clients.get(clientId)
            if (client.inChatMode) {
                broadcastToOthers(clientId, `*** ${client.username} (#${clientId}) disconnected due to an error ***`)
            }
            clients.delete(clientId)
        }
    })
})

// Send a message to all connected clients except the specified one
function broadcastToOthers(excludeId, message) {
    console.log(message.yellow)
    clients.forEach((client, id) => {
        if (id !== excludeId && client.inChatMode) {
            client.socket.write(`${message}\n`)
        }
    })
}

// Send a message to all connected clients
function broadcastToAll(message) {
    console.log(message.yellow)
    clients.forEach((client) => {
        if (client.inChatMode) {
            client.socket.write(`${message}\n`)
        }
    })
}

// Send a chat message from a specific client to all clients in chat mode
function broadcastMessage(senderId, message, isSystemMessage) {
    const sender = clients.get(senderId)
    if (!sender) return
    
    const senderName = sender.username
    
    clients.forEach((client, id) => {
        if (!client.inChatMode) return
        
        if (isSystemMessage || id !== senderId) {
            // If system message or not the sender, send the formatted message
            client.socket.write(`${isSystemMessage ? '' : `${senderName}: `}${message}\n`)
        } else {
            // Echo back to sender for confirmation
            client.socket.write(`You: ${message}\n`)
        }
    })
}

function sendPrivateMessage(senderId, receiverId, message) {
    const sender = clients.get(senderId)
    const receiver = clients.get(parseInt(receiverId))
    
    if (!sender) return
    
    if (!receiver) {
        sender.socket.write(`Error: User #${receiverId} not found\n`)
        return
    }
    
    receiver.socket.write(`[PM from ${sender.username} (#${senderId})]: ${message}\n`)
    sender.socket.write(`[PM to ${receiver.username} (#${receiverId})]: ${message}\n`)
}

function handleCommand(clientId, message) {
    const client = clients.get(clientId)
    if (!client) return
    
    const parts = message.split(' ')
    const command = parts[0].toLowerCase()
    
    switch (command) {
        case '/join':
            if (!client.inChatMode) {
                client.inChatMode = true
                client.socket.write(`You have entered chat mode. Everyone can see your messages now.\n`)
                broadcastToOthers(clientId, `*** ${client.username} (#${clientId}) has joined the chat ***`)
            } else {
                client.socket.write(`You are already in chat mode\n`)
            }
            break;
            
        case '/leave':
            if (client.inChatMode) {
                client.inChatMode = false
                client.socket.write(`You have left chat mode. Your messages are now private.\n`)
                broadcastToOthers(clientId, `*** ${client.username} (#${clientId}) has left the chat ***`)
            } else {
                client.socket.write(`You are not in chat mode\n`)
            }
            break;
            
        case '/nick':
            if (parts.length < 2) {
                client.socket.write('Usage: /nick <username>\n')
                return
            }
            const newUsername = parts[1]
            const oldUsername = client.username
            client.username = newUsername
            client.socket.write(`You changed your username to ${newUsername}\n`)
            
            if (client.inChatMode) {
                broadcastToOthers(clientId, `*** ${oldUsername} (#${clientId}) changed their username to ${newUsername} ***`)
            }
            break
            
        case '/list':
            let userList = '=== Online users ===\n'
            clients.forEach((c, id) => {
                userList += `#${id}: ${c.username} (${c.inChatMode ? 'in chat' : 'not in chat'})\n`
            })
            userList += '===================\n'
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
            
        case '/quit':
            client.socket.end('Goodbye!\n')
            break
            
        default:
            client.socket.write(`Unknown command: ${command}\n`)
    }
}

const PORT = 8086
const HOST = '127.0.0.1'

server.listen(PORT, HOST, () => {
    console.log(`Chat server running on ${HOST}:${PORT}`.green)
})