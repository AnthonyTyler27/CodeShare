import React, { useEffect, useRef } from 'react';
import ACTIONS from '../Actions';
import POSTS from '../Posts';


// components needed for the terminal
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';


const XTermTerminal = ({ roomId, socketRef }) => {
    const terminalRef = useRef(null);
    useEffect(() => {
        async function init() {
            const terminal = new Terminal({
                cursorBlink: true
            });
            const fitAddon = new FitAddon();

            terminal.loadAddon(fitAddon);
            terminal.open(terminalRef.current);
            terminalRef.current = terminal;

            fitAddon.fit();

            createDockerContainerOnServer(roomId);

            
            terminal.onData((data) =>  {
                socketRef.current.emit(ACTIONS.INPUT, data);
            });

            return () => {
                terminal.dispose();
            }
        }

        init();
    }, []);

    // GETS DATA FROM SERVER
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.OUTPUT, (stdout) => {
                    console.log("Got data");
                    console.log(stdout);
                    terminalRef.current.write(stdout);
                });
        }

        return () => {
            socketRef.current.off(ACTIONS.OUTPUT);
        };
    }, [socketRef.current]);


    return <div class="terminal" ref={terminalRef}></div>
}

async function createDockerContainerOnServer(roomId) {
   await fetch(POSTS.STARTDOCKER, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({roomId: btoa(roomId)})
        });
}

export default XTermTerminal;