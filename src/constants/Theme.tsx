import {createTheme} from "@mui/material";

export const Theme = createTheme({
    palette: {
        primary: {
            main: '#3D195B',
            light: '#7851A9',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#7851A9',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
    }
});