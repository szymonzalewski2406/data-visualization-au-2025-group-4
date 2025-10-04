export interface MatchData {
    season: string;
    date: Date;
    homeTeam: string;
    awayTeam: string;
    referee: string;
    fullTimeHomeGoals: number;
    fullTimeAwayGoals: number;
    fullTimeResult: string;
    halfTimeHomeGoals: number;
    halfTimeAwayGoals: number;
    halfTimeResult: string;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeFouls: number;
    awayFouls: number;
    homeCorners: number;
    awayCorners: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
}