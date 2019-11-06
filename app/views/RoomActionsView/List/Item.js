import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import DisclosureIndicator from '../../../containers/DisclosureIndicator';
import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';

import { COLOR_WHITE } from '../../../constants/colors';
import styles from './styles';

const Item = ({
	icon, name, description, type, onPress, testID, disabled
}) => {
	const Content = () => {
		if (type === 'danger') {
			return (
				<>
					<CustomIcon name={icon} size={24} style={[styles.sectionItemIcon, styles.textColorDanger]} />
					<Text style={[styles.sectionItemName, styles.textColorDanger]}>{ name }</Text>
				</>
			);
		}

		return (
			<>
				<CustomIcon name={icon} size={24} style={styles.sectionItemIcon} />
				<Text style={styles.sectionItemName}>{ name }</Text>
				{description ? <Text style={styles.sectionItemDescription}>{ description }</Text> : null}
				<DisclosureIndicator />
			</>
		);
	};

	return (
		<Touch
			onPress={onPress}
			underlayColor={COLOR_WHITE}
			activeOpacity={0.5}
			accessibilityLabel={name}
			accessibilityTraits='button'
			testID={testID}
		>
			<View style={[styles.sectionItem, disabled && styles.sectionItemDisabled]}>
				<Content />
			</View>
		</Touch>
	);
};

Item.propTypes = {
	icon: PropTypes.string,
	name: PropTypes.string,
	description: PropTypes.string,
	type: PropTypes.string,
	onPress: PropTypes.func,
	testID: PropTypes.string,
	disabled: PropTypes.bool
};

Item.defaultProps = {
	description: null,
	type: null,
	onPress: () => {},
	disabled: false
};

export default Item;
