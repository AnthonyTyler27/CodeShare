import React, { useEffect, useRef } from 'react';
import ACTIONS from '../Actions';


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

            

            terminal.onKey((e) => {
                console.log(e.key);
                if(e.domEvent.key==="Enter"){
                    socketRef.current.emit(ACTIONS.COMMAND,'');
                }
                socketRef.current.emit(ACTIONS.INPUT, e.key);
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

export default XTermTerminal;