import {createTheme, ThemeOptions} from "@mui/material";

const BASE_OPTIONS: ThemeOptions = {
    typography: {
        fontFamily: '"Inter", sans-serif',
    },
    palette: {
        background: {
            default: '#f5f5f5',
        },
    }
};

export const premierLeagueTheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#3D195B',
            light: '#7851A9',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#7851A9',
        },
        ...BASE_OPTIONS.palette,
    },
});

export const bundesligaTheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#D4002D',
            light: '#980427',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#FFCC00',
        },
        ...BASE_OPTIONS.palette,
    },
});


export const serieATheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#008348',
            light: '#3C9C69',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#0092BF',
        },
        ...BASE_OPTIONS.palette,
    },
});

export const ligue1Theme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#091530',
            light: '#3d4969',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#FF0000',
        },
        ...BASE_OPTIONS.palette,
    },
});

export const laLigaTheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#F44336',
            light: '#f1968e',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#002D62',
        },
        ...BASE_OPTIONS.palette,
    },
});