# TCP Chat Console App 💬

A lightweight TCP-based chat application built with Node.js, featuring a console-based client and server. It supports multiple users, public and private messaging, and a simple chat interface.

## 🧰 Features

- Connect/disconnect to a TCP server
- Set a username
- Enter and exit chat mode
- Broadcast messages to all users
- Private messaging using user IDs
- List online users
- Clean chat interface using `readline` and `colors`

## 📁 Project Structure

tcp-chat/
├── client.js
├── server.js
├── package.json
└── package-lock.json

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14+ recommended)

### Installation

1. Clone this repository:
   ```bash
   gh repo clone EzerAbed/TCP-Chat
   cd TCP-Chat

2. Install Dependencies
   ```bash
   npm install

3. Start the Server
   ```bash
   node server.js

4. Start a Client
   Open a new terminal for each client:
   ```bash
   node client.js

🧪 Example Usage
Once the server is running, each connected client can send messages that will be broadcast to all other connected clients.
   ```bash
   You: Hello world!
   Client 2: Hey there!
   Client 3: 👋
   ```

📚 Technologies Used
   - Node.js
   - `net` module (built-in TCP library)

📌 TODOs
   -  Add user authentication
   -  Improve private messaging
   -  Improve error handling and reconnections
   -  Create a GUI client

🧑‍💻 Author
Abed Ezer
