import React from 'react';
import {Navigate, Route, Routes} from "react-router-dom";
import {Box, ThemeProvider} from "@mui/material";
import Dashboard from "./pages/Dashboard";
import {Theme} from "./constants/Theme";

function App() {
    return (
        <ThemeProvider theme={Theme}>
            <Box sx={{width: "100%"}}>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </Box>
        </ThemeProvider>
    );
}

export default App;