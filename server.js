const express = require('express');
const app = express();
const http = require('http');
const path = require('path');

const pty = require('node-pty');       // using this for the terminal



const fs = require('fs');
const bodyParser = require('body-parser');

const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const POSTS = require('./src/Posts');

const { startDockerContainer, findContainer } = require('./src/DockerComms');

const server = http.createServer(app);
const io = new Server(server);


app.use(express.static('build'));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(bodyParser.json());

// This is what is called when the file is getting uploaded from user to server
app.post(POSTS.SENDSOURCEFILE, (req, res) => {
  //console.log("Hey there poster!" + atob(req.body.text));
  fs.writeFile("a.txt", Buffer.from(req.body.text, 'base64'), (err) => {
    if (err) {
      throw err;
    }
    console.log("Wrote file!");
  });
  res.end();
});

app.post(POSTS.STARTDOCKER, (req, res) => {

  const roomName = Buffer.from(req.body.roomId,'base64').toString();
  findContainer(roomName).then(found => {
    if(!found) {
      startDockerContainer(roomName);
    } else {
      console.log("Container is found, so not starting again.");
    }
  });
  res.end();
});



// loading file from server to user
app.post(POSTS.GETSOURCEFILE, (req, res) => {
  someText = fs.readFile("a.txt", { encoding: 'utf8' }, function (err, data) {
    res.send(JSON.stringify({ text: data }));
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

  const shell = pty.spawn('docker', ['exec', '-it', '32e6a70d9d2ea62cde022bdcd6ff13f6c718d7212a62d313e5502a6bbf1ceec1', 'bash'], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  shell.onData((data) => {
    socket.emit(ACTIONS.OUTPUT, data.toString());
  });

  socket.on(ACTIONS.INPUT, (data) => {
    shell.write(data);
  });

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




