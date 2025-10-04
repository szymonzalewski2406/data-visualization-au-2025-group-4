import React from 'react';
import {Navigate, Route, Routes} from "react-router-dom";
import {Box} from "@mui/material";
import Dashboard from "./pages/Dashboard";

function App() {
    return (
        <Box sx={{width: "100%"}}>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                <Route path="/dashboard" element={<Dashboard/>}/>
            </Routes>
        </Box>
    );
}

export default App;