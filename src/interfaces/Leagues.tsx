import {ThemeOptions} from "@mui/material";

import premierLeagueLogo from "../static/images/premier_league_logo.png";
import bundesligaLogo from "../static/images/bundesliga_logo.png";
import laLigaLogo from "../static/images/la_liga_logo.png";
import serieALogo from "../static/images/serie_a_logo.png";
import Ligue1Logo from "../static/images/ligue_1_logo.png";
import {bundesligaTheme, laLigaTheme, ligue1Theme, premierLeagueTheme, serieATheme} from "../constants/Themes";

export interface LeagueConfig {
    id: number;
    name: string;
    logoPath: string;
    dataFolder: string;
    theme: ThemeOptions;
}

export const LEAGUES: LeagueConfig[] = [
    {
        id: 0,
        name: 'Premier League',
        logoPath: premierLeagueLogo,
        dataFolder: 'premier-league',
        theme: premierLeagueTheme,
    },
    {
        id: 1,
        name: 'Bundesliga',
        logoPath: bundesligaLogo,
        dataFolder: 'bundesliga',
        theme: bundesligaTheme,
    },
    {
        id: 2,
        name: 'La Liga',
        logoPath: laLigaLogo,
        dataFolder: 'la-liga',
        theme: laLigaTheme,
    },
    {
        id: 3,
        name: 'Serie A',
        logoPath: serieALogo,
        dataFolder: 'serie-a',
        theme: serieATheme,
    },
    {
        id: 4,
        name: 'Ligue 1',
        logoPath: Ligue1Logo,
        dataFolder: 'ligue-1',
        theme: ligue1Theme,
    },
];

export const DEFAULT_LEAGUE = LEAGUES[0];