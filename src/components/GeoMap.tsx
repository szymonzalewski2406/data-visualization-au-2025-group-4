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

		const maxValue = d3.max(data, d => d.strictness_index) || 1;
		const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxValue]);

		const valueByISO2: Record<string, number> = {};
		data.forEach(d => {
			const iso2 = nationalityToISO2[d.nationality] || d.nationality;
			valueByISO2[iso2] = d.strictness_index;
		});

		svg.append('g')
			.selectAll('path')
			.data((europeGeoJson as any).features)
			.enter()
			.append('path')
			.attr('d', path as any)
			.attr('fill', (d: any) => {
				const val = valueByISO2[d.properties.ISO2];
				return val ? color(val) : '#eee';
			})
			.attr('stroke', '#333')
			.attr('stroke-width', 0.5);
	}, [data, dimensions]);
	    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default GeoMap;
