import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity } from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { isAndroid } from '../../utils/deviceInfo';

// For some reason react-native-gesture-handler isn't working on bottom sheet (iOS)
const Button = isAndroid ? TouchableNativeFeedback : TouchableOpacity;

const Item = React.memo(({
	item, hide, theme
}) => {
	const onPress = () => {
		hide();
		item?.onPress();
	};

	return (
		<Button
			onPress={onPress}
			style={[styles.item, { backgroundColor: themes[theme].backgroundColor }]}
			background={TouchableNativeFeedback.Ripple(themes[theme].bannerBackground)}
		>
			<CustomIcon name={item.icon} size={20} color={item.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
			<Text
				numberOfLines={1}
				style={[styles.title, { color: item.danger ? themes[theme].dangerColor : themes[theme].bodyText }]}
			>
				{item.title}
			</Text>
		</Button>
	);
});
Item.propTypes = {
	item: PropTypes.shape({
		title: PropTypes.string,
		icon: PropTypes.string,
		danger: PropTypes.bool,
		onPress: PropTypes.func
	}),
	hide: PropTypes.func,
	theme: PropTypes.string
};

export default Item;
