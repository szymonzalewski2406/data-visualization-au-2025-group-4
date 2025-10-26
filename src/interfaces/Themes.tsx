import { createTheme, ThemeOptions } from "@mui/material";

declare module '@mui/material/styles' {
    interface ThemeOptions {
        custom?: {
            appBarBackground?: string;
        };
    }
    interface Theme {
        custom: {
            appBarBackground: string;
        };
    }
}

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

export const championsLeagueTheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#001a4b',
            light: '#003c9e',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#00b4f0',
        },
        ...BASE_OPTIONS.palette,
    },
    custom: {
        appBarBackground: 'url(/theme_backgrounds/champions_league_background.jpg)',
    }
});

export const europaLeagueTheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#f26200',
            light: '#ff8a3d',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#000000',
        },
        ...BASE_OPTIONS.palette,
    },
    custom: {
        appBarBackground: 'url(/theme_backgrounds/europa_league_background.jpg)',
    }
});

export const conferenceLeagueTheme = createTheme({
    ...BASE_OPTIONS,
    palette: {
        primary: {
            main: '#00842a',
            light: '#339c55',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#000000',
        },
        ...BASE_OPTIONS.palette,
    },
    custom: {
        appBarBackground: 'url(/theme_backgrounds/conference_league_background.jpg)',
    }
});