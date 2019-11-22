import React from 'react';
import { View, Text, Image } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import Touch from '../../../utils/touch';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import Check from '../../../containers/Check';
import { themes } from '../../../constants/colors';


export const SortItemButton = ({ children, onPress, theme }) => (
	<Touch
		style={styles.sortItemButton}
		onPress={onPress}
		theme={theme}
	>
		{children}
	</Touch>
);

SortItemButton.propTypes = {
	theme: PropTypes.string,
	children: PropTypes.node,
	onPress: PropTypes.func
};

export const SortItemContent = ({
	label, icon, imageUri, checked, theme
}) => (
	<View style={styles.sortItemContainer}>
		{icon && <CustomIcon style={[styles.sortIcon, { color: themes[theme].controlText }]} size={22} name={icon} />}
		{imageUri && <Image style={[styles.sortIcon, { tintColor: themes[theme].controlText }]} source={{ uri: imageUri }} />}
		<Text style={[styles.sortItemText, { color: themes[theme].controlText }]}>{I18n.t(label)}</Text>
		{checked ? <Check theme={theme} /> : null}
	</View>
);

SortItemContent.propTypes = {
	theme: PropTypes.string,
	label: PropTypes.string,
	icon: PropTypes.string,
	imageUri: PropTypes.string,
	checked: PropTypes.bool
};
