// src/utils/RefereeMetrics.tsx
import { RefereeData } from '../interfaces/RefereeData';

const WEIGHTS = {
    yellow: 1.0,
    doubleYellow: 3.0,
    red: 5.0,
    penalty: 3.0,
};

export const processRefereeRow = (
    row: any, 
    defaultSeason: string, 
    defaultCompetition: string
): RefereeData | null => {
    const appearances = Number(row.appearances);
    
    // Filter out invalid rows or zero-game refs
    if (!appearances || appearances === 0 || isNaN(appearances)) return null;

    // Handle 'league' column from combined CSV vs 'competition' column
    const competition = row.league || row.competition || defaultCompetition;

    // Handle missing season (combined CSV has no season column)
    const season = row.season || defaultSeason;

    const yellow = Number(row.yellow_cards || 0);
    const doubleYellow = Number(row.double_yellow_cards || 0);
    const red = Number(row.red_cards || 0);
    const penalties = Number(row.penalties || 0);
    const age = Number(row.age || 0);

    const weightedScore = 
        (yellow * WEIGHTS.yellow) + 
        (doubleYellow * WEIGHTS.doubleYellow) + 
        (red * WEIGHTS.red) + 
        (penalties * WEIGHTS.penalty);

    return {
        name: row.name,
        nationality: row.nationality,
        age,
        yellow_cards: yellow,
        double_yellow_cards: doubleYellow,
        red_cards: red,
        penalties: penalties,
        appearances,
        competition,
        season,
        
        total_cards: yellow + doubleYellow + red,
        cards_per_game: Number(((yellow + red) / appearances).toFixed(2)),
        penalties_per_game: Number((penalties / appearances).toFixed(2)),
        strictness_index: Number((weightedScore / appearances).toFixed(2))
    };
};