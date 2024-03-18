import React from 'react';
import { View } from 'react-native';
import range from 'lodash/range';

import styles from './styles';
import { useTheme } from '../../../theme';

const SIZE_EMPTY = 12;
const SIZE_FULL = 16;

interface IPasscodeDots {
	passcode: string;
	length: number;
}

const Dots = React.memo(({ passcode, length }: IPasscodeDots) => {
	const { colors } = useTheme();

	return (
		<View style={styles.dotsContainer}>
			{range(length).map(val => {
				const lengthSup = passcode.length >= val + 1;
				const height = lengthSup ? SIZE_FULL : SIZE_EMPTY;
				const width = lengthSup ? SIZE_FULL : SIZE_EMPTY;
				let backgroundColor = '';
				if (lengthSup && passcode.length > 0) {
					backgroundColor = colors.strokeDark;
				} else {
					backgroundColor = colors.strokeLight;
				}
				const borderRadius = lengthSup ? SIZE_FULL / 2 : SIZE_EMPTY / 2;
				const marginRight = lengthSup ? 10 - (SIZE_FULL - SIZE_EMPTY) / 2 : 10;
				const marginLeft = lengthSup ? 10 - (SIZE_FULL - SIZE_EMPTY) / 2 : 10;
				return (
					<View style={styles.dotsView}>
						<View
							style={{
								height,
								width,
								borderRadius,
								backgroundColor,
								marginRight,
								marginLeft
							}}
						/>
					</View>
				);
			})}
		</View>
	);
});

export default Dots;
