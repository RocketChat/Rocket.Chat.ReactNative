import { type ReactElement } from 'react';
import { Linking } from 'react-native';

import { useTheme } from '../../../theme';
import Button from '../../../containers/Button';
import I18n from '../../../i18n';
import { LEARN_MORE_E2EE_URL } from '../../../lib/encryption/constants';
import { RoomPlaceholder } from './RoomPlaceholder';

export const MissingRoomE2EEKey = (): ReactElement => {
	const { colors } = useTheme();
	return (
		<RoomPlaceholder icon='clock' title={I18n.t('missing_room_e2ee_title')} description={I18n.t('missing_room_e2ee_description')}>
			<Button
				title={I18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.surfaceTint}
				onPress={() => Linking.openURL(LEARN_MORE_E2EE_URL)}
			/>
		</RoomPlaceholder>
	);
};
