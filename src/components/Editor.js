import React, { useEffect, useRef } from 'react';

import Codemirror from 'codemirror';


import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/neat.css';
// import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

var delay;

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'text/x-java'},
                    theme: 'neat',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on('change', (instance, changes) => {
                
                // This will update the server copy of the code 1 second after
                // the user stops typing.  Might be able to increase this. 
                clearTimeout(delay);
                delay = setTimeout(updateCodeOnServer,1000,instance.getValue());
               
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                   socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                    
                }
                
                
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
};

function updateCodeOnServer(data) {
    console.log("Sending code to server.");
    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },                 
        // convert code area text to JSON and encode in base64.
        body: JSON.stringify({text: btoa(data)})
    });
}

export default Editor;
