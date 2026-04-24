import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderlessButton, RectButton } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import { CustomIcon } from '../../containers/CustomIcon';
import sharedStyles from '../Styles';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { useMediaCallPermission } from '../../lib/hooks/useMediaCallPermission';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { useIsInActiveVoipCall } from '../../lib/services/voip/isInActiveVoipCall';
import { showActionSheetRef } from '../../containers/ActionSheet';
import { NewMediaCall } from '../../containers/NewMediaCall';

interface IItem {
	userId: string;
	name: string;
	username: string;
	onPress(): void;
	testID: string;
	onLongPress?: () => void;
}

const Item = ({ userId, name, username, onPress, testID, onLongPress }: IItem) => {
	const { colors } = useTheme();
	const hasMediaCallPermission = useMediaCallPermission();
	const isInActiveCall = useIsInActiveVoipCall();

	const handleCallPress = () => {
		if (!userId || isInActiveCall) return;
		usePeerAutocompleteStore.getState().setSelectedPeer({ type: 'user', value: userId, label: name, username });
		showActionSheetRef({
			children: <NewMediaCall />,
			portraitSnaps: ['60%'],
			landscapeSnaps: ['90%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	};

	return (
		<RectButton
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			underlayColor={colors.surfaceSelected}
			rippleColor={colors.surfaceSelected}
			style={{ backgroundColor: colors.surfaceLight }}
			accessibilityLabel={name}
			accessibilityRole='button'>
			<View style={[styles.container, styles.button]}>
				<Avatar text={username} size={30} style={styles.avatar} />
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
						{name}
					</Text>
				</View>
				{hasMediaCallPermission ? (
					<BorderlessButton
						onPress={handleCallPress}
						enabled={!isInActiveCall}
						testID={`${testID}-call`}
						rippleColor={colors.surfaceSelected}
						style={styles.iconContainer}
						accessibilityLabel={I18n.t('Voice_call')}
						accessibilityRole='button'
						accessibilityState={{ disabled: isInActiveCall }}>
						<CustomIcon name={'phone'} size={22} color={isInActiveCall ? colors.fontDisabled : colors.fontDefault} />
					</BorderlessButton>
				) : null}
			</View>
		</RectButton>
	);
};

export default Item;

const styles = StyleSheet.create({
	button: {
		height: 54
	},
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 12,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		marginRight: 12
	},
	name: {
		fontSize: 18,
		lineHeight: 26,
		...sharedStyles.textMedium
	},
	iconContainer: {
		paddingHorizontal: 15,
		alignSelf: 'center'
	}
});
