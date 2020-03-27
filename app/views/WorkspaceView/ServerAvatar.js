import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import FastImage from 'react-native-fast-image';

import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import { isTablet } from '../../utils/deviceInfo';

const ImageProgress = createImageProgress(FastImage);

const SIZE = 96;
const MARGIN_TOP = isTablet ? 0 : 64;
const BORDER_RADIUS = 6;

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
		width: '100%',
		height: SIZE + MARGIN_TOP,
		justifyContent: 'flex-end',
		alignItems: 'center'
	},
	image: {
		width: SIZE,
		height: SIZE,
		borderRadius: BORDER_RADIUS
	},
	fallback: {
		width: SIZE,
		height: SIZE,
		borderRadius: BORDER_RADIUS,
		alignItems: 'center',
		justifyContent: 'center'
	},
	initial: {
		...sharedStyles.textBold,
		fontSize: 42
	}
});

const getInitial = url => url && url.replace(/http(s?):\/\//, '').slice(0, 1);

const Fallback = ({ theme, initial }) => (
	<View style={[styles.container, styles.fallback, { backgroundColor: themes[theme].dangerColor }]}>
		<Text style={[styles.initial, { color: themes[theme].buttonText }]}>{initial}</Text>
	</View>
);

const ServerAvatar = React.memo(({ theme, url, image }) => (
	<View style={styles.container}>
		{image && (
			<ImageProgress
				style={[styles.image, { borderColor: themes[theme].borderColor }]}
				source={{ uri: `${ url }/${ image }` }}
				resizeMode={FastImage.resizeMode.cover}
				indicator={Progress.Pie}
				indicatorProps={{
					color: themes[theme].actionTintColor
				}}
				renderError={() => <Fallback theme={theme} initial={getInitial(url)} />}
			/>
		)}
	</View>
));

ServerAvatar.propTypes = {
	theme: PropTypes.string,
	url: PropTypes.string,
	image: PropTypes.string
};
ServerAvatar.displayName = 'ServerAvatar';

Fallback.propTypes = {
	theme: PropTypes.string,
	initial: PropTypes.string
};

export default ServerAvatar;
