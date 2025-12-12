import { ThemeOptions } from "@mui/material";
import uefaLogo from "../static/images/uefa_logo.png";
import championsLeagueLogo from "../static/images/champions_league_logo.png";
import europaLeagueLogo from "../static/images/europa_league_logo.png";
import conferenceLeagueLogo from "../static/images/conference_league_logo.png";
import {
    championsLeagueTheme,
    europaLeagueTheme,
    conferenceLeagueTheme, allCompetitionsTheme
} from "./Themes";

export interface CompetitionConfig {
    id: number;
    name: string;
    logoPath: string;
    dataFolder: string;
    theme: ThemeOptions;
}

export const COMPETITIONS: CompetitionConfig[] = [
    {
        id: 0,
        name: 'UEFA Competions Referee Analysis Tool',
        logoPath: uefaLogo,
        dataFolder: 'uefa_combined',
        theme: allCompetitionsTheme,
    },
    {
        id: 1,
        name: 'Champions League',
        logoPath: championsLeagueLogo,
        dataFolder: 'champions_league',
        theme: championsLeagueTheme,
    },
    {
        id: 2,
        name: 'Europa League',
        logoPath: europaLeagueLogo,
        dataFolder: 'europa_league',
        theme: europaLeagueTheme,
    },
    {
        id: 3,
        name: 'Conference League',
        logoPath: conferenceLeagueLogo,
        dataFolder: 'conference_league',
        theme: conferenceLeagueTheme,
    },
];
export const DEFAULT_COMPETITION = COMPETITIONS[0];
