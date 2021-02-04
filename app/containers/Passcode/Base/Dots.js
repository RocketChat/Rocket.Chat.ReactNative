import React from 'react';
import { View } from 'react-native';
import range from 'lodash/range';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';

const SIZE_EMPTY = 12;
const SIZE_FULL = 16;

const Dots = React.memo(({ passcode, theme, length }) => (
	<View style={styles.dotsContainer}>
		{range(length).map((val) => {
			const lengthSup = (passcode.length >= val + 1);
			const height = lengthSup ? SIZE_FULL : SIZE_EMPTY;
			const width = lengthSup ? SIZE_FULL : SIZE_EMPTY;
			let backgroundColor = '';
			if (lengthSup && passcode.length > 0) {
				backgroundColor = themes[theme].passcodeDotFull;
			} else {
				backgroundColor = themes[theme].passcodeDotEmpty;
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
));

Dots.propTypes = {
	passcode: PropTypes.string,
	theme: PropTypes.string,
	length: PropTypes.string
};

export default Dots;
