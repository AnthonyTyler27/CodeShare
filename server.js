const express = require('express');
const app = express();
const http = require('http');
const path = require('path');

const fs = require('fs');
const bodyParser = require('body-parser');


const { Server } = require('socket.io');
const ACTIONS = require('./src/server/Actions');
const POSTS = require('./src/server/Posts');

const { startDockerContainer, findContainer } = require('./src/server/DockerComms');

const server = http.createServer(app);
const io = new Server(server);

const allTerminals = {};


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

  const roomName = Buffer.from(req.body.roomId, 'base64').toString();
  findContainer(roomName).then(found => {
    if (!found) {
      startDockerContainer(roomName).then((shell) => {
        // this part sets it up so all connected sockets in this room
        // will get the shell terminal's data.
        shell.onData((data) => {
          const clients = getAllConnectedClients(roomName);
          clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.OUTPUT, data.toString());
          });
        });
        allTerminals[roomName] = shell;   // save a reference to this shell
      });
      
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

  socket.on(ACTIONS.INPUT, ({roomId, data}) => {
    const shell = allTerminals[roomId];
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


