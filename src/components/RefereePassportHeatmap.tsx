import React, { useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
    data: RefereeData[];
}

const PREFERRED_ORDER = ["Champions League", "Europa League", "Conference League"];

const NORMALIZE_NAMES: Record<string, string> = {
    "Champions": "Champions League",
    "Europa": "Europa League",
    "Conference": "Conference League",
    "Champions League": "Champions League",
    "Europa League": "Europa League",
    "Conference League": "Conference League"
};

const RefereePassportHeatmap: React.FC<Props> = ({ data }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { seasons, displayedCompetitions, gridData } = useMemo(() => {
        let uniqueSeasons = Array.from(new Set(data.map(d => d.season))).sort();
        if (uniqueSeasons.length > 1 && uniqueSeasons.includes('Overall')) {
            uniqueSeasons = uniqueSeasons.filter(s => s !== 'Overall');
        }

        const lookup: Record<string, Record<string, number>> = {};
        const presentCompetitions = new Set<string>();

        data.forEach(d => {
            if (!lookup[d.season]) lookup[d.season] = {};
            const cleanName = NORMALIZE_NAMES[d.competition] || d.competition;
            lookup[d.season][cleanName] = d.strictness_index;
            presentCompetitions.add(cleanName);
        });

        const sortedCompetitions = Array.from(presentCompetitions).sort((a, b) => {
            const indexA = PREFERRED_ORDER.indexOf(a);
            const indexB = PREFERRED_ORDER.indexOf(b);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        const grid = [];
        for (let sIndex = 0; sIndex < uniqueSeasons.length; sIndex++) {
            const season = uniqueSeasons[sIndex];
            for (let cIndex = 0; cIndex < sortedCompetitions.length; cIndex++) {
                const competition = sortedCompetitions[cIndex];
                const val = lookup[season]?.[competition];

                grid.push({
                    season,
                    competition,
                    value: val,
                });
            }
        }

        return { seasons: uniqueSeasons, displayedCompetitions: sortedCompetitions, gridData: grid };
    }, [data]);

    const margin = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 120
    };

    const rowHeight = 40;
    const innerHeight = Math.max(rowHeight * displayedCompetitions.length, 60);
    const height = innerHeight + margin.top + margin.bottom;

    const width = 400;
    const innerWidth = width - margin.left - margin.right;

    const xScale = d3.scaleBand()
        .domain(seasons)
        .range([0, innerWidth])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(displayedCompetitions)
        .range([0, innerHeight])
        .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, 10]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', maxHeight: '300px' }}>
                <g transform={`translate(${margin.left}, ${margin.top})`}>

                    {displayedCompetitions.map(comp => (
                        <text
                            key={comp}
                            x={-10}
                            y={(yScale(comp) || 0) + yScale.bandwidth() / 2}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fontSize="10px"
                            fill="#555"
                        >
                            {comp}
                        </text>
                    ))}

                    {seasons.map(season => (
                        <text
                            key={season}
                            x={(xScale(season) || 0) + xScale.bandwidth() / 2}
                            y={innerHeight + 15}
                            textAnchor="middle"
                            fontSize="10px"
                            fill="#555"
                        >
                            {season}
                        </text>
                    ))}

                    {gridData.map((cell, i) => (
                        <rect
                            key={i}
                            x={xScale(cell.season)}
                            y={yScale(cell.competition)}
                            width={xScale.bandwidth()}
                            height={yScale.bandwidth()}
                            fill={cell.value !== undefined ? colorScale(cell.value) : "#f0f0f0"}
                            rx={2}
                            stroke={cell.value !== undefined ? "none" : "#e0e0e0"}
                            strokeDasharray={cell.value !== undefined ? "none" : "2,2"}
                            onMouseOver={(e) => {
                                if (cell.value === undefined) return;
                                d3.select(e.currentTarget).attr("stroke", "#333").attr("stroke-width", 2);
                                if (tooltipRef.current) {
                                    tooltipRef.current.style.visibility = "visible";
                                    tooltipRef.current.innerHTML = `
                            <strong>${cell.season}</strong><br/>
                            ${cell.competition}<br/>
                            Strictness: <strong>${cell.value.toFixed(2)}</strong>
                        `;
                                }
                            }}
                            onMouseMove={(e) => {
                                if (tooltipRef.current && containerRef.current) {
                                    const rect = containerRef.current.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    tooltipRef.current.style.top = (y - 10) + "px";
                                    tooltipRef.current.style.left = (x + 15) + "px";
                                }
                            }}
                            onMouseOut={(e) => {
                                d3.select(e.currentTarget).attr("stroke", "none");
                                if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden";
                            }}
                        />
                    ))}
                </g>

                <g transform={`translate(${margin.left}, ${height - 10})`}>
                    <text x={0} y={0} fontSize="9px" fill="#888">Less Strict</text>
                    <rect x={50} y={-6} width={60} height={8} fill="url(#gradLegend)" />
                    <text x={115} y={0} fontSize="9px" fill="#888">More Strict</text>
                </g>

                <defs>
                    <linearGradient id="gradLegend">
                        <stop offset="0%" stopColor={colorScale(0)} />
                        <stop offset="50%" stopColor={colorScale(5)} />
                        <stop offset="100%" stopColor={colorScale(10)} />
                    </linearGradient>
                </defs>
            </svg>

            <div ref={tooltipRef} style={{
                position: "absolute",
                visibility: "hidden",
                backgroundColor: "rgba(30, 30, 30, 0.95)",
                color: "white",
                padding: "8px",
                borderRadius: "4px",
                fontSize: "12px",
                pointerEvents: "none",
                zIndex: 10,
                whiteSpace: "nowrap"
            }} />
        </div>
    );
};

export default RefereePassportHeatmap;