import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Slider, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import europeGeoJson from './europe.geo.json';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
    data: RefereeData[];
    selectedNationality: string[];
    onCountryClick: (nationalities: string[]) => void;
}

const nationalityToISO2: Record<string, string> = {
    'England': 'GB', 'France': 'FR', 'Germany': 'DE', 'Italy': 'IT', 'Spain': 'ES',
    'Poland': 'PL', 'Portugal': 'PT', 'Netherlands': 'NL', 'Switzerland': 'CH',
    'Belgium': 'BE', 'Austria': 'AT', 'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK',
    'Finland': 'FI', 'Lithuania': 'LT', 'Latvia': 'LV', 'Estonia': 'EE', 'Slovakia': 'SK',
    'Slovenia': 'SI', 'Czech Republic': 'CZ', 'Hungary': 'HU', 'Romania': 'RO',
    'Bulgaria': 'BG', 'Serbia': 'RS', 'Croatia': 'HR', 'Bosnia-Herzegovina': 'BA',
    'Montenegro': 'ME', 'Georgia': 'GE', 'Armenia': 'AM', 'Azerbaijan': 'AZ',
    'Turkey': 'TR', 'Greece': 'GR', 'Ukraine': 'UA', 'Russia': 'RU', 'Israel': 'IL',
    'Albania': 'AL', 'Belarus': 'BY', 'Cyprus': 'CY', "Faroe Islands": 'FO',
    'Iceland': 'IS', 'Moldova': 'MD', 'North Macedonia': 'MK', 'San Marino': 'SM',
    'Wales': 'GB', 'Türkiye': 'TR', 'Scotland': 'GB', 'Ireland': 'IE', 'Luxembourg': 'LU',
    'Kazakhstan': 'KZ', 'Northern Ireland': 'GB'
};

const REGIONS: Record<string, string[]> = {
    'Nordic': ['NO', 'SE', 'DK', 'FI', 'IS', 'FO'],
    'British Isles': ['GB', 'IE'],
    'Western Europe': ['FR', 'DE', 'NL', 'BE', 'CH', 'AT', 'LU'],
    'Southern Europe': ['PT', 'ES', 'IT', 'GR', 'CY', 'TR', 'IL', 'SM', 'MT'],
    'Central Europe': ['PL', 'CZ', 'SK', 'HU', 'SI', 'HR'],
    'Baltic States': ['EE', 'LT', 'LV'],
    'Eastern Europe': ['RO', 'BG', 'RS', 'BA', 'ME', 'MK', 'AL', 'MD', 'UA', 'RU', 'BY', 'GE', 'AM', 'AZ', 'KZ']
};

const ISO_TO_REGION: Record<string, string> = {};
Object.entries(REGIONS).forEach(([region, isos]) => {
    isos.forEach(iso => ISO_TO_REGION[iso] = region);
});

const iso2ToNationalities: Record<string, string[]> = {};
for (const nationality in nationalityToISO2) {
    const iso = nationalityToISO2[nationality];
    if (!iso2ToNationalities[iso]) {
        iso2ToNationalities[iso] = [];
    }
    iso2ToNationalities[iso].push(nationality);
}

const STRICTNESS_COLORS = ["#8de4d3","#a0d66f", "#1c5e39" ];
const BORDER_COLOR = '#666';

