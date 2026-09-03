import { type ReactElement } from 'react';

import Button from '../../../containers/Button';
import I18n from '../../../i18n';
import { type IRoomViewProps } from '../definitions';
import { RoomPlaceholder } from './RoomPlaceholder';

export const RoomRouteInvalid = ({ navigation }: Pick<IRoomViewProps, 'navigation'>): ReactElement => (
	<RoomPlaceholder icon='warning' title={I18n.t('Oops')} description={I18n.t('Room_not_found')} testID='room-route-invalid'>
		<Button title={I18n.t('Back')} type='primary' onPress={() => navigation.goBack()} testID='room-route-invalid-back' />
	</RoomPlaceholder>
);
