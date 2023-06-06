
// Editor Page
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../server/Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import FileSystemNavigator from '../components/FileBrowser'
import XTermTerminal from '../components/Terminal'
import { Tabs, Tab, Box } from '@mui/material';


import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';



const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);

    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);



    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };




        init();

        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);

        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">

            <div className="editorWrap">
                <div>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={value} onChange={handleChange}>
                            <Tab label="Tab 1" />
                            <Tab label="Tab 2" />
                            <Tab label="Tab 3" />
                        </Tabs>
                        {value === 0 && <div>
                            <Editor
                                socketRef={socketRef}
                                roomId={roomId}
                                onCodeChange={(code) => {
                                    codeRef.current = code;
                                }}
                            /></div>}
                        {value === 1 && <div>Content for Tab 2</div>}
                        {value === 2 && <div>Content for Tab 3</div>}
                    </Box>
                </div>


                <XTermTerminal
                    roomId={roomId}
                    socketRef={socketRef} />

            </div>
            <div className="aside">
                <div className="asideInner">
                    <FileSystemNavigator/>
                </div>
            </div>

        </div>
    );
};

export default EditorPage;

/*
 <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <h1>CodeVilla
                        </h1>
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            */