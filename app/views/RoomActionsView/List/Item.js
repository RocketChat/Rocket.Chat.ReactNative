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
	const renderItem = () => {
		if (type === 'danger') {
			return (
				<>
					<CustomIcon key='icon' name={icon} size={24} style={[styles.sectionItemIcon, styles.textColorDanger]} />
					<Text key='name' style={[styles.sectionItemName, styles.textColorDanger]}>{ name }</Text>
				</>
			);
		}

		return (
			<>
				<CustomIcon key='left-icon' name={icon} size={24} style={styles.sectionItemIcon} />
				<Text key='name' style={styles.sectionItemName}>{ name }</Text>
				{description ? <Text key='description' style={styles.sectionItemDescription}>{ description }</Text> : null}
				<DisclosureIndicator key='disclosure-indicator' />
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
				{renderItem()}
			</View>
		</Touch>
	);
};

Item.propTypes = {
	icon: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.string,
	type: PropTypes.string,
	onPress: PropTypes.func,
	testID: PropTypes.string.isRequired,
	disabled: PropTypes.bool,
	navigation: PropTypes.shape({
		navigate: PropTypes.func
	}).isRequired
};

Item.defaultProps = {
	description: null,
	type: null,
	onPress: () => {},
	disabled: false
};

export default Item;
