import { type ReactElement } from 'react';
import { useWindowDimensions, View } from 'react-native';

const StatusDot = ({ color }: { color: string }): ReactElement => {
	const { fontScale } = useWindowDimensions();
	const size = 10 * fontScale;
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: color
			}}
		/>
	);
};

export default StatusDot;
