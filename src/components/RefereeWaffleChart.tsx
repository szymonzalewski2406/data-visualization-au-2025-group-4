import React, { useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
    data: RefereeData;
}

const COLORS = {
    yellow: "#FFD700",
    double: "#FF8C00",
    red: "#D32F2F",
    empty: "#e0e0e0"
};

const LABELS = {
    yellow: "Yellow Cards",
    double: "2nd Yellows",
    red: "Red Cards",
    empty: "None",
};

const RefereeWaffleChart: React.FC<Props> = ({ data }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { gridData, counts, percentages } = useMemo(() => {
        const totalCards = data.yellow_cards + data.double_yellow_cards + data.red_cards;

        if (totalCards === 0) {
            return {
                gridData: Array(100).fill({ type: 'empty', index: 0 }),
                counts: { yellow: 0, double: 0, red: 0, total: 0 },
                percentages: { yellow: 0, double: 0, red: 0 }
            };
        }

        let redBlocks = Math.round((data.red_cards / totalCards) * 100);
        let doubleBlocks = Math.round((data.double_yellow_cards / totalCards) * 100);

        if (data.red_cards > 0 && redBlocks === 0) redBlocks = 1;
        if (data.double_yellow_cards > 0 && doubleBlocks === 0) doubleBlocks = 1;

        let yellowBlocks = 100 - redBlocks - doubleBlocks;

        if (yellowBlocks < 0) {
            yellowBlocks = 0;
            const remainder = 100 - yellowBlocks;
            const sumSmall = redBlocks + doubleBlocks;
            redBlocks = Math.floor(redBlocks / sumSmall * remainder);
            doubleBlocks = remainder - redBlocks;
        }

        const grid = [
            ...Array(yellowBlocks).fill('yellow'),
            ...Array(doubleBlocks).fill('double'),
            ...Array(redBlocks).fill('red')
        ];

        while (grid.length < 100) grid.push('yellow');
        if (grid.length > 100) grid.length = 100;

        return {
            gridData: grid.map((type, i) => ({ type, index: i })),
            counts: {
                yellow: data.yellow_cards,
                double: data.double_yellow_cards,
                red: data.red_cards,
                total: totalCards
            },
            percentages: {
                yellow: yellowBlocks,
                double: doubleBlocks,
                red: redBlocks
            }
        };
    }, [data]);

    const size = 200;
    const gap = 2;
    const cellSize = (size - (9 * gap)) / 10;

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

            <svg width={size} height={size}>
                {gridData.map((cell) => {
                    const row = Math.floor(cell.index / 10);
                    const col = cell.index % 10;
                    const x = col * (cellSize + gap);
                    const y = row * (cellSize + gap);

                    return (
                        <rect
                            key={cell.index}
                            x={x}
                            y={y}
                            width={cellSize}
                            height={cellSize}
                            rx={2}
                            fill={COLORS[cell.type as keyof typeof COLORS]}
                            onMouseOver={(e) => {
                                d3.select(e.currentTarget).attr("opacity", 0.7);
                                if (tooltipRef.current) {
                                    const type = cell.type as keyof typeof LABELS;
                                    if(type === 'empty') return;

                                    const count = counts[type as keyof typeof counts];
                                    const percent = ((count / counts.total) * 100).toFixed(1);

                                    tooltipRef.current.style.visibility = "visible";
                                    tooltipRef.current.innerHTML = `
                        <strong>${LABELS[type]}</strong><br/>
                        Count: ${count}<br/>
                        Share: ${percent}%
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
                                d3.select(e.currentTarget).attr("opacity", 1);
                                if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden";
                            }}
                        />
                    );
                })}
            </svg>

            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', fontSize: '12px', color: '#555' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, background: COLORS.yellow, borderRadius: 2 }}></div>
                    <span>Yellow ({percentages.yellow}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, background: COLORS.double, borderRadius: 2 }}></div>
                    <span>2nd Y ({percentages.double}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, background: COLORS.red, borderRadius: 2 }}></div>
                    <span>Red ({percentages.red}%)</span>
                </div>
            </div>

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

export default RefereeWaffleChart;