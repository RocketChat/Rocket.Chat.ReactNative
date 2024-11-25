import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { useAppActionButtons } from '../../../lib/hooks/useAppActionButtons';
import * as List from '../../../containers/List';
import { ISubscription, UIActionButtonContext } from '../../../definitions';
import { ChatsStackParamList } from '../../../stacks/types';
import { useAppSelector } from '../../../lib/hooks';

type AIAppActionButtonsProps = {
	room: ISubscription;
};

type TNavigation = NativeStackNavigationProp<ChatsStackParamList>;

const AIAppActionButtons = ({ room }: AIAppActionButtonsProps) => {
	const appActionButtons = useAppActionButtons(room, UIActionButtonContext.ROOM_ACTION);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const navigation = useNavigation<TNavigation>();

	const onPress = useCallback(() => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'AIAppActionsView',
				params: { aiAppActionButtons: appActionButtons, rid: room.rid }
			});
			return;
		}

		navigation.navigate('AIAppActionsView', { aiAppActionButtons: appActionButtons, rid: room.rid });
	}, [room.rid, appActionButtons, navigation, isMasterDetail]);

	if (!appActionButtons.length) {
		return null;
	}

	return (
		<List.Section>
			<List.Separator />
			<List.Item title={'AI_actions'} onPress={onPress} left={() => <List.Icon name='stars' />} showActionIndicator />
		</List.Section>
	);
};

export default AIAppActionButtons;
