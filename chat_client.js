const colors = require('colors')
const net = require('net')
const prompt = require('prompt-sync')({ sigint: true })

let client = null 
let username = null

const menuReturn = () => {
    return setTimeout(() => menu(), 500)
}

const destroyConnection = () => {
    if(client){
        client.destroy()
        client = null
        console.log('Disconnected from server'.bold.yellow)
    }

    return menuReturn()
}

const createClient = () => {
    if(!client){
        const ADDRESS = prompt('Type server address: ') || '127.0.0.1'
        const PORT = prompt('Type server port: ') || 8000

        client = new net.Socket()

        client.connect(PORT, ADDRESS, () => {
            console.log(`Connected to chat server at ${ADDRESS}:${PORT}`.bold.green)
            console.log('Waiting for server welcome message...'.italic.gray)
        })

        client.on('data', (data) => {
            console.log(`${data.toString()}`.cyan)
        })

        client.on('close', () => {
            console.log('Connection closed by server'.bold.yellow)
            client = null
            menuReturn()
        })

        client.on('error', (err) => {
            console.log(`Error: ${err.message}`.bold.red)
            destroyConnection()
        })

        menuReturn()
    } else {
        console.log('Already connected to a server. Disconnect first to connect to another server '.bold.red)
        menuReturn()
    }
}

const enterChatMode = () => {
    if(!client){
        console.log('Not connected to a server. Please connect first'.bold.red)
        return menuReturn()
    }

    console.log('\n--- CHAT MODE ---'.bold.green)
    console.log('Type messages to send to all users')
    console.log('Commands: /nick, /list, /pm, /quit, /exit (return to menu)'.italic.gray)
    console.log('------------------------\n'.bold.green)

    const chatLoop = () => {
        const message = prompt('> ')

        if (message.trim() === '/exit') {
            console.log('Exiting chat mode'.bold.yellow)
            return menuReturn()
        }

        if (client) {
            client.write(message)
            setTimeout(chatLoop, 100)
        } else {
            console.log('Connection lost'.bold.red)
            return menuReturn()
        }
    }

    chatLoop()
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

    menuReturn()
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
            destroyConnection()
            break
        case '7':
            if (client) {
                client.write('/quit')
                destroyConnection()
            }
            console.log('Goodbye!'.bold.yellow)
            process.exit(0)
            break

        default:
            console.log('Invalid option! Try again'.bold.red)
            menuReturn()
            break
    }
}

console.log('TCP Chat Client Starting...'.bold.green)
menu()