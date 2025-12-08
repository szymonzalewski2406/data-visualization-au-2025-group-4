import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';
import { FormControlLabel, Checkbox, Stack, Typography, Box } from '@mui/material';

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

type MetricKey = keyof typeof METRIC_LABELS;

const RefereeGroupedBarChartD3: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visibleMetrics, setVisibleMetrics] = useState<MetricKey[]>(['yellow', 'double', 'red', 'penalty']);

  const handleMetricToggle = (metric: MetricKey) => {
    setVisibleMetrics(prev => {
      if (prev.includes(metric)) {
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };

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
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (data.length === 0) {
        svg.append("text")
             .attr("x", dimensions.width / 2)
             .attr("y", dimensions.height / 2)
             .attr("text-anchor", "middle")
             .attr("fill", "#999")
             .text("No data available");
        return;
    }

    // --- AGGREGATION LOGIC START ---
    // Combine records for the same referee (e.g. across different leagues)
    const aggregatedMap = new Map<string, RefereeData>();

    data.forEach(d => {
        if (aggregatedMap.has(d.name)) {
            const existing = aggregatedMap.get(d.name)!;
            const totalApps = existing.appearances + d.appearances;
            
            // Weighted average for strictness index
            const newStrictness = ((existing.strictness_index * existing.appearances) + 
                                  (d.strictness_index * d.appearances)) / totalApps;

            aggregatedMap.set(d.name, {
                ...existing,
                appearances: totalApps,
                yellow_cards: existing.yellow_cards + d.yellow_cards,
                double_yellow_cards: existing.double_yellow_cards + d.double_yellow_cards,
                red_cards: existing.red_cards + d.red_cards,
                penalties: existing.penalties + d.penalties,
                strictness_index: newStrictness
            });
        } else {
            aggregatedMap.set(d.name, { ...d });
        }
    });

    const aggregatedData = Array.from(aggregatedMap.values());
    // --- AGGREGATION LOGIC END ---

    // Now filter and sort the aggregated data
    // Changed filter to >= 1 based on your preference, or keep > 1 if strict
    const topRefs = aggregatedData
        .filter(d => d.appearances >= 1) 
        .sort((a, b) => b.strictness_index - a.strictness_index)
        .slice(0, 10);

    // If aggregation results in no data (unlikely if input has data), handle it
    if (topRefs.length === 0) {
        svg.append("text")
             .attr("x", dimensions.width / 2)
             .attr("y", dimensions.height / 2)
             .attr("text-anchor", "middle")
             .attr("fill", "#999")
             .text("No referees meet the appearance criteria");
        return;
    }

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
        .domain(topRefs.map(d => d.name))
        .rangeRound([0, width])
        .paddingInner(0.1);

    const keys = visibleMetrics;

    const x1 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);

    const yMax = d3.max(topRefs, d => {
      const perGameValues = keys.map(key => {
        if (d.appearances === 0) return 0; // Prevent divide by zero
        if (key === 'yellow') return d.yellow_cards / d.appearances;
        if (key === 'double') return d.double_yellow_cards / d.appearances;
        if (key === 'red') return d.red_cards / d.appearances;
        if (key === 'penalty') return d.penalties / d.appearances;
        return 0;
      });
      return Math.max(...perGameValues);
    }) || 1;

    const y = d3.scaleLinear()
        .domain([0, yMax * 1.1])
        .rangeRound([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(Object.keys(METRIC_COLORS))
        .range(Object.values(METRIC_COLORS));

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
          value: d.appearances > 0 ? (key === 'yellow' ? d.yellow_cards :
              key === 'double' ? d.double_yellow_cards :
                  key === 'red' ? d.red_cards : d.penalties) / d.appearances : 0,
          refName: d.name
        })))
        .join("rect")
        .attr("x", d => x1(d.key)!)
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => METRIC_COLORS[d.key as MetricKey])
        .attr("rx", 2)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).attr("opacity", 0.8);
          if (tooltipRef.current) {
            tooltip.style("visibility", "visible").html(`
            <strong>${d.refName}</strong><br/>
            ${METRIC_LABELS[d.key as MetricKey]}: <strong>${d.value.toFixed(2)}</strong>
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

  }, [data, dimensions, visibleMetrics]);

  return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2, pb: 1 }}>
          <Stack direction="row" spacing={2}>
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(key => (
                <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                          checked={visibleMetrics.includes(key)}
                          onChange={() => handleMetricToggle(key)}
                          size="small"
                          sx={{
                            color: METRIC_COLORS[key],
                            '&.Mui-checked': { color: METRIC_COLORS[key] }
                          }}
                      />
                    }
                    label={<Typography variant="caption">{METRIC_LABELS[key]}</Typography>}
                />
            ))}
          </Stack>
        </Box>

        <div ref={containerRef} style={{ flexGrow: 1, position: 'relative', width: '100%' }}>
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
      </div>
  );
};

export default RefereeGroupedBarChartD3;