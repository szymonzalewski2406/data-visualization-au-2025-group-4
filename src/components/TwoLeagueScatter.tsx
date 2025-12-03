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

        const normalize = (s: string | undefined) => {
            if (!s) return '';
            const low = s.toLowerCase();
            if (low.includes('champ')) return 'champions';
            if (low.includes('europ')) return 'europa';
            if (low.includes('conference')) return 'conference';
            return low.replace(/[^a-z]/g, '');
        };

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

        const allStrictness = [
            ...plotData.map(d => d.a.strictness_index),
            ...plotData.map(d => d.b.strictness_index)
        ];

        const minVal = Math.floor(d3.min(allStrictness) || 2);
        const maxVal = Math.ceil(d3.max(allStrictness) || 8);
        const midVal = (minVal + maxVal) / 2;

        const xScale = d3.scaleLinear().domain([minVal, maxVal]).range([0, width]);
        const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Quadrant Backgrounds
        const bgColors = {
            strict: "#ffebee",
            lenient: "#e8f5e9",
            mixed: "#fff3e0"
        };

        // Top-Right (Strict in both)
        g.append("rect")
            .attr("x", xScale(midVal))
            .attr("y", 0)
            .attr("width", width - xScale(midVal))
            .attr("height", yScale(midVal))
            .attr("fill", bgColors.strict)
            .attr("opacity", 0.5);

        // Bottom-Left (Lenient in both)
        g.append("rect")
            .attr("x", 0)
            .attr("y", yScale(midVal))
            .attr("width", xScale(midVal))
            .attr("height", height - yScale(midVal))
            .attr("fill", bgColors.lenient)
            .attr("opacity", 0.5);

        // Top-Left (Mixed)
        g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", xScale(midVal))
            .attr("height", yScale(midVal))
            .attr("fill", bgColors.mixed)
            .attr("opacity", 0.3);

        // Bottom-Right (Mixed)
        g.append("rect")
            .attr("x", xScale(midVal))
            .attr("y", yScale(midVal))
            .attr("width", width - xScale(midVal))
            .attr("height", height - yScale(midVal))
            .attr("fill", bgColors.mixed)
            .attr("opacity", 0.3);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .attr('opacity', 0.1)
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ''));

        g.append('g')
            .attr('opacity', 0.1)
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ''));

        // Diagonal Line
        g.append('line')
            .attr('x1', 0)
            .attr('y1', height)
            .attr('x2', width)
            .attr('y2', 0)
            .attr('stroke', '#999')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '5 5');

        g.append("text")
            .attr("x", width - 10)
            .attr("y", 20)
            .attr("text-anchor", "end")
            .attr("fill", "#999")
            .style("font-size", "10px")
            .style("font-style", "italic")
            .text("Equal Strictness Line");

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g').call(d3.axisLeft(yScale));

        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('fill', '#444')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(`${leagueA} Strictness`);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50)
            .attr('x', -height / 2)
            .attr('fill', '#444')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(`${leagueB} Strictness`);

        const tooltip = d3.select(tooltipRef.current);

        g.selectAll('circle')
            .data(plotData)
            .join('circle')
            .attr('cx', d => xScale(d.a.strictness_index))
            .attr('cy', d => yScale(d.b.strictness_index))
            .attr('r', 6)
            .attr('fill', '#2196f3')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .style('filter', 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget)
                    .transition().duration(150)
                    .attr('r', 10)
                    .attr('fill', '#1565c0');

                if (tooltipRef.current) {
                    tooltip.style('visibility', 'visible').html(`
                        <div style="font-weight:bold; margin-bottom:6px; font-size:13px;">${d.name}</div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
                            <span style="color:#888">${leagueA}:</span> 
                            <strong>${d.a.strictness_index.toFixed(2)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:11px;">
                            <span style="color:#888">${leagueB}:</span> 
                            <strong>${d.b.strictness_index.toFixed(2)}</strong>
                        </div>
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
                d3.select(event.currentTarget)
                    .transition().duration(150)
                    .attr('r', 6)
                    .attr('fill', '#2196f3');
                if (tooltipRef.current) tooltip.style('visibility', 'hidden');
            });

    }, [data, leagueA, leagueB, dimensions]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg ref={svgRef} width="100%" height="100%" />
            <div ref={tooltipRef} style={{
                position: 'absolute',
                visibility: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                color: '#333',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '12px',
                pointerEvents: 'none',
                zIndex: 20,
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #eee'
            }} />
        </div>
    );
};

export default TwoLeagueScatter;