const GeoMap: React.FC<Props> = ({ data, selectedNationality, onCountryClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [minReferees, setMinReferees] = useState<number>(1);
    const [viewMode, setViewMode] = useState<'countries' | 'regions'>('countries');

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // This correctly sets the STARTING value to 8 when switching to regions
    useEffect(() => {
        if (viewMode === 'regions') {
            setMinReferees(8);
        } else {
            setMinReferees(1);
        }
    }, [viewMode]);

    useEffect(() => {
        if (!data || !europeGeoJson) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        const { width, height } = dimensions;

        const projection = d3.geoMercator().fitSize([width, height], europeGeoJson as any);
        const path = d3.geoPath().projection(projection);

        const uniqueReferees: Record<string, { nationality: string; totalStrictnessPoints: number; totalAppearances: number }> = {};
        data.forEach(d => {
            if (!uniqueReferees[d.name]) {
                uniqueReferees[d.name] = {
                    nationality: d.nationality,
                    totalStrictnessPoints: 0,
                    totalAppearances: 0
                };
            }
            uniqueReferees[d.name].totalStrictnessPoints += (d.strictness_index * d.appearances);
            uniqueReferees[d.name].totalAppearances += d.appearances;
        });

        const statsByISO2: Record<string, { strictnessSum: number; refereeCount: number }> = {};
        Object.values(uniqueReferees).forEach(ref => {
            const iso2 = nationalityToISO2[ref.nationality] || ref.nationality;
            const personalStrictness = ref.totalAppearances > 0
                ? ref.totalStrictnessPoints / ref.totalAppearances
                : 0;

            if (!statsByISO2[iso2]) statsByISO2[iso2] = { strictnessSum: 0, refereeCount: 0 };
            statsByISO2[iso2].strictnessSum += personalStrictness;
            statsByISO2[iso2].refereeCount += 1;
        });

        const finalMetrics: Record<string, { avgStrictness: number; count: number; label: string }> = {};
        const strictnessValues: number[] = [];

        if (viewMode === 'countries') {
            Object.keys(statsByISO2).forEach(iso => {
                const avg = statsByISO2[iso].strictnessSum / statsByISO2[iso].refereeCount;
                const count = statsByISO2[iso].refereeCount;
                finalMetrics[iso] = { avgStrictness: avg, count, label: iso };
                strictnessValues.push(avg);
            });
        } else {
            const statsByRegion: Record<string, { strictnessSum: number; refereeCount: number }> = {};

            Object.keys(statsByISO2).forEach(iso => {
                const region = ISO_TO_REGION[iso] || 'Other';
                if (!statsByRegion[region]) statsByRegion[region] = { strictnessSum: 0, refereeCount: 0 };

                statsByRegion[region].strictnessSum += statsByISO2[iso].strictnessSum;
                statsByRegion[region].refereeCount += statsByISO2[iso].refereeCount;
            });

            Object.keys(statsByISO2).forEach(iso => {
                const region = ISO_TO_REGION[iso];
                if (region && statsByRegion[region]) {
                    const avg = statsByRegion[region].strictnessSum / statsByRegion[region].refereeCount;
                    const count = statsByRegion[region].refereeCount;
                    finalMetrics[iso] = { avgStrictness: avg, count, label: region };
                    strictnessValues.push(avg);
                }
            });
        }

        const minStrict = d3.min(strictnessValues) ?? 0;
        const maxStrict = d3.max(strictnessValues) ?? 1;
        const midStrict = (minStrict + maxStrict) / 2;

        const strictnessColorScale = d3.scaleLinear<string>()
            .domain([minStrict, midStrict, maxStrict])
            .range(STRICTNESS_COLORS)
            .clamp(true);

        const container = d3.select(containerRef.current as any);
        const tooltip = container.append('div')
            .attr('class', 'geo-tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', 'rgba(30, 30, 30, 0.95)')
            .style('color', '#fff')
            .style('padding', '8px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('visibility', 'hidden')
            .style('z-index', '100');

        svg.append('g')
            .selectAll('path')
            .data((europeGeoJson as any).features)
            .enter()
            .append('path')
            .attr('d', path as any)
            .style('cursor', 'pointer')
            .attr('fill', (d: any) => {
                const iso = d.properties.ISO2;
                const metrics = finalMetrics[iso];

                if (!metrics || metrics.count < minReferees) return '#eee';

                if (selectedNationality.length > 0) {
                    if (viewMode === 'countries') {
                        const countryName = d.properties.NAME || d.properties.name;
                        const isSelected = selectedNationality.includes(countryName);
                        if (!isSelected) {
                            const isoSelected = selectedNationality.some(nat => nationalityToISO2[nat] === iso);
                            if (!isoSelected) return '#ddd';
                        }
                    } else {
                        const regionName = ISO_TO_REGION[iso];
                        const isRegionSelected = selectedNationality.some(nat => {
                            const natIso = nationalityToISO2[nat];
                            return ISO_TO_REGION[natIso] === regionName;
                        });
                        if (!isRegionSelected) return '#ddd';
                    }
                }

                return strictnessColorScale(metrics.avgStrictness);
            })
            .attr('stroke', (d: any) => {
                const iso = d.properties.ISO2;
                let isSelected = false;

                if (selectedNationality.length > 0) {
                    if (viewMode === 'countries') {
                        const countryName = d.properties.NAME || d.properties.name;
                        isSelected = selectedNationality.includes(countryName) || selectedNationality.some(nat => nationalityToISO2[nat] === iso);
                    } else {
                        const regionName = ISO_TO_REGION[iso];
                        isSelected = selectedNationality.some(nat => {
                            const natIso = nationalityToISO2[nat];
                            return ISO_TO_REGION[natIso] === regionName;
                        });
                    }
                }
                return isSelected ? '#000' : BORDER_COLOR;
            })
            .attr('stroke-width', (d: any) => {
                const iso = d.properties.ISO2;
                let isSelected = false;

                if (selectedNationality.length > 0) {
                    if (viewMode === 'countries') {
                        const countryName = d.properties.NAME || d.properties.name;
                        isSelected = selectedNationality.includes(countryName) || selectedNationality.some(nat => nationalityToISO2[nat] === iso);
                    } else {
                        const regionName = ISO_TO_REGION[iso];
                        isSelected = selectedNationality.some(nat => {
                            const natIso = nationalityToISO2[nat];
                            return ISO_TO_REGION[natIso] === regionName;
                        });
                    }
                }
                return isSelected ? 1.5 : 0.5;
            })
            .on('mouseover', function(_, d: any) {
                const iso = d.properties.ISO2;
                const metrics = finalMetrics[iso];

                if (metrics && metrics.count >= minReferees) {
                    d3.select(this).attr('stroke', '#000').attr('stroke-width', 1.5);

                    const countryName = d.properties.NAME || d.properties.name || iso;
                    const title = viewMode === 'regions' ? metrics.label : countryName;
                    const subLabel = viewMode === 'regions' ? `(Includes ${countryName})` : '';

                    tooltip.html(`
                        <div style="font-weight:bold; margin-bottom:4px;">${title}</div>
                        ${subLabel ? `<div style="font-size:0.8em; margin-bottom:4px; opacity:0.8">${subLabel}</div>` : ''}
                        <div>Strictness: <strong>${metrics.avgStrictness.toFixed(2)}</strong></div>
                        <div style="font-size:0.9em; opacity:0.8;">Referees: ${metrics.count}</div>
                    `).style('visibility', 'visible');
                } else {
                    const name = d.properties.NAME || d.properties.name || iso;
                    tooltip.html(`<strong>${name}</strong><br/>Insufficient data`).style('visibility', 'visible');
                }
            })
            .on('mousemove', function(event: any) {
                const [mouseX, mouseY] = d3.pointer(event, container.node());
                tooltip.style('left', `${mouseX + 12}px`).style('top', `${mouseY + 12}px`);
            })
            .on('mouseout', function(_, d: any) {
                const iso = d.properties.ISO2;

                let strokeColor = BORDER_COLOR;
                let strokeWidth = 0.5;

                let isSelected = false;
                if (selectedNationality.length > 0) {
                    if (viewMode === 'countries') {
                        const countryName = d.properties.NAME || d.properties.name;
                        isSelected = selectedNationality.includes(countryName) || selectedNationality.some(nat => nationalityToISO2[nat] === iso);
                    } else {
                        const regionName = ISO_TO_REGION[iso];
                        isSelected = selectedNationality.some(nat => {
                            const natIso = nationalityToISO2[nat];
                            return ISO_TO_REGION[natIso] === regionName;
                        });
                    }
                }

                if (isSelected) {
                    strokeColor = '#000';
                    strokeWidth = 1.5;
                }

                d3.select(this).attr('stroke', strokeColor).attr('stroke-width', strokeWidth);
                tooltip.style('visibility', 'hidden');
            })
            .on('click', function(_, d: any) {
                const iso = d.properties.ISO2;
                const metrics = finalMetrics[iso];

                if (metrics && metrics.count >= minReferees) {
                    if (viewMode === 'regions') {
                        const regionName = ISO_TO_REGION[iso];
                        const targetIsos = Object.keys(ISO_TO_REGION).filter(k => ISO_TO_REGION[k] === regionName);

                        let allNats: string[] = [];
                        targetIsos.forEach(targetIso => {
                            if (iso2ToNationalities[targetIso]) {
                                allNats = [...allNats, ...iso2ToNationalities[targetIso]];
                            }
                        });
                        if (allNats.length > 0) onCountryClick(allNats);

                    } else {
                        const countryName = d.properties.NAME || d.properties.name;
                        const nationalities = iso2ToNationalities[iso] || (countryName ? [countryName] : []);
                        if (nationalities.length > 0) {
                            onCountryClick(nationalities);
                        }
                    }
                }
            });

        const legendWidth = 140;
        const legendHeight = 12;
        const legendPadding = 20;

        const defs = svg.append('defs');
        const gradId = 'strictness-gradient';
        const linearGrad = defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('x2', '100%');
        linearGrad.append('stop').attr('offset', '0%').attr('stop-color', STRICTNESS_COLORS[0]);
        linearGrad.append('stop').attr('offset', '50%').attr('stop-color', STRICTNESS_COLORS[1]);
        linearGrad.append('stop').attr('offset', '100%').attr('stop-color', STRICTNESS_COLORS[2]);

        const legendG = svg.append('g')
            .attr('transform', `translate(${legendPadding}, ${height - legendHeight - legendPadding - 20})`);

        legendG.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', `url(#${gradId})`)
            .attr('stroke', '#999')
            .attr('stroke-width', 0.5);

        legendG.append('text')
            .attr('x', 0)
            .attr('y', legendHeight + 12)
            .text(minStrict.toFixed(2))
            .attr('font-size', 9)
            .attr('fill', '#666');

        legendG.append('text')
            .attr('x', legendWidth)
            .attr('y', legendHeight + 12)
            .text(maxStrict.toFixed(2))
            .attr('font-size', 9)
            .attr('fill', '#666')
            .attr('text-anchor', 'end');

        legendG.append('text')
            .attr('x', legendWidth + 6)
            .attr('y', legendHeight / 2)
            .text('Strictness')
            .attr('font-size', 9)
            .attr('fill', '#666')
            .attr('alignment-baseline', 'middle');

        return () => {
            tooltip.remove();
        };
    }, [data, dimensions, selectedNationality, onCountryClick, minReferees, viewMode]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

            <Box sx={{
                position: 'absolute',
                top: 5,
                left: 5,
                width: 120,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.95)',
                p: 1.5,
                borderRadius: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Min. Referees: {minReferees}
                </Typography>
                <Slider
                    size="small"
                    value={minReferees}
                    min={1} // CHANGED: Always allow going down to 1
                    max={viewMode === 'regions' ? 42 : 10}
                    step={1}
                    onChange={(_, value) => setMinReferees(value as number)}
                    valueLabelDisplay="auto"
                />
            </Box>

            <Box sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => {
                        if (newMode) {
                            setViewMode(newMode);
                            onCountryClick([]);
                        }
                    }}
                    size="small"
                    sx={{ height: 32 }}
                >
                    <ToggleButton value="countries" sx={{ fontSize: '0.75rem', px: 2 }}>
                        Countries
                    </ToggleButton>
                    <ToggleButton value="regions" sx={{ fontSize: '0.75rem', px: 2 }}>
                        Regions
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '10px', color: '#888', pointerEvents: 'none' }}>
                Color = Avg Strictness
            </div>
        </div>
    );
};

export default GeoMap;