import { ThemeOptions } from "@mui/material";
import championsLeagueLogo from "../static/images/champions_league_logo.png";
import europaLeagueLogo from "../static/images/europa_league_logo.png";
import conferenceLeagueLogo from "../static/images/conference_league_logo.png";
import {
    championsLeagueTheme,
    europaLeagueTheme,
    conferenceLeagueTheme
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
        name: 'Champions League',
        logoPath: championsLeagueLogo,
        dataFolder: 'champions_league',
        theme: championsLeagueTheme,
    },
    {
        id: 1,
        name: 'Europa League',
        logoPath: europaLeagueLogo,
        dataFolder: 'europa_league',
        theme: europaLeagueTheme,
    },
    {
        id: 2,
        name: 'Conference League',
        logoPath: conferenceLeagueLogo,
        dataFolder: 'conference_league',
        theme: conferenceLeagueTheme,
    },
];
export const DEFAULT_COMPETITION = COMPETITIONS[0];
