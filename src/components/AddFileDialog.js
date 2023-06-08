import Swal from 'sweetalert2';
import POSTS from '../server/Posts';

const addFile = () => {
    console.log("adding file");
    Swal.fire({
        title: 'Enter a filename',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm:true,
        preConfirm: (filename) => {
            return fetch(POSTS.REQUESTNEWFILE, 
                { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({filename: btoa(filename)})
                })
            .then(response => {
                if(!response.ok) {
                    throw new Error(response.statusText);
                }
                return(response.json())
            }).catch(error => {
                Swal.showValidationMessage(`Request failed: ${error}`)
            })
            
        },
        allowOutsideClick: () => !Swal.isLoading()})
        .then((result)=> {
            if(result.isConfirmed) {
                // Handle the filename input here
                console.log('Filename:', result);
                // Perform your desired action with the filename
            }
        })
};

export default addFile;
