import React from 'react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import Papa from 'papaparse';



function App() {
    // onchange states
    const [excelFile, setExcelFile] = useState(null);
    const [typeError, setTypeError] = useState(null);

    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);

    // submit state
    const [excelData, setExceldata] = useState(null);


    // make phone call
    const makePhoneCall = (email, phone, full_name) => {
        // express
        axios.post('http://localhost:5000/call', { name: full_name, phone: phone, email: email })
            .then((res) => {
                console.log(res.data)
            }).catch((error) => {
                console.log(error)
            });
    }


    // submit action
    const handleSubmit = (e) => {
        e.preventDefault();
        if (excelFile != null) {
            const workbook = XLSX.read(excelFile, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);
            setExceldata(data); // display data

            data.forEach((element) => {
                var arr = Object.entries(element);
                let email = arr[1][1];
                let phone = arr[9][1];
                let full_name = arr[4][1] + ' ' + arr[5][1];
                makePhoneCall(email, phone, full_name); // make phone call
            });
        }
    }


    // onchange event
    const handleFile = (e) => {
        let selectedFile = e.target.files[0];
        let fileType = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        if (selectedFile) {
            if (selectedFile.type) {
                if (fileType.includes(selectedFile.type)) {
                    setExcelFile(selectedFile);
                    setTypeError(null);

                    let reader = new FileReader();
                    reader.readAsArrayBuffer(selectedFile);
                    reader.onload = (e) => {
                        setExcelFile(e.target.result);
                    }
                } else {
                    setExcelFile(null);
                    setTypeError('Please select valid excel sheet');
                }
            }
        } else {
            console.log("Please select your file");
        }
    }




    return (
        <div className="App">
            <div className='container'>
                <div className='card'>
                    <div className='card-header'>
                        <h3>Upload & View Excel Sheets</h3>
                    </div>
                    <div className='card-body'>
                        <div className='row'>
                            <div className='col-sm-12 col-md-12 col-lg-12'>
                                {/* form */}
                                <form className='form-group custom-form form-inline' onSubmit={handleSubmit} encType="multipart/form-data">
                                    <div className='col-sm-12 col-md-10 col-lg-10'>
                                        <label htmlFor='file'>Upload Excel Sheet</label>
                                        <input type="file" id='file' className="form-control" required onChange={handleFile} />
                                    </div>
                                    <div className='col-sm-12 col-md-2 col-lg-2'>
                                        <button type="submit" className="btn btn-success btn-md">Submit</button>
                                    </div>
                                    {
                                        /* error */
                                        typeError && (
                                            <div className='alert alert-danger' role='alert'>{typeError}</div>
                                        )
                                    }
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className='card-body'>
                        {/* view data  */}
                        <div className='view-data'>
                            <h3>View Data</h3>
                            {excelData ? (
                                <div className='table-responsive'>
                                    <h3>Excel Sheet Data</h3>
                                    <table className='table table-bordered'>
                                        <thead>
                                            <tr>
                                                {
                                                    Object.keys(excelData[0]).map((key) => (
                                                        <th key={key}>{key} </th>
                                                    ))
                                                }
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {excelData.map((individualExcelData, index) => (
                                                <tr key={index}>
                                                    {
                                                        Object.keys(individualExcelData).map((key) => (
                                                            <td key={key}> {key}   {individualExcelData[key]}</td>
                                                        ))
                                                    }
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <h2>No data found</h2>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default App;
