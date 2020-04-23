import React from 'react';
import { View } from 'react-native';
import _ from 'lodash';

import styles from './styles';
import { themes } from '../../../constants/colors';

const SIZE_EMPTY = 8;
const SIZE_FULL = 12;

const Dots = ({
	passcode,
	showError,
	changeScreen,
	attemptFailed,
	theme,
	length
}) => (
	<View style={[styles.topViewCirclePasscode]}>
		{_.range(length).map((val) => {
			const lengthSup = ((passcode.length >= val + 1 && !changeScreen) || showError) && !attemptFailed;
			const opacity = lengthSup ? 1 : 0.5;
			const height = lengthSup ? SIZE_FULL : SIZE_EMPTY;
			const width = lengthSup ? SIZE_FULL : SIZE_EMPTY;
			let color = '';
			if (showError) {
				color = themes[theme].dangerColor;
			} else if (lengthSup && passcode.length > 0) {
				color = themes[theme].titleText;
			} else {
				color = themes[theme].bodyText;
			}
			const borderRadius = lengthSup
				? SIZE_FULL / 2
				: SIZE_EMPTY / 2;
			const marginRight = lengthSup
				? 10 - (SIZE_FULL - SIZE_EMPTY) / 2
				: 10;
			const marginLeft = lengthSup
				? 10 - (SIZE_FULL - SIZE_EMPTY) / 2
				: 10;
			return (
				<View style={styles.viewCircles}>
					<View
						style={[{
							opacity,
							height,
							width,
							borderRadius,
							backgroundColor: color,
							marginRight,
							marginLeft
						}]}
					/>
				</View>
			);
		})}
	</View>
);

export default Dots;
