import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';
import { COLOR_TEXT } from '../../constants/colors';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

const Button = React.memo(({
	onPress, title, subTitle, showActionIndicator, disable
}) => (
	<RectButton
		onPress={onPress}
		activeOpacity={0.1}
		underlayColor={COLOR_TEXT}
		enabled={!disable}
		style={styles.rectButton}
	>
		<View style={[styles.sectionItem, disable && styles.sectionItemDisabled]}>
			<View>
				<Text style={styles.sectionItemTitle}>{title}</Text>
				{subTitle
					? <Text style={styles.sectionItemSubTitle}>{subTitle}</Text>
					: null
				}
			</View>
			{showActionIndicator ? <DisclosureIndicator /> : null}
		</View>
	</RectButton>

));

Button.propTypes = {
	onPress: PropTypes.func,
	title: PropTypes.string.isRequired,
	subTitle: PropTypes.string,
	showActionIndicator: PropTypes.bool,
	disable: PropTypes.bool
};

Button.defaultProps = {
	onPress: () => {},
	disable: false
};
export default Button;
