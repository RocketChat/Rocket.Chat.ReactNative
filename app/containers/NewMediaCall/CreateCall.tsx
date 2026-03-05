import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { mediaSessionInstance } from '../../lib/services/voip/MediaSessionInstance';
import { hideActionSheetRef } from '../ActionSheet';
import sharedStyles from '../../views/Styles';

export const CreateCall = () => {
	const { colors } = useTheme();

	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);

	const handleCall = () => {
		if (!selectedPeer) {
			return;
		}

		if ('number' in selectedPeer) {
			mediaSessionInstance.startCall(selectedPeer.value, 'sip');
		} else {
			mediaSessionInstance.startCall(selectedPeer.value, 'user');
		}

		hideActionSheetRef();
	};

	const isCallDisabled = !selectedPeer;

	return (
		<Pressable
			style={[
				styles.callButton,
				{
					backgroundColor: isCallDisabled ? colors.buttonBackgroundSuccessDisabled : colors.buttonBackgroundSuccessDefault
				}
			]}
			disabled={isCallDisabled}
			onPress={handleCall}
			accessibilityRole='button'
			accessibilityLabel={I18n.t('Call')}
			testID='new-media-call-button'
			android_ripple={{ color: colors.buttonBackgroundSuccessPress }}>
			<CustomIcon name='phone' size={24} color={isCallDisabled ? colors.buttonPrimaryDisabled : colors.fontWhite} />
			<Text style={[styles.callText, { color: isCallDisabled ? colors.buttonPrimaryDisabled : colors.fontWhite }]}>
				{I18n.t('Call')}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	callButton: {
		height: 52,
		marginTop: 32,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 4
	},
	callText: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium
	}
});
