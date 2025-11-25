import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import europeGeoJson from './europe.geo.json';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
	data: RefereeData[];
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
	'Wales': 'GB', 'Türkiye': 'TR', 'Scotland': 'GB', 'Ireland': 'IE',
};

const BIVARIATE_COLORS = [
	["#e8e8e8", "#e4acac", "#c85a5a"],
	["#b0d5df", "#ad9ea5", "#985356"],
	["#64acbe", "#627f8c", "#574249"]
];

const GeoMap: React.FC<Props> = ({ data }) => {
	const svgRef = useRef<SVGSVGElement>(null);
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
		if (!data || data.length === 0 || !europeGeoJson) return;
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

		const finalMetrics: Record<string, { avgStrictness: number; count: number }> = {};
		const strictnessValues: number[] = [];
		const countValues: number[] = [];

		Object.keys(statsByISO2).forEach(iso => {
			const avg = statsByISO2[iso].strictnessSum / statsByISO2[iso].refereeCount;
			const count = statsByISO2[iso].refereeCount;

			finalMetrics[iso] = { avgStrictness: avg, count };
			strictnessValues.push(avg);
			countValues.push(count);
		});

		const strictnessScale = d3.scaleQuantile()
			.domain(strictnessValues)
			.range([0, 1, 2]);

		const countScale = d3.scaleQuantile()
			.domain(countValues)
			.range([0, 1, 2]);

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
			.attr('fill', (d: any) => {
				const iso = d.properties.ISO2;
				const metrics = finalMetrics[iso];

				if (!metrics) return '#eee';

				const strictnessIndex = strictnessScale(metrics.avgStrictness);
				const countIndex = countScale(metrics.count);

				return BIVARIATE_COLORS[countIndex][strictnessIndex];
			})
			.attr('stroke', '#333')
			.attr('stroke-width', 0.5)
			.on('mouseover', function(_, d: any) {
				d3.select(this).attr('stroke-width', 1.5).attr('stroke', '#000');

				const iso = d.properties.ISO2;
				const metrics = finalMetrics[iso];
				const name = d.properties.NAME || d.properties.name || iso;

				if (metrics) {
					tooltip.html(`
                        <div style="font-weight:bold; margin-bottom:4px;">${name}</div>
                        <div>Strictness: <strong>${metrics.avgStrictness.toFixed(2)}</strong></div>
                        <div style="font-size:0.9em; opacity:0.8;">Referees: ${metrics.count}</div>
                    `).style('visibility', 'visible');
				} else {
					tooltip.html(`<strong>${name}</strong><br/>No Data`).style('visibility', 'visible');
				}
			})
			.on('mousemove', function(event: any) {
				const [mouseX, mouseY] = d3.pointer(event, container.node());
				tooltip.style('left', `${mouseX + 12}px`).style('top', `${mouseY + 12}px`);
			})
			.on('mouseout', function() {
				d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#333');
				tooltip.style('visibility', 'hidden');
			});

		const legendSize = 80;
		const boxSize = legendSize / 3;
		const legendPadding = 20;

		const legendG = svg.append("g")
			.attr("transform", `translate(${legendPadding}, ${height - legendSize - legendPadding - 20})`);

		BIVARIATE_COLORS.forEach((row, y) => {
			row.forEach((color, x) => {
				legendG.append("rect")
					.attr("x", x * boxSize)
					.attr("y", (2 - y) * boxSize)
					.attr("width", boxSize)
					.attr("height", boxSize)
					.attr("fill", color);
			});
		});

		const axisColor = "#666";
		const fontSize = 9;

		legendG.append("text")
			.attr("x", legendSize + 5)
			.attr("y", legendSize)
			.text("Strictness ->")
			.attr("font-size", fontSize)
			.attr("fill", axisColor)
			.attr("alignment-baseline", "middle");

		legendG.append("text")
			.attr("x", 0)
			.attr("y", -5)
			.text("Referees ^")
			.attr("font-size", fontSize)
			.attr("fill", axisColor);

		return () => {
			tooltip.remove();
		};
	}, [data, dimensions]);

	return (
		<div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
			<svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
			<div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '10px', color: '#888', pointerEvents: 'none' }}>
				Bivariate: Color = Strictness + Appearances
			</div>
		</div>
	);
};

export default GeoMap;