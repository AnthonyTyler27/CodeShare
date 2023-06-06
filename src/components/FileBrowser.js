import React, { useEffect, useState } from 'react';
import TreeView from '@mui/lab/TreeView';
import { ButtonGroup, IconButton, Typography, Box } from '@mui/material';
import { Folder, FolderOpen, Add, CreateNewFolder, Upload } from '@mui/icons-material';
import POSTS from '../server/Posts'
import { createTheme, ThemeProvider } from '@mui/material/styles';

import TreeItem from '@mui/lab/TreeItem';



// Create a light theme specifically for the TreeView component
const treeViewTheme = createTheme({
  palette: {
    type: 'light',
  },
  typography: {
    fontFamily: 'Roboto Mono, monospace',
  }
});

const styles = {
  grayBox: {

    borderRadius: "20px",
    border: 1,
    borderColor: "divider",
    backgroundColor: "lightgray",
    boxShadow: "4px 4px 0px 0px lightgray",
    height: "100%"
  },
  topBox:
  {

    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid gray",
    borderRadius: "0px"
  },
  headerTextStyle:
  {

    paddingLeft: "10px",
    marginRight: "auto",
    fontFamily: "Roboto Mono, monospace"

  }
};

export default function FileSystemNavigator() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getFileFromServer();
  }, []);

  const getFileFromServer = async () => {
    try {
      const response = await fetch(POSTS.GETDIRECTORYSTRUCTURE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      }});
      const xdata = await response.json();
      console.log("Received directory");
      console.log(xdata);
      setData(xdata);
    } catch (error) {
      console.error(error);
    }
  };

  const sanitizeId = (id) => {
    return id.replace(/[^\w]/g, '_'); // Replace invalid characters with underscores
  };
  
  const renderTree = (nodes) => (
    nodes==null ? (
    <TreeItem key={sanitizeId(nodes.id)} nodeId={sanitizeId(nodes.id)} label={nodes.name}>
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>) : 
  );


  return (
    <ThemeProvider theme={treeViewTheme}>
      <Box style={styles.grayBox}>
        <ButtonGroup style={styles.topBox} variant="outlined">
          <Typography variant="h5" style={styles.headerTextStyle}>
            Files
          </Typography>
          <div>
            <IconButton>
              <Add />
            </IconButton>
            <IconButton>
              <CreateNewFolder />
            </IconButton>
            <IconButton>
              <Upload />
            </IconButton>
          </div>
        </ButtonGroup>
        <TreeView
          aria-label="rich object"
          defaultCollapseIcon={<FolderOpen />}
          defaultExpanded={['root']}
          defaultExpandIcon={<Folder />}
          sx={{ height: '100%', width: 1, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {data!=null ? renderTree(data) : <div>No files available</div>}
        </TreeView>
      </Box>
    </ThemeProvider>
  );
}