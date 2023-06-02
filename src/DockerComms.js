const Docker = require('dockerode');

const docker = new Docker();


async function startDockerContainer(roomid) {
    try {
        const container = await docker.createContainer({
            Image: 'virtual_machine',
            name: roomid,
            Tty: true,
            Detach: true
        });

        await container.start();



        return(container);
    } catch (err) {
        console.log("Error starting docker container:" + err);
    }
};


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
module.exports = {startDockerContainer, findContainer};
