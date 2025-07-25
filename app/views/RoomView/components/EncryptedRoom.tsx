import React, { ReactElement } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChatsStackParamList } from '../../../stacks/types';
import { useTheme } from '../../../theme';
import { CustomIcon } from '../../../containers/CustomIcon';
import Button from '../../../containers/Button';
import sharedStyles from '../../Styles';
import { useAppSelector } from '../../../lib/hooks';
import { LEARN_MORE_E2EE_URL } from '../../../lib/encryption';
import I18n from '../../../i18n';
import { TNavigation } from '../../../stacks/stackType';

const GAP = 32;

export const EncryptedRoom = ({
	roomName,
	navigation
}: {
	roomName: string;
	navigation: NativeStackNavigationProp<ChatsStackParamList & TNavigation, 'RoomView'>;
}): ReactElement => {
	const { colors } = useTheme();
	const styles = useStyle();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const navigate = () => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'E2EEnterYourPasswordView' });
		} else {
			navigation.navigate('E2EEnterYourPasswordStackNavigator', { screen: 'E2EEnterYourPasswordView' });
		}
	};

	return (
		<View style={styles.root} testID='room-view-encrypted-room'>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={styles.icon}>
						<CustomIcon name='encrypted' size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={styles.title}>{I18n.t('encrypted_room_title', { room_name: roomName.slice(0, 30) })}</Text>
					<Text style={styles.description}>{I18n.t('encrypted_room_description')}</Text>
				</View>
				<Button title={I18n.t('Enter_E2EE_Password')} onPress={navigate} />
				<Button
					title={I18n.t('Learn_more')}
					type='secondary'
					backgroundColor={colors.surfaceTint}
					onPress={() => Linking.openURL(LEARN_MORE_E2EE_URL)}
				/>
			</View>
		</View>
	);
};

const useStyle = () => {
	const { colors } = useTheme();
	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.surfaceRoom
		},
		container: {
			flex: 1,
			marginHorizontal: 24,
			justifyContent: 'center'
		},
		textView: { alignItems: 'center' },
		icon: {
			width: 58,
			height: 58,
			borderRadius: 30,
			marginBottom: GAP,
			backgroundColor: colors.surfaceNeutral,
			alignItems: 'center',
			justifyContent: 'center'
		},
		title: {
			...sharedStyles.textBold,
			fontSize: 24,
			lineHeight: 32,
			textAlign: 'center',
			color: colors.fontTitlesLabels,
			marginBottom: GAP
		},
		description: {
			...sharedStyles.textRegular,
			fontSize: 16,
			lineHeight: 24,
			textAlign: 'center',
			color: colors.fontDefault,
			marginBottom: GAP
		}
	});
	return styles;
};
