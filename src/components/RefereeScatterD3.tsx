import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
    data: RefereeData[];
    isAgeMode: boolean;
    selectedReferees: string[];
    onRefereeToggle: (name: string) => void;
    regionColorMap?: Record<string, string>;
    nationalityToRegion?: Record<string, string>;
    threshold?: number;
}

interface AggregatedReferee extends RefereeData {
    competitionsList: string[];
}

const LEAGUE_CONFIG: { [key: string]: { label: string; color: string } } = {
    "Champions":  { label: "Champions League",  color: "#048dd9" },
    "Europa":     { label: "Europa League",     color: "#ffb800" },
    "Conference": { label: "Conference League", color: "#03b721" }
};

const SAFE_STRICTNESS_RANGE = ["#8de4d3","#a0d66f", "#1c5e39" ];

const RefereeScatterD3: React.FC<Props> = ({ data, isAgeMode, selectedReferees, onRefereeToggle, regionColorMap, nationalityToRegion, threshold }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

    useEffect(() => {
        // 1. Remove "data.length === 0" from here so we don't return too early
        if (
            !data ||
            !svgRef.current ||
            dimensions.width === 0 ||
            dimensions.height === 0
        ) return;

        const svg = d3.select(svgRef.current);
        
        // 2. Clear the chart regardless of whether there is data
        svg.selectAll("*").remove();

        // 3. NOW check if data is empty. If so, return here (leaving a blank cleared chart)
        if (data.length === 0) {
            // Optional: Add a "No Data" label if you want
            svg.append("text")
                .attr("x", dimensions.width / 2)
                .attr("y", dimensions.height / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "#999")
                .text("No data matches filters");
            return;
        }

        const uniqueCompetitions = Array.from(new Set(data.map(d => d.competition)));
        const isMultiLeague = uniqueCompetitions.length > 1;
        const hasSelection = selectedReferees && selectedReferees.length > 0;
        const aggregatedData: Record<string, AggregatedReferee> = {};

        data.forEach(d => {
            if (!aggregatedData[d.name]) {
                aggregatedData[d.name] = {
                    ...d,
                    competitionsList: [d.competition]
                };
            } else {
                const existing = aggregatedData[d.name];

                const totalApps = existing.appearances + d.appearances;
                const newStrictness =
                    ((existing.strictness_index * existing.appearances) +
                        (d.strictness_index * d.appearances)) / totalApps;

                existing.appearances = totalApps;
                existing.strictness_index = newStrictness;
                existing.age = Math.max(existing.age, d.age);

                if (!existing.competitionsList.includes(d.competition)) {
                    existing.competitionsList.push(d.competition);
                }
            }
        });

        const plotData = Object.values(aggregatedData);

        const margin = {
            top: 20,
            right: 30,
            bottom: 50,
            left: 60
        };

        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const xValue = (d: RefereeData) => isAgeMode ? d.age : d.appearances;
        const xLabel = isAgeMode ? "Referee Age" : "Matches Officiated";

        const xMax = d3.max(plotData, xValue) || 10;
        const xMin = d3.min(plotData, xValue) || 0;

        const xScale = d3.scaleLinear()
            .domain([Math.max(0, xMin - 1), xMax + 1])
            .range([0, width]);

        const yMax = d3.max(plotData, (d) => d.strictness_index) || 10;
        const yScale = d3.scaleLinear()
            .domain([0, yMax + 0.5])
            .range([height, 0]);

        const getLabel = (key: string) => {
            return LEAGUE_CONFIG[key] ? LEAGUE_CONFIG[key].label : key;
        };

        const getColor = (d: RefereeData) => {
            if (regionColorMap && nationalityToRegion) {
                const region = nationalityToRegion[d.nationality];
                if (region && regionColorMap[region]) {
                    return regionColorMap[region];
                }
            }

            const colorScale = d3.scaleLinear<string>()
                .domain([2, 5, 8])
                .range(SAFE_STRICTNESS_RANGE);
            return colorScale(d.strictness_index);
        };

        const regionsDomain = [
            'Nordic', 'British Isles', 'Western Europe', 'Southern Europe',
            'Central Europe', 'Baltic States', 'Eastern Europe'
        ];
        const symbolScale = d3.scaleOrdinal<string, any>()
            .domain(regionsDomain)
            .range(d3.symbols);

        const getSymbolType = (d: RefereeData) => {
            if (regionColorMap && nationalityToRegion) {
                const region = nationalityToRegion[d.nationality];
                if (region) return symbolScale(region);
            }
            return d3.symbolCircle;
        };

        const symbolGenerator = d3.symbol();

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .attr("opacity", 0.1)
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ""));

        g.append("g")
            .attr("class", "grid")
            .attr("opacity", 0.1)
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append("g")
            .call(d3.axisLeft(yScale));

        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("fill", "#666")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(xLabel);

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("fill", "#666")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Strictness Index");

        // Draw threshold line
        if (threshold !== undefined && threshold > 0) {
            const yPos = yScale(threshold);

            if (yPos >= 0 && yPos <= height) {
                g.append("line")
                    .attr("x1", 0)
                    .attr("x2", width)
                    .attr("y1", yPos)
                    .attr("y2", yPos)
                    .attr("stroke", "#000000ff")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "6,4")
                    .style("pointer-events", "none");

                g.append("text")
                    .attr("x", width - 5)
                    .attr("y", yPos - 5)
                    .attr("text-anchor", "end")
                    .attr("fill", "#000000ff")
                    .style("font-size", "11px")
                    .style("font-weight", "bold")
                    .text(`Threshold: ${threshold}`);
            }
        }

        const tooltip = d3.select(tooltipRef.current);

        g.selectAll("path.referee-dot")
            .data(plotData)
            .join("path")
            .attr("class", "referee-dot")
            .attr("transform", d => `translate(${xScale(xValue(d))},${yScale(d.strictness_index)})`)
            .attr("d", d => {
                const type = getSymbolType(d);
                const isSelected = selectedReferees.includes(d.name);
                const size = isSelected ? 200 : 113; // approx r=8 vs r=6
                return symbolGenerator.type(type).size(size)();
            })
            .attr("fill", (d) => {
                const baseColor = getColor(d);
                if (!hasSelection) return baseColor;
                return selectedReferees.includes(d.name) ? baseColor: "#e0e0e0";
            })
            .attr("opacity", d => (hasSelection && !selectedReferees.includes(d.name)) ? 0.3 : 0.9)
            .attr("stroke", d => selectedReferees.includes(d.name) ? "#000" : "#333")
            .attr("stroke-width", d => selectedReferees.includes(d.name) ? 2 : 1)
            .style("cursor", "pointer")
            .style("pointer-events", "all") 
            .on("click", (event, d) => {
                event.stopPropagation();
                onRefereeToggle(d.name);
            })
            .on("mouseover", (event, d) => {
                const type = getSymbolType(d);
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("d", symbolGenerator.type(type).size(450)()) // approx r=12
                    .attr("stroke-width", 2);

                if (tooltipRef.current) {

                    let leagueDisplay = "";
                    if (d.competitionsList.length > 1) {
                        const leagues = d.competitionsList.map(c => `• ${getLabel(c)}`).join("<br/>");
                        leagueDisplay = `<div style="margin-top:2px; margin-bottom:2px; font-style:italic; opacity:0.9;">${leagues}</div>`;
                    } else {
                        leagueDisplay = `<div style="margin-bottom:2px;">${getLabel(d.competition)}</div>`;
                    }

                    tooltip.style("visibility", "visible").html(`
            <div style="font-weight:bold; margin-bottom:4px;">${d.name}</div>
            <div style="font-size:0.85em; color:#ccc; line-height: 1.3;">${leagueDisplay}</div>
            <div style="font-size:0.85em; margin-bottom:6px;">${d.nationality}</div>
            <hr style="border-color:rgba(255,255,255,0.2); margin:4px 0;" />
            <div>Strictness: <strong>${d.strictness_index.toFixed(2)}</strong></div>
            <div>${isAgeMode ? `Age: ${d.age}` : `Appearances: ${d.appearances}`}</div>
          `);
                }
            })
            .on("mousemove", (event) => {
                if(tooltipRef.current && containerRef.current) {
                    const [x, y] = d3.pointer(event, containerRef.current);

                    const containerWidth = dimensions.width;
                    const tooltipWidth = tooltipRef.current.offsetWidth; 

                    let leftPos = x + 15;

                    if (leftPos + tooltipWidth > containerWidth) {
                        leftPos = x - 15 - tooltipWidth;
                    }

                    tooltip
                    .style("top", (y - 10) + "px")
                    .style("left", leftPos + "px");
                }
            })
            .on("mouseout", (event, d) => {
                const type = getSymbolType(d);
                const isSelected = selectedReferees.includes(d.name);
                const size = isSelected ? 200 : 113;
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("d", symbolGenerator.type(type).size(size)())
                    .attr("stroke-width", isSelected ? 2 : 1);
                if (tooltipRef.current) tooltip.style("visibility", "hidden");
            });

        if (regionColorMap && nationalityToRegion) {
            const activeRegions = new Set<string>();
            plotData.forEach(d => {
                const region = nationalityToRegion[d.nationality];
                if (region) activeRegions.add(region);
            });

            const visibleRegions = regionsDomain.filter(r => activeRegions.has(r));

            const legendWidth = 120;
            const itemHeight = 20;
            const padding = 10;
            const legendHeight = visibleRegions.length * itemHeight + padding * 2;

            const legendG = g.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - legendWidth - 10}, 10)`);

            legendG.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .attr("fill", "rgba(255, 255, 255, 0.85)")
                .attr("stroke", "#ccc")
                .attr("rx", 4);

            visibleRegions.forEach((region, i) => {
                const type = symbolScale(region);
                const color = regionColorMap[region] || "#999";
                const y = padding + i * itemHeight + itemHeight / 2;

                legendG.append("path")
                    .attr("transform", `translate(15, ${y})`)
                    .attr("d", d3.symbol().type(type).size(50)())
                    .attr("fill", color)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1);

                legendG.append("text")
                    .attr("x", 30)
                    .attr("y", y)
                    .attr("dy", "0.32em")
                    .style("font-size", "10px")
                    .style("fill", "#333")
                    .text(region);
            });
        }

    }, [data, isAgeMode, dimensions, selectedReferees, regionColorMap, nationalityToRegion, threshold]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg ref={svgRef} width="100%" height="100%" />
            <div ref={tooltipRef} style={{
                position: "absolute",
                visibility: "hidden",
                backgroundColor: "rgba(30, 30, 30, 0.95)",
                color: "white",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "12px",
                pointerEvents: "none",
                zIndex: 10,
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                minWidth: "150px"
            }} />
        </div>
    );
};

export default RefereeScatterD3;