import { type ReactElement } from 'react';

import Button from '../../../containers/Button';
import I18n from '../../../i18n';
import { RoomPlaceholder } from './RoomPlaceholder';

export const RoomLoadFailed = ({ onRetry }: { onRetry: () => void }): ReactElement => (
	<RoomPlaceholder icon='warning' title={I18n.t('Oops')} description={I18n.t('Room_failed_to_load')} testID='room-load-failed'>
		<Button title={I18n.t('Try_again')} type='primary' onPress={onRetry} testID='room-load-failed-retry' />
	</RoomPlaceholder>
);
