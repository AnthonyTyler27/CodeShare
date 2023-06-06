const Docker = require('dockerode');
const pty = require('node-pty');

const docker = new Docker();
/* stops and deletes all running Docker containers
*/

async function stopAndDeleteAllContainers() {
  try {
    // Fetch list of all containers
    const containers = await docker.listContainers({ all: true });

    // Stop and remove each container
    await Promise.all(
      containers.map(async (container) => {
        const containerInstance = docker.getContainer(container.Id);
        await containerInstance.stop();
        await containerInstance.remove({ force: true });
      })
    );

    console.log('All containers stopped and removed successfully.');
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

/*
starts up docker container 
*/
async function startDockerContainer(roomid) {
  try {
    const container = await docker.createContainer({
      Image: 'virtual_machine',
      name: roomid,
      Tty: true,
      Detach: true
    });

    await container.start();
    const shell = await setupStreams(roomid);

    return (shell);
  } catch (err) {
    console.log("Error starting docker container:" + err);
  }
};

/*
setups up streams on docker container
*/
async function setupStreams(roomid) {
  const shell = pty.spawn('docker', ['exec', '-it', roomid, 'bash'], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  return(shell);

}


/*
This function return true or false depending on if container with name id is found
*/
function findContainer(id) {
  console.log("looking for containers");

  return new Promise((resolve, reject) => {
    docker.listContainers({ all: true }, (err, containers) => {
      if (err) {
        console.error("Error when trying to get running docker containers: " + err);
        reject(err);
        return;
      }

      const foundContainer = containers.find(containerInfo => {
        return containerInfo.Names[0].toString() === ("/" + id);
      });

      resolve(!!foundContainer);
    });
  });
}
module.exports = { startDockerContainer, findContainer, stopAndDeleteAllContainers};
