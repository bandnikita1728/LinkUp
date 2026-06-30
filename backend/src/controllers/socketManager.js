import { Server } from "socket.io"

let connections = {}
let messages = {}
let timeOnline = {}
let usernames = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path, username) => {
            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)
            timeOnline[socket.id] = new Date();
            // Store username BEFORE emitting so every receiver gets the complete map
            usernames[socket.id] = username || "Guest"

            const usernamesCopy = { ...usernames }  // snapshot so receivers all see same data
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path], usernamesCopy)
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    )
                }
            }
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }
                messages[matchingRoom].push({
                    'sender': sender,
                    "data": data,
                    "socket-id-sender": socket.id
                })
                console.log("message", matchingRoom, ":", sender, data)
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })

        socket.on("speaking", (isSpeaking) => {
            const room = Object.entries(connections).find(([, v]) => v.includes(socket.id))?.[0]
            if (room) {
                connections[room].forEach(id => {
                    if (id !== socket.id) io.to(id).emit("speaking", socket.id, isSpeaking)
                })
            }
        })

        socket.on("reaction", (emoji, effect) => {
            const room = Object.entries(connections).find(([, v]) => v.includes(socket.id))?.[0]
            if (room) {
                connections[room].forEach(id => {
                    if (id !== socket.id) io.to(id).emit("reaction", emoji, effect)
                })
            }
        })

        socket.on("caption", (text) => {
            console.log('[BACKEND] Caption relay:', String(text).substring(0, 30))
            const room = Object.entries(connections).find(([, v]) => v.includes(socket.id))?.[0]
            if (room) {
                connections[room].forEach(id => {
                    if (id !== socket.id) {
                        console.log('[BACKEND] Relaying to:', id)
                        io.to(id).emit("caption", text, socket.id)
                    }
                })
            }
        })

