/* eslint-disable react/prop-types */
import React from 'react';
import { Text } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { LISTENER } from '../../../../containers/Toast';
import EventEmitter from '../../../../utils/events';
import I18n from '../../../../i18n';
import styles from '../styles';
import { CustomIcon } from '../../../../lib/Icons';
import { withTheme } from '../../../../theme';
import { themes } from '../../../../constants/colors';

const renderButton = ({
	onPress, iconName, text, isDirect, createDirect, theme
}) => {
	const onActionPress = async() => {
		try {
			if (isDirect) {
				await createDirect();
			}
			onPress();
		} catch {
			EventEmitter.emit(LISTENER, { message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') }) });
		}
	};

	return (
		<BorderlessButton
			onPress={onActionPress}
			style={styles.roomButton}
		>
			<CustomIcon
				name={iconName}
				size={30}
				color={themes[theme].actionTintColor}
			/>
			<Text style={[styles.roomButtonText, { color: themes[theme].actionTintColor }]}>{text}</Text>
		</BorderlessButton>
	);
};

export default withTheme(renderButton);
