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

export const parseCSVData = (csvString: string, seasonName: string): (RefereeData & { season: string })[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: (RefereeData & { season: string })[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const refereeStat: any = { season: seasonName };

        headers.forEach((csvHeader, index) => {
            const value = values[index];

            if (HEADER_MAPPING[csvHeader]) {
                const jsField = HEADER_MAPPING[csvHeader];

                if (INT_FIELDS.includes(csvHeader)) {
                    refereeStat[jsField] = parseInt(value, 10) || 0;
                } else {
                    refereeStat[jsField] = value;
                }
            }
        });

        data.push(refereeStat as (RefereeData & { season: string }));
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

export async function loadAllData(dataFolder: string): Promise<{ allData: (RefereeData & { season: string })[], initialSeasons: string[] }> {
    let combinedData: (RefereeData & { season: string })[] = [];
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

    const sortedSeasons = Array.from(seasonNames).sort((a, b) => {
        if (a.startsWith('Total')) return -1;
        if (b.startsWith('Total')) return 1;
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
        return "Total (All Seasons)";
    }

    return filename.replace('.csv', '');
};

export const extractRefereeOptions = (data: (RefereeData & { season: string })[]): { referees: string[] } => {
    const referees = new Set<string>();

    data.forEach(statLine => {
        referees.add(statLine.name);
    });

    return {
        referees: Array.from(referees).sort(),
    };
};

