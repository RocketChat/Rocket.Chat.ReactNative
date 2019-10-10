import React from 'react';
import { View, Text, Image } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import styles from '../styles';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import Check from '../../../containers/Check';
import { themes } from '../../../constants/colors';


export const SortItemButton = ({ children, onPress, theme }) => (
	<RectButton
		style={styles.sortItemButton}
		onPress={onPress}
		activeOpacity={1}
		underlayColor={themes[theme].bannerBackground}
	>
		{children}
	</RectButton>
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
		{checked ? <Check /> : null}
	</View>
);

SortItemContent.propTypes = {
	theme: PropTypes.string,
	label: PropTypes.string,
	icon: PropTypes.string,
	imageUri: PropTypes.string,
	checked: PropTypes.bool
};
