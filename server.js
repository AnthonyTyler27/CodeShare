const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const {exec} = require('child_process');

const fs = require('fs');
const bodyParser = require('body-parser');

const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(bodyParser.json());

// This is what is called when the file is getting uploaded from user to server
app.post('/send', (req, res) => {
    //console.log("Hey there poster!" + atob(req.body.text));
    fs.writeFile("a.txt", Buffer.from(req.body.text,'base64'),  (err) => {
        if (err) {
            throw err;
        }
        console.log("Wrote file!");
    });
    res.end();
});

// loading file from server to user
app.post('/getfile', (req, res) => {
    someText = fs.readFile("a.txt",{encoding:'utf8'}, function(err,data) {
        res.send(JSON.stringify({text: data}));
    });
    
});


app.post('/execute', (req, res) => {
    const command = req.body.command;
  
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error);
        res.send(error.message);
      } else {
        console.log(`Command executed: ${command}`);
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send(stdout);
      }
    });
  });

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;



server.listen(PORT, () => console.log(`Listening on port ${PORT}`));




