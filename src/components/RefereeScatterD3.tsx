import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
  data: RefereeData[];
  isAgeMode: boolean;
}

// --- ACCESSIBLE PALETTES ---
const SAFE_STRICTNESS_RANGE = ["#2c7bb6", "#ffffbf", "#d7191c"]; 
const OKABE_ITO_COLORS = [
    "#E69F00", // Orange
    "#56B4E9", // Sky Blue
    "#009E73", // Bluish Green
    "#F0E442", // Yellow
    "#0072B2", // Blue
    "#D55E00", // Vermilion
    "#CC79A7", // Reddish Purple
    "#999999"  // Grey
];

const RefereeScatterD3: React.FC<Props> = ({ data, isAgeMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Resize Observer
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

  // 2. D3 Logic
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

    // --- COLOR LOGIC ---
    const uniqueCompetitions = Array.from(new Set(data.map(d => d.competition)));
    const isMultiLeague = uniqueCompetitions.length > 1;

    // --- DYNAMIC MARGINS ---
    // If we have a legend (multi-league), we need a big right margin.
    // If not, we keep it slim.
    const margin = { 
        top: 20, 
        right: isMultiLeague ? 140 : 30, // <--- FIX: Increase margin for legend
        bottom: 50, 
        left: 60 
    };
    
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // --- SCALES ---
    const xValue = (d: RefereeData) => isAgeMode ? d.age : d.appearances;
    const xLabel = isAgeMode ? "Referee Age" : "Matches Officiated";

    const xMax = d3.max(data, xValue) || 10;
    const xMin = d3.min(data, xValue) || 0;

    const xScale = d3.scaleLinear()
      .domain([Math.max(0, xMin - 1), xMax + 1])
      .range([0, width]);

    const yMax = d3.max(data, (d) => d.strictness_index) || 10;
    const yScale = d3.scaleLinear()
      .domain([0, yMax + 0.5])
      .range([height, 0]);

    let colorScale: any;
    if (isMultiLeague) {
        colorScale = d3.scaleOrdinal()
            .domain(uniqueCompetitions)
            .range(OKABE_ITO_COLORS); 
    } else {
        colorScale = d3.scaleLinear<string>()
            .domain([2, 5, 8]) 
            .range(SAFE_STRICTNESS_RANGE);
    }

    // --- DRAWING ---
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Gridlines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .attr("opacity", 0.1)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ""));

    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Labels
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

    // --- LEGEND FIX ---
    if (isMultiLeague) {
        // Move legend into the right margin area
        const legend = svg.append("g")
            .attr("transform", `translate(${margin.left + width + 15}, ${margin.top})`);
            
        uniqueCompetitions.forEach((comp, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);
            
            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", colorScale(comp));
                
            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 9)
                .style("font-size", "10px")
                .style("fill", "#333") // Ensure text is visible
                .text(comp);
        });
    }

    // Dots
    const tooltip = d3.select(tooltipRef.current);

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(xValue(d)))
      .attr("cy", (d) => yScale(d.strictness_index))
      .attr("r", 6)
      .attr("fill", (d) => isMultiLeague ? colorScale(d.competition) : colorScale(d.strictness_index))
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
          tooltip.style("visibility", "visible").html(`
            <div style="font-weight:bold; margin-bottom:4px;">${d.name}</div>
            <div style="font-size:0.85em; color:#ccc;">${d.competition}</div>
            <div style="font-size:0.85em; margin-bottom:6px;">${d.nationality}</div>
            <hr style="border-color:rgba(255,255,255,0.2); margin:4px 0;" />
            <div>Strictness: <strong>${d.strictness_index}</strong></div>
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