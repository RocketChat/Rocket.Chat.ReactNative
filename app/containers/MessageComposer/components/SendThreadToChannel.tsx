import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Text } from 'react-native';
import React from 'react';

import { useRoomContext } from '../../../views/RoomView/context';
import { useAlsoSendThreadToChannel, useMessageComposerApi } from '../context';
import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';
import I18n from '../../../i18n';

export const SendThreadToChannel = (): React.ReactElement | null => {
	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();
	const { setAlsoSendThreadToChannel } = useMessageComposerApi();
	const { tmid } = useRoomContext();
	const { colors } = useTheme();

	if (!tmid) {
		return null;
	}

	return (
		<TouchableWithoutFeedback
			style={{
				flexDirection: 'row',
				alignItems: 'center'
			}}
			onPress={() => setAlsoSendThreadToChannel(!alsoSendThreadToChannel)}
			testID='composer-send-to-channel'
		>
			<CustomIcon
				testID={alsoSendThreadToChannel ? 'send-to-channel-checked' : 'send-to-channel-unchecked'}
				name={alsoSendThreadToChannel ? 'checkbox-checked' : 'checkbox-unchecked'}
				size={24}
				color={alsoSendThreadToChannel ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundSecondaryDefault}
			/>
			<Text style={{ fontSize: 14, marginLeft: 8, ...sharedStyles.textRegular, color: colors.fontSecondaryInfo }}>
				{I18n.t('Messagebox_Send_to_channel')}
			</Text>
		</TouchableWithoutFeedback>
	);
};
