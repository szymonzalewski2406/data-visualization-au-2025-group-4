import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
    data: RefereeData[];
    isAgeMode: boolean;
}

interface AggregatedReferee extends RefereeData {
    competitionsList: string[];
}

const LEAGUE_CONFIG: { [key: string]: { label: string; color: string } } = {
    "Champions":  { label: "Champions League",  color: "#048dd9" },
    "Europa":     { label: "Europa League",     color: "#ffb800" },
    "Conference": { label: "Conference League", color: "#03b721" }
};

const SAFE_STRICTNESS_RANGE = ["#2c7bb6", "#ffffbf", "#d7191c"];

const RefereeScatterD3: React.FC<Props> = ({ data, isAgeMode }) => {
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
        if (
            !data ||
            data.length === 0 ||
            !svgRef.current ||
            dimensions.width === 0 ||
            dimensions.height === 0
        ) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

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

        const colorScale = d3.scaleLinear<string>()
            .domain([2, 5, 8])
            .range(SAFE_STRICTNESS_RANGE);

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

        const tooltip = d3.select(tooltipRef.current);

        g.selectAll("circle")
            .data(plotData)
            .join("circle")
            .attr("cx", (d) => xScale(xValue(d)))
            .attr("cy", (d) => yScale(d.strictness_index))
            .attr("r", 6)
            .attr("fill", (d) => colorScale(d.strictness_index))
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("r", 12)
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
                    tooltip
                        .style("top", (y - 10) + "px")
                        .style("left", (x + 15) + "px");
                }
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .transition().duration(200)
                    .attr("r", 6)
                    .attr("stroke-width", 1);
                if (tooltipRef.current) tooltip.style("visibility", "hidden");
            });

    }, [data, isAgeMode, dimensions]);

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