
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
  data: RefereeData[];
  threshold: number;
}

const COMPETITION_ORDER = ["Champions League", "Europa League", "Conference League"];

const normalizeCompetition = (name: string): string => {
  if (name.includes("Champions")) return "Champions League";
  if (name.includes("Europa")) return "Europa League";
  if (name.includes("Conference")) return "Conference League";
  return name;
};

const ellipsize = (text: string, maxChars: number) =>
  text.length > maxChars ? text.slice(0, Math.max(0, maxChars - 1)) + "…" : text;

const UpsetPlot: React.FC<Props> = ({ data, threshold }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Observe container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute intersections and set sizes
  const { intersections, sets } = useMemo(() => {
    const refs: Record<string, { strictIn: Set<string> }> = {};
    const setNames = new Set<string>();

    data.forEach(d => {
      const competition = normalizeCompetition(d.competition);
      setNames.add(competition);
      if (!refs[d.name]) {
        refs[d.name] = { strictIn: new Set() };
      }
      if (d.strictness_index >= threshold) {
        refs[d.name].strictIn.add(competition);
      }
    });

    const sortedSetNames = COMPETITION_ORDER.filter(c => setNames.has(c));

    const intersectionMap: Record<string, string[]> = {};
    Object.entries(refs).forEach(([refName, { strictIn }]) => {
      if (strictIn.size > 0) {
        const key = sortedSetNames.map(name => (strictIn.has(name) ? '1' : '0')).join('');
        if (!intersectionMap[key]) intersectionMap[key] = [];
        intersectionMap[key].push(refName);
      }
    });

    const intersections = Object.entries(intersectionMap)
      .map(([key, referees]) => ({ key, referees, size: referees.length }))
      .sort((a, b) => b.size - a.size);

    const sets = sortedSetNames.map(name => ({
      name,
      size: Object.values(refs).filter(r => r.strictIn.has(name)).length
    }));

    return { intersections, sets };
  }, [data, threshold]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || dimensions.width === 0 || dimensions.height === 0 || intersections.length === 0) {
      d3.select(svgEl).selectAll('*').remove();
      return;
    }

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const margin = { top: 80, right: 20, bottom: 30, left: 150 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // ---- Responsive split between top bars and matrix ----
    const nSets = sets.length;
    const minRowHeight = 26; // ~font-size 12 + spacing
    const desiredMatrixHeight = Math.max(nSets * minRowHeight, height * 0.35);
    const matrixHeight = Math.min(desiredMatrixHeight, height * 0.65);
    const topChartHeight = Math.max(0, height - matrixHeight);

    const mainGroup = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const tooltip = d3.select(tooltipRef.current);

    // ---- Top bar chart (intersections) ----
    const xTop = d3.scaleBand()
      .domain(intersections.map(d => d.key))
      .range([0, width])
      .padding(Math.min(0.35, 0.15 + (6 / Math.max(6, intersections.length))));

    const yTop = d3.scaleLinear()
      .domain([0, d3.max(intersections, d => d.size) ?? 0])
      .nice()
      .range([topChartHeight, 0]);

    const topGroup = mainGroup.append('g');

    // Y-axis for top chart (with faint grid lines)
    topGroup.append('g')
      .call(d3.axisLeft(yTop).ticks(5, "d"))
      .call(g => g.selectAll('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('x2', width)              // full-width horizontal grid lines
        .attr('stroke', '#e0e0e0')
        .attr('stroke-opacity', 1)
        .attr('stroke-dasharray', '2,2'));

    topGroup.append('text')
      .attr('x', -40)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#666')
      .text('Intersection Size');

    // Bars
    topGroup.append('g')
      .selectAll('rect')
      .data(intersections)
      .join('rect')
      .attr('x', d => xTop(d.key)!)
      .attr('y', d => yTop(d.size))
      .attr('width', xTop.bandwidth())
      .attr('height', d => topChartHeight - yTop(d.size))
      .attr('fill', '#4682B4')
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('fill', '#2a4d69');
        const refereeList = d.referees.length > 10
          ? `${d.referees.slice(0, 10).join('<br>')}...and ${d.referees.length - 10} more`
          : d.referees.join('<br>');
        tooltip.style('visibility', 'visible').html(`
          <div style="font-weight: bold; margin-bottom: 5px;">Intersection (${d.size} referees)</div>
          <div style="font-size: 11px; max-height: 150px; overflow-y: auto;">${refereeList}</div>
        `);
      })
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event, containerRef.current!);
        const bbox = containerRef.current!.getBoundingClientRect();
        const ttEl = tooltipRef.current!;
        const ttWidth = ttEl.offsetWidth || 200;
        const ttHeight = ttEl.offsetHeight || 60;
        const clampedX = Math.min(Math.max(10, mx + 15), bbox.width - ttWidth - 10);
        const clampedY = Math.min(Math.max(10, my), bbox.height - ttHeight - 10);
        tooltip.style('left', `${clampedX}px`).style('top', `${clampedY}px`);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('fill', '#4682B4');
        tooltip.style('visibility', 'hidden');
      });

    // Top labels only if there is room
    const showTopLabels = xTop.bandwidth() > 22;
    if (showTopLabels) {
      topGroup.append('g')
        .selectAll('text')
        .data(intersections)
        .join('text')
        .attr('x', d => xTop(d.key)! + xTop.bandwidth() / 2)
        .attr('y', d => yTop(d.size) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', '#333')
        .text(d => d.size);
    }

    // ---- Matrix (bottom) ----
    const yMatrix = d3.scaleBand()
      .domain(sets.map(s => s.name))
      .range([0, matrixHeight - 10])
      .padding(Math.min(0.45, 0.25 + (8 / Math.max(8, nSets))));

    const matrixGroup = mainGroup.append('g').attr('transform', `translate(0, ${topChartHeight + 10})`);

    // Row guide lines across the matrix (faint)
    
    matrixGroup.selectAll('rect').data(sets).join('rect')
    .attr('x', 0).attr('y', d => yMatrix(d.name)!)
    .attr('width', width).attr('height', yMatrix.bandwidth())
    .attr('fill', (_d, i) => (i % 2 ?  '#ffffff' : '#f3f5f9'));


    const dotRadius = Math.max(3, Math.min(8, yMatrix.bandwidth() / 3));

    // Column groups
    const matrixItems = matrixGroup.selectAll('g.matrix-col')
      .data(intersections)
      .join('g')
      .attr('class', 'matrix-col')
      .attr('transform', d => `translate(${xTop(d.key)! + xTop.bandwidth() / 2}, 0)`);

    // For each column, draw connection line for active indices
    matrixItems.each(function (d: any) {
      const g = d3.select(this);
      const activeIndices = d.key.split('').map((c: string, i: number) => (c === '1' ? i : -1)).filter((i: number) => i !== -1);

      if (activeIndices.length > 1) {
        const yCoords = activeIndices.map((i: number) => yMatrix(sets[i].name)! + yMatrix.bandwidth() / 2);
        g.append('line')
          .attr('y1', d3.min(yCoords)!)
          .attr('y2', d3.max(yCoords)!)
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
      }
    });

    // Draw circles for ALL rows:
    // - active sets: dark (#333)
    // - inactive sets: light gray (#c7c7c7)
    matrixItems.each(function (d: any) {
      const g = d3.select(this);
      const keyBits = d.key.split('').map((c: string) => c === '1');

      sets.forEach((set, i) => {
        const cy = yMatrix(set.name)! + yMatrix.bandwidth() / 2;
        const isActive = keyBits[i];

        g.append('circle')
          .attr('cy', cy)
          .attr('r', dotRadius)
          .attr('fill', isActive ? '#333' : '#c7c7c7')
          .attr('stroke', isActive ? 'none' : '#bdbdbd')
          .attr('opacity', isActive ? 1 : 0.9);
      });
    });

    // ---- Left bar chart (set sizes) & labels ----
    const xLeft = d3.scaleLinear()
      .domain([0, d3.max(sets, s => s.size) ?? 0])
      .nice()
      .range([0, margin.left - 40]); // width of left chart area

    const leftGroup = svg.append('g').attr('transform', `translate(0, ${margin.top + topChartHeight + 10})`);

    // Left X-axis
/*     leftGroup.append('g')
      .attr('transform', `translate(${margin.left - xLeft.range()[1] - 40}, ${matrixHeight - 10})`)
      .call(d3.axisBottom(xLeft).ticks(3))
      .call(g => g.select('.domain').remove()); */


    
    leftGroup.append('text')
    .attr('x', margin.left - xLeft.range()[1] - 40 + xLeft.range()[1] / 2) // center under axis
    .attr('y', matrixHeight) // a bit below the axis ticks
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#666')
    .text('Set Size');



    // Left bars
    leftGroup.selectAll('rect')
      .data(sets)
      .join('rect')
      .attr('x', d => margin.left - 40 - xLeft(d.size))
      .attr('y', d => yMatrix(d.name)!)
      .attr('width', d => xLeft(d.size))
      .attr('height', yMatrix.bandwidth())
      .attr('fill', '#999999')
      .attr('rx', 2);

    // Name labels with truncation + title tooltip
    const nameColumnWidth = 90; // reserved visual space for names
    const maxNameChars = Math.max(6, Math.floor(nameColumnWidth / 7)); // ~7px per char heuristic


    // --- Name labels: to the RIGHT of the bars (near the matrix)
    leftGroup.selectAll('.name-label')
    .data(sets)
    .join('text')
    .attr('class', 'name-label')
    // place just to the right of the bar end (matrix side)
    .attr('x', margin.left - 35)
    .attr('y', d => yMatrix(d.name)! + yMatrix.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'start')      // ← left-aligned text
    .attr('font-size', '12px')
    .attr('fill', '#333')
    .text(d => d.name)                  // keep full name; add next line back if you want truncation:
    // .text(d => ellipsize(d.name, maxNameChars))
    .append('title')
    .text(d => d.name);


    // Size labels: inside if room, outside (left of bar) otherwise
    
// --- Size labels: each bar, centered

// Size labels: place inside if room, otherwise outside (left of bar)
leftGroup.selectAll('.size-label')
  .data(sets)
  .join('text')
  .attr('class', 'size-label')
  .attr('y', d => yMatrix(d.name)! + yMatrix.bandwidth() / 2)
  .attr('dy', '0.35em')
  .attr('font-size', '11px')
  .attr('font-weight', 'bold')
  .text(d => d.size)
  .attr('x', d => {
    const w = xLeft(d.size);
    const barStart = margin.left - 40 - w;
    const insidePadding = 6;
    const approxTextWidth = String(d.size).length * 6.5;
    return w > approxTextWidth + insidePadding * 2
      ? barStart + insidePadding                // inside the bar
      : barStart - 6;                           // just outside, left of bar
  })
  .attr('text-anchor', d => {
    const w = xLeft(d.size);
    const approxTextWidth = String(d.size).length * 6.5;
    return w > approxTextWidth + 12 ? 'start' : 'end';
  })
  .attr('fill', d => {
    const w = xLeft(d.size);
    const approxTextWidth = String(d.size).length * 6.5;
    return w > approxTextWidth + 12 ? 'white' : '#333';
  });



  }, [intersections, sets, dimensions]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} width="100%" height="100%" />
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          whiteSpace: 'normal',   // allow wrapping
          maxWidth: '280px'       // keep within container
        }}
      />
    </div>
  );
};

export default UpsetPlot;