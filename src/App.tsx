import React from 'react';
import {Navigate, Route, Routes} from "react-router-dom";
import {Box, createTheme, ThemeProvider} from "@mui/material";
import Dashboard from "./pages/Dashboard";


const theme = createTheme({
    palette: {
        primary: {
            main: '#ffffff',
            light: '#7851A9',
            dark: '#3D195B',
        },
    },
})

function App() {
    return (
        <ThemeProvider theme={theme}>
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