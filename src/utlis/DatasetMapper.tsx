import { RefereeData } from "../interfaces/RefereeData";

export const HEADER_MAPPING: { [key: string]: keyof RefereeData } = {
    'name': 'name',
    'nationality': 'nationality',
    'age': 'age',
    'yellow_cards': 'yellow_cards',
    'double_yellow_cards': 'double_yellow_cards',
    'red_cards': 'red_cards',
    'penalties': 'penalties',
    'appearances': 'appearances',
};

export const INT_FIELDS = [
    'age', 'yellow_cards', 'double_yellow_cards',
    'red_cards', 'penalties', 'appearances'
];

const formatCompetitionName = (rawString: string): string => {
    if (rawString.includes('champions_league')) return 'Champions League';
    if (rawString.includes('europa_league')) return 'Europa League';
    if (rawString.includes('conference_league')) return 'Conference League';
    return rawString.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const parseCSVData = (
    csvString: string,
    seasonName: string,
    competitionName: string
): RefereeData[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: RefereeData[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const rawRow: any = {};

        headers.forEach((csvHeader, index) => {
            const value = values[index];
            if (HEADER_MAPPING[csvHeader]) {
                const jsField = HEADER_MAPPING[csvHeader];
                if (INT_FIELDS.includes(csvHeader)) {
                    rawRow[jsField] = parseInt(value, 10) || 0;
                } else {
                    rawRow[jsField] = value;
                }
            }
        });

        const appearances = rawRow.appearances || 0;
        const gamesDivisor = appearances > 0 ? appearances : 1;

        const yellow = rawRow.yellow_cards || 0;
        const doubleYellow = rawRow.double_yellow_cards || 0;
        const red = rawRow.red_cards || 0;
        const penalties = rawRow.penalties || 0;

        const total_cards = yellow + doubleYellow + red;

        const cards_per_game = parseFloat((total_cards / gamesDivisor).toFixed(2));
        const penalties_per_game = parseFloat((penalties / gamesDivisor).toFixed(2));

        const strictness_index = parseFloat((cards_per_game + (penalties_per_game * 2)).toFixed(2));

        const refereeStat: RefereeData = {
            ...rawRow,
            competition: competitionName,
            season: seasonName,
            total_cards,
            cards_per_game,
            penalties_per_game,
            strictness_index
        };

        data.push(refereeStat);
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

export async function loadAllData(dataFolder: string): Promise<{ allData: RefereeData[], initialSeasons: string[] }> {
    let combinedData: RefereeData[] = [];
    const seasonNames = new Set<string>();

    let ALL_CSV_FILENAMES: string[];
    try {
        ALL_CSV_FILENAMES = await getCsvFilenames(dataFolder);
    } catch (error) {
        throw new Error(`Error getting CSV filenames for ${dataFolder}: ${error}`);
    }

    if (ALL_CSV_FILENAMES.length === 0) {
        console.warn(`CSV filenames not found in ${dataFolder}. Ensure files.json exists.`);
        return { allData: [], initialSeasons: [] };
    }

    const fetchPromises = ALL_CSV_FILENAMES.map(filename => {
        const path = `/datasets/${dataFolder}/${filename}`;

        return fetch(path)
            .then(response => {
                if (!response.ok) {
                    console.warn(`File ${path} not found. Skipped.`);
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
            let seasonName = getSeasonNameFromFile(filename);
            let competitionName = formatCompetitionName(filename);

            if (dataFolder.includes('combined') && filename === 'uefa_total_overview.csv') {
                seasonName = 'Overall';
                competitionName = 'All Competitions';
            } else if (!filename.includes('league') && !dataFolder.includes('combined')) {
                competitionName = formatCompetitionName(dataFolder);
            }

            const seasonData = parseCSVData(content, seasonName, competitionName);

            combinedData = [...combinedData, ...seasonData];
            seasonNames.add(seasonName);
        }
    });

    const sortedSeasons = Array.from(seasonNames).sort((a, b) => {
        if (a === 'Overall') return -1;
        if (b === 'Overall') return 1;
        return b.localeCompare(a);
    });

    return { allData: combinedData, initialSeasons: sortedSeasons };
}

export const getSeasonNameFromFile = (filename: string): string => {
    const seasonMatch = filename.match(/_(\d{4})_(\d{4})\.csv$/);
    if (seasonMatch && seasonMatch.length === 3) {
        return `${seasonMatch[1]}/${seasonMatch[2]}`;
    }

    const totalMatch = filename.match(/_total\.csv$/);
    if (totalMatch) {
        return "Overall";
    }

    const simpleSeasonMatch = filename.match(/^(\d{4})_(\d{4})\.csv$/);
    if (simpleSeasonMatch && simpleSeasonMatch.length === 3) {
        return `${simpleSeasonMatch[1]}/${simpleSeasonMatch[2]}`;
    }

    if (filename === 'uefa_total_overview.csv') {
        return 'Overall';
    }

    return filename.replace('.csv', '');
};

export const extractRefereeOptions = (data: RefereeData[]): { referees: string[] } => {
    const referees = new Set<string>();
    data.forEach(statLine => {
        referees.add(statLine.name);
    });
    return {
        referees: Array.from(referees).sort(),
    };
};

export const extractNationalityOptions = (data: RefereeData[]): { nationalities: string[] } => {
    const nations = new Set<string>();
    data.forEach(statLine => {
        if (statLine.nationality) {
            nations.add(statLine.nationality);
        }
    });
    return {
        nationalities: Array.from(nations).sort(),
    };
};