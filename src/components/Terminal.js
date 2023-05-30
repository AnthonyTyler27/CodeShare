import React, { useEffect, useRef } from 'react';
import ACTIONS from '../Actions';


// components needed for the terminal
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';


const XTermTerminal = () => {
    const terminalRef = useRef(null);
    useEffect(() => {
        async function init() {
            const terminal = new Terminal();
            const fitAddon = new FitAddon();

            terminal.loadAddon(fitAddon);
            terminal.open(terminalRef.current);
            fitAddon.fit();


            terminal.writeln("This is the terminal");

            // This is what sends the command to the server
            // current implementation is very dangerous. 
            const sendCommand = (command) => {
                fetch('/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ command }),
                })
                    .then((response) => response.text())
                    .then((output) => terminal.write(output))
                    .catch((error) => console.error(error));
            };


            // Listen for key events in the terminal
            terminal.onKey((event) => {
                if (event.domEvent.key === 'Enter') {
                    console.log("Attempting to send from terminal");
                    const command = terminal.buffer.active.getLine(terminal.buffer.active.baseY).translateToString().trim();
                    terminal.writeln('');
                    sendCommand(command);
                }

                const printable = !event.domEvent.altKey && !event.domEvent.altGraphKey && !event.domEvent.ctrlKey && !event.domEvent.metaKey;

                if (event.domEvent.key === 'Enter') {
                    terminal.write('\r\n');
                } else if (event.domEvent.key === 'Backspace') {
                    // Move the cursor back by one position
                    terminal.write('\b \b');
                } else if (printable) {
                    terminal.write(event.key);
                }
            });


            return () => {
                terminal.dispose();
            }
        }

        init();
    }, []);


    return <div class="terminal" ref={terminalRef}></div>
}

export default XTermTerminal;