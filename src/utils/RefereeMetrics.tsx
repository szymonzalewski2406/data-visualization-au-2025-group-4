import { RefereeData } from '../interfaces/RefereeData';

export interface StrictnessWeights {
    yellow: number;
    doubleYellow: number;
    red: number;
    penalty: number;
}

export const DEFAULT_WEIGHTS: StrictnessWeights = {
    yellow: 1.0,
    doubleYellow: 3.0,
    red: 5.0,
    penalty: 3.0,
};

export const calculateStrictnessScore = (
    yellow: number,
    doubleYellow: number,
    red: number,
    penalties: number,
    appearances: number,
    weights: StrictnessWeights
): number => {
    if (!appearances || appearances === 0) return 0;

    const weightedScore =
        (yellow * weights.yellow) +
        (doubleYellow * weights.doubleYellow) +
        (red * weights.red) +
        (penalties * weights.penalty);

    return Number((weightedScore / appearances).toFixed(2));
};

export const processRefereeRow = (
    row: any,
    defaultSeason: string,
    defaultCompetition: string
): RefereeData | null => {
    const appearances = Number(row.appearances);

    if (!appearances || appearances === 0 || isNaN(appearances)) return null;

    const competition = row.league || row.competition || defaultCompetition;
    const season = row.season || defaultSeason;

    const yellow = Number(row.yellow_cards || 0);
    const doubleYellow = Number(row.double_yellow_cards || 0);
    const red = Number(row.red_cards || 0);
    const penalties = Number(row.penalties || 0);
    const age = Number(row.age || 0);

    const strictness_index = calculateStrictnessScore(
        yellow, doubleYellow, red, penalties, appearances, DEFAULT_WEIGHTS
    );

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
        strictness_index
    };
};