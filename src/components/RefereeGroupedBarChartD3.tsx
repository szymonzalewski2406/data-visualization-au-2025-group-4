import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
  data: RefereeData[];
}

const METRIC_COLORS = {
  yellow: "#FFD700",
  double: "#FF8C00",
  red: "#D32F2F",
  penalty: "#2C3E50"
};

const METRIC_LABELS = {
  yellow: "Yellow Cards/Game",
  double: "2nd Yellows/Game",
  red: "Red Cards/Game",
  penalty: "Penalties/Game"
};

const RefereeGroupedBarChartD3: React.FC<Props> = ({ data }) => {
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
    if (!data || data.length === 0 || !svgRef.current || dimensions.width === 0) return;

    const topRefs = [...data]
        .filter(d => d.appearances > 1)
        .sort((a, b) => b.strictness_index - a.strictness_index)
        .slice(0, 10);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
        .domain(topRefs.map(d => d.name))
        .rangeRound([0, width])
        .paddingInner(0.1);

    const keys = ["yellow", "double", "red", "penalty"] as const;

    const x1 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);

    const yMax = d3.max(topRefs, d => {
      const perGame = [
        d.yellow_cards / d.appearances,
        d.double_yellow_cards / d.appearances,
        d.red_cards / d.appearances,
        d.penalties / d.appearances
      ];
      return Math.max(...perGame);
    }) || 1;

    const y = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .rangeRound([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range([METRIC_COLORS.yellow, METRIC_COLORS.double, METRIC_COLORS.red, METRIC_COLORS.penalty]);

    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""))
        .attr("opacity", 0.1);

    const tooltip = d3.select(tooltipRef.current);

    g.append("g")
        .selectAll("g")
        .data(topRefs)
        .join("g")
        .attr("transform", d => `translate(${x0(d.name)},0)`)
        .selectAll("rect")
        .data(d => keys.map(key => ({
          key,
          value: (key === 'yellow' ? d.yellow_cards :
              key === 'double' ? d.double_yellow_cards :
                  key === 'red' ? d.red_cards : d.penalties) / d.appearances,
          refName: d.name,
          competition: d.competition
        })))
        .join("rect")
        .attr("x", d => x1(d.key)!)
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.key) as string)
        .attr("rx", 2)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).attr("opacity", 0.8);
          if (tooltipRef.current) {
            tooltip.style("visibility", "visible").html(`
            <strong>${d.refName}</strong><br/>
            ${METRIC_LABELS[d.key as keyof typeof METRIC_LABELS]}: <strong>${d.value.toFixed(2)}</strong>
          `);
          }
        })
        .on("mousemove", (event) => {
          if(tooltipRef.current && containerRef.current) {
            const [x, y] = d3.pointer(event, containerRef.current);
            tooltip.style("top", (y - 10) + "px").style("left", (x + 15) + "px");
          }
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).attr("opacity", 1);
          if(tooltipRef.current) tooltip.style("visibility", "hidden");
        });

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    g.append("g")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()!) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Per Game");

    const legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys)
        .join("g")
        .attr("transform", (d, i) => `translate(${width},${i * 20})`);

    legend.append("rect")
        .attr("x", -19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => color(d) as string);

    legend.append("text")
        .attr("x", -24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => METRIC_LABELS[d]);

  }, [data, dimensions]);

  return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg ref={svgRef} width="100%" height="100%" />
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
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
        }} />
      </div>
  );
};

export default RefereeGroupedBarChartD3;