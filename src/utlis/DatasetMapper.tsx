import {MatchData} from "../interfaces/MatchData";

export const HEADER_MAPPING: { [key: string]: keyof Omit<MatchData, 'season' | 'date'> } = {
    'HomeTeam': 'homeTeam',
    'AwayTeam': 'awayTeam',
    'FTHG': 'fullTimeHomeGoals',
    'FTAG': 'fullTimeAwayGoals',
    'FTR': 'fullTimeResult',
    'HTHG': 'halfTimeHomeGoals',
    'HTAG': 'halfTimeAwayGoals',
    'HTR': 'halfTimeResult',
    'Referee': 'referee',
    'HS': 'homeShots',
    'AS': 'awayShots',
    'HST': 'homeShotsOnTarget',
    'AST': 'awayShotsOnTarget',
    'HF': 'homeFouls',
    'AF': 'awayFouls',
    'HC': 'homeCorners',
    'AC': 'awayCorners',
    'HY': 'homeYellowCards',
    'AY': 'awayYellowCards',
    'HR': 'homeRedCards',
    'AR': 'awayRedCards',
};

export const INT_FIELDS = [
    'FTHG', 'FTAG', 'HTHG', 'HTAG', 'HS', 'AS', 'HST', 'AST',
    'HF', 'AF', 'HC', 'AC', 'HY', 'AY', 'HR', 'AR'
];

export const parseCSVData = (csvString: string, seasonName: string): MatchData[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const data: MatchData[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue;

        const match: any = { season: seasonName };

        headers.forEach((csvHeader, index) => {
            const value = values[index].trim();

            if (csvHeader === 'Date') {
                const parts = value.split('/');
                if (parts.length === 3) {
                    const year = 2000 + parseInt(parts[2], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[0], 10);
                    match.date = new Date(year, month, day);
                }
            } else if (HEADER_MAPPING[csvHeader]) {
                const jsField = HEADER_MAPPING[csvHeader];

                if (INT_FIELDS.includes(csvHeader)) {
                    match[jsField] = parseInt(value, 10) || 0;
                } else {
                    match[jsField] = value;
                }
            }
        });

        data.push(match as MatchData);
    }
    return data;
};

async function getCsvFilenames(dataFolder: string): Promise<string[]> {
    try {
        const res = await fetch(`/datasets/${dataFolder}/files.json`);
        if (!res.ok) return [];
        const files: string[] = await res.json();
        return files.filter(f => f.endsWith('.csv'));
    } catch (error) {
        console.error('Error fetching CSV list:', error);
        return [];
    }
}


export async function loadAllData(dataFolder: string): Promise<{ allData: MatchData[], initialSeasons: string[] }> {
    let combinedData: MatchData[] = [];
    const seasonNames = new Set<string>();

    let ALL_CSV_FILENAMES: string[];
    try {
        ALL_CSV_FILENAMES = await getCsvFilenames(dataFolder);
    } catch (error) {
        throw new Error(`Error getting CSV filenames for ${dataFolder}: ${error}`);
    }


    if (ALL_CSV_FILENAMES.length === 0) {
        throw new Error(`CSV filenames not found in ${dataFolder}`);
    }

    const fetchPromises = ALL_CSV_FILENAMES.map(filename => {
        const path = `/datasets/${dataFolder}/${filename}`;

        return fetch(path)
            .then(response => {
                if (!response.ok) {
                    console.warn(`File ${path} not found for ${dataFolder}. State: ${response.status}. Skipped.`);
                    return null;
                }
                return response.text();
            })
            .catch(error => {
                console.error(`Error while loading the file ${path}:`, error);
                return null;
            });
    });

    const csvContents = await Promise.all(fetchPromises);
    csvContents.forEach((content, index) => {
        const filename = ALL_CSV_FILENAMES[index];

        if (content) {
            const seasonName = getSeasonNameFromFile(filename);
            const seasonData = parseCSVData(content, seasonName);

            combinedData = [...combinedData, ...seasonData];
            seasonNames.add(seasonName);
        }
    });

    const sortedSeasons = Array.from(seasonNames).sort().reverse();

    return { allData: combinedData, initialSeasons: sortedSeasons };
}

export const getSeasonNameFromFile = (filename: string): string => {
    const match = filename.match(/season-(\d{2})(\d{2})\.csv/);

    if (match && match.length === 3) {
        const startYearTwoDigit = parseInt(match[1], 10);
        let fourDigitStartYear: number;

        if (startYearTwoDigit >= 93) {
            fourDigitStartYear = 1900 + startYearTwoDigit;
        } else {
            fourDigitStartYear = 2000 + startYearTwoDigit;
        }

        const fourDigitEndYear = fourDigitStartYear + 1;
        return `${fourDigitStartYear}/${fourDigitEndYear}`;
    }
    return filename.replace('.csv', '');
};

export const extractSeasonalOptions = (data: MatchData[]): { teams: string[], referees: string[] } => {
    const teams = new Set<string>();
    const referees = new Set<string>();

    data.forEach(match => {
        teams.add(match.homeTeam);
        teams.add(match.awayTeam);
        referees.add(match.referee);
    });

    return {
        teams: Array.from(teams).sort(),
        referees: Array.from(referees).sort(),
    };
};