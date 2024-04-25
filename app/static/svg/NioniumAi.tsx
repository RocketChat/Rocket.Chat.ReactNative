import * as React from 'react';
import Svg, { SvgProps, Circle, Path } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
	<Svg width={60} height={60} fill='none' viewBox='0 0 105 105' {...props}>
		<Circle cx={52.5} cy={52.5} r={52.5} fill='#41FF8B' />
		<Path
			fill='#000'
			fillRule='evenodd'
			d='M52.201 31.053h.002c16.144 0 29.218 0 29.218 15.653v27.316H68.347v-13.75l.123-10.436c0-8.415-6.44-8.388-14.644-8.353a346.687 346.687 0 0 1-3.377-.001c-8.128-.041-14.39-.073-14.39 8.354v24.186H22.982V46.706c0-15.653 13.075-15.653 29.218-15.653Z'
			clipRule='evenodd'
		/>
	</Svg>
);
export default SvgComponent;
