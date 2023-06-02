import React, { useEffect, useRef } from 'react';

import Codemirror from 'codemirror';
import toast from 'react-hot-toast';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/neat.css';
// import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../server/Actions';
import POSTS from '../server/Posts';

var delay;

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'text/x-java' },
                    theme: 'neat',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    lineWrapping: true,
                    readOnly: true
                }
            );
            
            editorRef.current.setSize("100%","100%");

            // Now, we get the file from the server. 
            getFileFromServer(editorRef);

            editorRef.current.on('change', (instance, changes) => {

                // This will update the server copy of the code 1 second after
                // the user stops typing.  Might be able to increase this. 
                clearTimeout(delay);
                delay = setTimeout(updateCodeOnServer, 1000, instance.getValue());

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

/*
This function asks for the current file from the server. 
*/
async function getFileFromServer(editorRef) {
    await fetch(POSTS.GETSOURCEFILE, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            // do something with the retrieved data 
            editorRef.current.setValue(data.text);

            // now, the user can edit this
            
            editorRef.current.setOption('readOnly',false);
            

        }).catch(error => {
            console.error("Server error! Attempt to get the file failed.");
            toast.error("Temporary Server Error");
        });
}



function updateCodeOnServer(data) {
    console.log("Sending code to server.");
    fetch(POSTS.SENDSOURCEFILE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // convert code area text to JSON and encode in base64.
        body: JSON.stringify({ text: btoa(data) })
    });
}

export default Editor;
