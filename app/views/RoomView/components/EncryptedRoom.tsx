import { type ReactElement } from 'react';
import { Linking } from 'react-native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type ChatsStackParamList } from '../../../stacks/types';
import { useTheme } from '../../../theme';
import Button from '../../../containers/Button';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { LEARN_MORE_E2EE_URL } from '../../../lib/encryption/constants';
import I18n from '../../../i18n';
import { type TNavigation } from '../../../stacks/stackType';
import { RoomPlaceholder } from './RoomPlaceholder';

export const EncryptedRoom = ({
	roomName,
	navigation
}: {
	roomName: string;
	navigation: NativeStackNavigationProp<ChatsStackParamList & TNavigation, 'RoomView'>;
}): ReactElement => {
	const { colors } = useTheme();
	const isMasterDetail = useMasterDetail();

	const navigate = () => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'E2EEnterYourPasswordView' });
		} else {
			navigation.navigate('E2EEnterYourPasswordStackNavigator', { screen: 'E2EEnterYourPasswordView' });
		}
	};

	return (
		<RoomPlaceholder
			icon='encrypted'
			title={I18n.t('encrypted_room_title', { room_name: roomName.slice(0, 30) })}
			description={I18n.t('encrypted_room_description')}
			testID='room-view-encrypted-room'>
			<Button title={I18n.t('Enter_E2EE_Password')} onPress={navigate} />
			<Button
				title={I18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.surfaceTint}
				onPress={() => Linking.openURL(LEARN_MORE_E2EE_URL)}
			/>
		</RoomPlaceholder>
	);
};
