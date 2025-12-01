import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
    data: RefereeData[];
    leagueA: string;
    leagueB: string;
}

const TwoLeagueScatter: React.FC<Props> = ({ data, leagueA, leagueB }) => {
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
        if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Normalize competition names so we can match selections like
        // 'Champions League' with CSV values like 'Champions' (and vice-versa).
        const normalize = (s: string | undefined) => {
            if (!s) return '';
            const low = s.toLowerCase();
            if (low.includes('champ')) return 'champions';
            if (low.includes('europ')) return 'europa';
            if (low.includes('conference')) return 'conference';
            return low.replace(/[^a-z]/g, '');
        };

        // Aggregate per referee per normalized competition
        const refMap: Record<string, { [comp: string]: RefereeData }> = {};

        data.forEach(d => {
            if (!refMap[d.name]) refMap[d.name] = {};
            const key = normalize(d.competition);
            refMap[d.name][key] = d;
        });

        const keyA = normalize(leagueA);
        const keyB = normalize(leagueB);

        const plotData = Object.entries(refMap).map(([name, comps]) => {
            return {
                name,
                a: comps[keyA],
                b: comps[keyB]
            };
        }).filter(d => d.a && d.b) as Array<{ name: string, a: RefereeData, b: RefereeData }>;

        const margin = { top: 20, right: 30, bottom: 60, left: 70 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const xMin = 0;
        const xMax = d3.max(plotData, d => d.a.strictness_index) ?? 10;
        const yMin = 0;
        const yMax = d3.max(plotData, d => d.b.strictness_index) ?? 10;

        const xScale = d3.scaleLinear().domain([Math.max(0, xMin - 0.5), xMax + 0.5]).range([0, width]);
        const yScale = d3.scaleLinear().domain([Math.max(0, yMin - 0.5), yMax + 0.5]).range([height, 0]);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Grid
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .attr('opacity', 0.08)
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ''));

        g.append('g')
            .attr('opacity', 0.08)
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ''));

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g').call(d3.axisLeft(yScale));

        // Labels
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + 45)
            .attr('fill', '#666')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(`${leagueA} Strictness Index`);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -55)
            .attr('x', -height / 2)
            .attr('fill', '#666')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(`${leagueB} Strictness Index`);

        const tooltip = d3.select(tooltipRef.current);

        g.selectAll('circle')
            .data(plotData)
            .join('circle')
            .attr('cx', d => xScale(d.a.strictness_index))
            .attr('cy', d => yScale(d.b.strictness_index))
            .attr('r', 6)
            .attr('fill', '#1976d2')
            .attr('opacity', 0.9)
            .attr('stroke', '#222')
            .attr('stroke-width', 0.8)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).transition().duration(150).attr('r', 10).attr('stroke-width', 1.8);
                if (tooltipRef.current) {
                    tooltip.style('visibility', 'visible').html(`
                        <div style="font-weight:bold; margin-bottom:6px;">${d.name}</div>
                        <div style="font-size:0.9em; margin-bottom:4px;">${leagueA}: <strong>${d.a.strictness_index.toFixed(2)}</strong> (${d.a.appearances} apps)</div>
                        <div style="font-size:0.9em;">${leagueB}: <strong>${d.b.strictness_index.toFixed(2)}</strong> (${d.b.appearances} apps)</div>
                    `);
                }
            })
            .on('mousemove', (event) => {
                if (tooltipRef.current && containerRef.current) {
                    const [x, y] = d3.pointer(event, containerRef.current);
                    tooltip.style('top', (y - 10) + 'px').style('left', (x + 15) + 'px');
                }
            })
            .on('mouseout', (event) => {
                d3.select(event.currentTarget).transition().duration(150).attr('r', 6).attr('stroke-width', 0.8);
                if (tooltipRef.current) tooltip.style('visibility', 'hidden');
            });

        // diagonal reference line (y = x)
        const lineData = [
            { x: Math.min(xMin, yMin), y: Math.min(xMin, yMin) },
            { x: Math.max(xMax, yMax), y: Math.max(xMax, yMax) }
        ];
        g.append('line')
            .attr('x1', xScale(lineData[0].x))
            .attr('y1', yScale(lineData[0].y))
            .attr('x2', xScale(lineData[1].x))
            .attr('y2', yScale(lineData[1].y))
            .attr('stroke', '#999')
            .attr('stroke-dasharray', '4 4')
            .attr('opacity', 0.8);

    }, [data, leagueA, leagueB, dimensions]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg ref={svgRef} width="100%" height="100%" />
            <div ref={tooltipRef} style={{
                position: 'absolute',
                visibility: 'hidden',
                backgroundColor: 'rgba(30,30,30,0.95)',
                color: 'white',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '12px',
                pointerEvents: 'none',
                zIndex: 20,
                minWidth: '160px'
            }} />
        </div>
    );
};

export default TwoLeagueScatter;
