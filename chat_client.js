const colors = require('colors')
const net = require('net')
const prompt = require('prompt-sync')({ sigint: true })
const readline = require('readline')

let client = null
let username = null
let rl = null
let inChatMode = false

// Setup readline interface for better input handling
function setupReadline() {
    if (rl) {
        rl.close()
    }
    
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    })
}

const destroyConnection = () => {
    if (client) {
        client.destroy()
        client = null
        console.log('Disconnected from server'.bold.yellow)
    }
    
    if (inChatMode) {
        inChatMode = false
        exitChatMode()
    } else {
        menuReturn()
    }
}

const menuReturn = () => {
    if (inChatMode) return
    setTimeout(() => menu(), 500)
}

const createClient = () => {
    if (!client) {
        const ADDRESS = prompt('Type server address: ') || '127.0.0.1'
        const PORT = prompt('Type server port: ') || 8086
        
        client = new net.Socket()
        
        client.connect(PORT, ADDRESS, () => {
            console.log(`Connected to chat server at ${ADDRESS}:${PORT}`.bold.green)
            console.log('Waiting for server welcome message...'.italic.gray)
        })
        
        client.on('data', (data) => {
            // Clear the current line if in chat mode
            if (inChatMode && rl) {
                readline.clearLine(process.stdout, 0)
                readline.cursorTo(process.stdout, 0)
                console.log(`${data.toString().trim()}`.cyan)
                rl.prompt(true)
            } else {
                console.log(`${data.toString().trim()}`.cyan)
            }
        })
        
        client.on('close', () => {
            console.log('Connection closed by server'.bold.yellow)
            client = null
            
            if (inChatMode) {
                inChatMode = false
                exitChatMode()
            } else {
                menuReturn()
            }
        })
        
        client.on('error', (err) => {
            console.log(`Error: ${err.message}`.bold.red)
            destroyConnection()
        })
        
        menuReturn()
    } else {
        console.log('Already connected to a server. Disconnect first to connect to another server.'.bold.red)
        menuReturn()
    }
}

const exitChatMode = () => {
    if (client && inChatMode) {
        // Tell the server we're leaving chat mode
        client.write('/leave')
    }
    
    inChatMode = false
    if (rl) {
        rl.close()
        rl = null
    }
    console.log('\nExited chat mode'.bold.yellow)
    menuReturn()
}

const enterChatMode = () => {
    if (!client) {
        console.log('Not connected to a server. Please connect first.'.bold.red)
        return menuReturn()
    }
    
    console.clear()
    console.log('\n=== CHAT MODE ==='.bold.green)
    console.log('Type messages to send to all users')
    console.log('Commands:')
    console.log('  /nick <username> - Change your username')
    console.log('  /list - Show online users')
    console.log('  /pm <user_id> <message> - Send private message')
    console.log('  /leave - Leave chat mode')
    console.log('  /quit - Disconnect from server')
    console.log('  /exit - Return to menu (same as /leave)')
    console.log('=================\n'.bold.green)
    
    // Tell the server we're joining chat
    client.write('/join')
    
    inChatMode = true
    setupReadline()
    
    rl.prompt()
    
    rl.on('line', (line) => {
        const message = line.trim()
        
        if (message === '/exit') {
            exitChatMode()
            return
        }
        
        if (client) {
            client.write(message)
            rl.prompt()
        } else {
            console.log('Connection lost'.bold.red)
            exitChatMode()
        }
    })
    
    rl.on('close', () => {
        if (inChatMode) {
            exitChatMode()
        }
    })
}

const setUsername = () => {
    if (!client) {
        console.log('Not connected to a server. Please connect first.'.bold.red)
        return menuReturn()
    }
    
    const newUsername = prompt('Enter your username: ')
    if (newUsername && newUsername.trim()) {
        client.write(`/nick ${newUsername.trim()}`)
        username = newUsername.trim()
        console.log(`Username set to: ${username}`.bold.green)
    } else {
        console.log('Username cannot be empty'.bold.red)
    }
    
    return menuReturn()
}

const listUsers = () => {
    if (!client) {
        console.log('Not connected to a server. Please connect first.'.bold.red)
        return menuReturn()
    }
    
    client.write('/list')
    return menuReturn()
}

const sendPrivateMessage = () => {
    if (!client) {
        console.log('Not connected to a server. Please connect first.'.bold.red)
        return menuReturn()
    }
    
    const userId = prompt('Enter user ID to message: ')
    if (!userId || !userId.trim()) {
        console.log('User ID cannot be empty'.bold.red)
        return menuReturn()
    }
    
    const message = prompt('Enter your message: ')
    if (!message || !message.trim()) {
        console.log('Message cannot be empty'.bold.red)
        return menuReturn()
    }
    
    client.write(`/pm ${userId} ${message}`)
    return menuReturn()
}

const menu = () => {
    console.log('=== TCP CHAT CLIENT ==='.bold.green)
    console.log(`Status: ${client ? 'CONNECTED'.bold.green : 'DISCONNECTED'.bold.red}`)
    if (username) {
        console.log(`Username: ${username}`.bold.blue)
    }
    console.log('-----------------------'.gray)
    console.log('1. Connect to server')
    console.log('2. Enter chat mode')
    console.log('3. Set username')
    console.log('4. List online users')
    console.log('5. Send private message')
    console.log('6. Disconnect')
    console.log('7. Exit program')
    console.log('-----------------------'.gray)
    
    const choice = prompt('Select option: ')
    
    switch (choice) {
        case '1':
            createClient()
            break
        case '2':
            enterChatMode()
            break
        case '3':
            setUsername()
            break
        case '4':
            listUsers()
            break
        case '5':
            sendPrivateMessage()
            break
        case '6':
            if (client) {
                client.write('/quit')
                setTimeout(() => destroyConnection(), 500)
            } else {
                console.log('Not connected to any server'.bold.yellow)
                menuReturn()
            }
            break
        case '7':
            if (client) {
                client.write('/quit')
                setTimeout(() => {
                    destroyConnection()
                    console.log('Goodbye!'.bold.yellow)
                    process.exit(0)
                }, 500)
            } else {
                console.log('Goodbye!'.bold.yellow)
                process.exit(0)
            }
            break
        default:
            console.log('Invalid option! Try again'.bold.red)
            menuReturn()
    }
}

console.log('TCP Chat Client Starting...'.bold.green)
menu()