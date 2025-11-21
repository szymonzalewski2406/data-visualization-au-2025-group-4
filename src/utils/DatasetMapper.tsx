// src/utils/DatasetMapper.tsx
import { RefereeData } from "../interfaces/RefereeData";
import { processRefereeRow } from "./RefereeMetrics"; // Import your utility

export const HEADER_MAPPING: { [key: string]: string } = {
    'name': 'name',
    'nationality': 'nationality',
    'age': 'age',
    'yellow_cards': 'yellow_cards',
    'double_yellow_cards': 'double_yellow_cards',
    'red_cards': 'red_cards',
    'penalties': 'penalties',
    'appearances': 'appearances',
    'league': 'league',         // Mapping for combined file
    'competition': 'competition'
};

const formatCompetitionName = (rawString: string): string => {
    if (rawString.includes('champions_league')) return 'Champions League';
    if (rawString.includes('europa_league')) return 'Europa League';
    if (rawString.includes('conference_league')) return 'Conference League';
    return rawString.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// --- SIMPLIFIED PARSER USING YOUR UTILITY ---
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

        // Create raw object
        const rawRow: any = {};
        headers.forEach((header, index) => {
            const mappedField = HEADER_MAPPING[header];
            if (mappedField) {
                rawRow[mappedField] = values[index];
            }
        });

        // Delegate logic to RefereeMetrics
        const processedRef = processRefereeRow(rawRow, seasonName, competitionName);

        if (processedRef) {
            data.push(processedRef);
        }
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
        return fetch(path).then(res => res.ok ? res.text() : null).catch(() => null);
    });

    const csvContents = await Promise.all(fetchPromises);

    csvContents.forEach((content, index) => {
        const filename = ALL_CSV_FILENAMES[index];

        if (content) {
            let seasonName = getSeasonNameFromFile(filename);
            let competitionName = formatCompetitionName(filename);

            // Fix: Correctly identify your combined file
            if (filename.includes('combined') || filename === 'uefa_total_overview.csv') {
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
    // 1. Try YYYY_YYYY format
    const seasonMatch = filename.match(/_(\d{4})_(\d{4})\.csv$/);
    if (seasonMatch) return `${seasonMatch[1]}/${seasonMatch[2]}`;

    // 2. Handle Combined Files
    if (filename.includes('combined') || filename.includes('total')) return "Overall";

    // 3. Fallback
    return filename.replace('.csv', '');
};

// Keep your existing extractor functions below...
export const extractRefereeOptions = (data: RefereeData[]): { referees: string[] } => {
    const referees = new Set<string>();
    data.forEach(statLine => referees.add(statLine.name));
    return { referees: Array.from(referees).sort() };
};

export const extractNationalityOptions = (data: RefereeData[]): { nationalities: string[] } => {
    const nations = new Set<string>();
    data.forEach(statLine => { if (statLine.nationality) nations.add(statLine.nationality); });
    return { nationalities: Array.from(nations).sort() };
};