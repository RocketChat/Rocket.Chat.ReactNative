import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppActionButtons } from '../../../lib/hooks/useAppActionButtons';
import * as List from '../../../containers/List';
import { ISubscription, UIActionButtonContext } from '../../../definitions';
import { ChatsStackParamList } from '../../../stacks/types';

type AIAppActionButtonsProps = {
	room: ISubscription;
};

type TNavigation = NativeStackNavigationProp<ChatsStackParamList>;

const AIAppActionButtons = ({ room }: AIAppActionButtonsProps) => {
	const appActionButtons = useAppActionButtons(room, UIActionButtonContext.ROOM_ACTION, 'ai');

	const navigation = useNavigation<TNavigation>();

	if (!appActionButtons.length) {
		return null;
	}

	return (
		<List.Section>
			<List.Separator />
			<List.Item
				title={'AI_actions'}
				onPress={() => navigation.navigate('AIAppActionsView', { aiAppActionButtons: appActionButtons, rid: room.rid })}
				testID='room-actions-call'
				left={() => <List.Icon name='stars' />}
				showActionIndicator
			/>
		</List.Section>
	);
};

export default AIAppActionButtons;
