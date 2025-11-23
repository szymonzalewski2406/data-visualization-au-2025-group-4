import React, { useRef, useEffect, useState} from 'react';
import * as d3 from 'd3';
import europeGeoJson from './europe.geo.json';
import { RefereeData } from '../interfaces/RefereeData';

interface Props {
	data: RefereeData[];
}

const nationalityToISO2: Record<string, string> = {
	'England': 'GB',
	'France': 'FR',
	'Germany': 'DE',
	'Italy': 'IT',
	'Spain': 'ES',
	'Poland': 'PL',
	'Portugal': 'PT',
	'Netherlands': 'NL',
	'Switzerland': 'CH',
	'Belgium': 'BE',
	'Austria': 'AT',
	'Sweden': 'SE',
	'Norway': 'NO',
	'Denmark': 'DK',
	'Finland': 'FI',
	'Lithuania': 'LT',
	'Latvia': 'LV',
	'Estonia': 'EE',
	'Slovakia': 'SK',
	'Slovenia': 'SI',
	'Czech Republic': 'CZ',
	'Hungary': 'HU',
	'Romania': 'RO',
	'Bulgaria': 'BG',
	'Serbia': 'RS',
	'Croatia': 'HR',
	'Bosnia-Herzegovina': 'BA',
	'Montenegro': 'ME',
	'Georgia': 'GE',
	'Armenia': 'AM',
	'Azerbaijan': 'AZ',
	'Turkey': 'TR',
	'Greece': 'GR',
	'Ukraine': 'UA',
	'Russia': 'RU',
	'Israel': 'IL',
	'Albania': 'AL',
	'Belarus': 'BY',
	'Cyprus': 'CY',
	"Faroe Islands": 'FO',
	'Iceland': 'IS',
	'Moldova': 'MD',
	'North Macedonia': 'MK',
	'San Marino': 'SM',
	'Wales': 'GB',
	'Türkiye': 'TR',
	'Scotland': 'GB',
	'Ireland': 'IE',
	// Add more as needed
};

const GeoMap: React.FC<Props> = ({ data}) => {
	const svgRef = useRef<SVGSVGElement>(null);
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

	useEffect(() => {
		if (!data || data.length === 0 || !europeGeoJson) return;
		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove();
		const { width, height } = dimensions;


		const projection = d3.geoMercator().fitSize([width, height], europeGeoJson as any);
		const path = d3.geoPath().projection(projection);

		// Compute average strictness per ISO2 (support multiple referees per country)
		const sumByISO2: Record<string, number> = {};
		const countByISO2: Record<string, number> = {};
		data.forEach(d => {
			const iso2 = nationalityToISO2[d.nationality] || d.nationality;
			sumByISO2[iso2] = (sumByISO2[iso2] || 0) + (d.strictness_index ?? 0);
			countByISO2[iso2] = (countByISO2[iso2] || 0) + 1;
		});

		const avgByISO2: Record<string, number> = {};
		Object.keys(sumByISO2).forEach(k => {
			avgByISO2[k] = sumByISO2[k] / countByISO2[k];
		});

		const maxValue = d3.max(Object.values(avgByISO2)) || 1;
		const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxValue]);

		// Tooltip: appended to the container so it overlays the svg and can be positioned
		const container = d3.select(containerRef.current as any);
		const tooltip = container.append('div')
			.attr('class', 'geo-tooltip')
			.style('position', 'absolute')
			.style('pointer-events', 'none')
			.style('background', 'rgba(30, 30, 30, 0.95)')
			.style('color', '#fff')
			.style('padding', '6px 8px')
			.style('border-radius', '4px')
			.style('font-size', '12px')
			.style('visibility', 'hidden');

		svg.append('g')
			.selectAll('path')
			.data((europeGeoJson as any).features)
			.enter()
			.append('path')
			.attr('d', path as any)
			.attr('fill', (d: any) => {
				const val = avgByISO2[d.properties.ISO2];
				return val != null ? color(val) : '#eee';
			})
			.attr('stroke', '#333')
			.attr('stroke-width', 0.5)
			.on('mouseover', function(_, d: any) {
				// highlight
				d3.select(this).attr('stroke-width', 1.5);
				const iso = d.properties.ISO2;
				const avg = avgByISO2[iso];
				const count = countByISO2[iso] || 0;
				const name = d.properties.NAME || d.properties.name || iso;
				tooltip.html(`<strong>${name}</strong><br/>Average strictness: ${avg != null ? avg.toFixed(2) : 'N/A'}${count ? ` (${count} refs)` : ''}`)
					.style('visibility', 'visible');
			})
			.on('mousemove', function(event: any) {
				// position relative to container
				const [mouseX, mouseY] = d3.pointer(event, container.node());
				tooltip.style('left', `${mouseX + 12}px`).style('top', `${mouseY + 12}px`);
			})
			.on('mouseout', function() {
				d3.select(this).attr('stroke-width', 0.5);
				tooltip.style('visibility', 'hidden');
			});
		return () => {
			tooltip.remove();
		};
	}, [data, dimensions]);
	    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default GeoMap;
