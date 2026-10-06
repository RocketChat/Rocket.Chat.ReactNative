import { memo } from 'react';

import Avatar from '~/containers/Avatar';
import { CustomIcon } from '~/containers/CustomIcon';
import NativeListRow from '~/containers/NativeListRow';
import { AVATAR_SIZE } from '~/containers/NativeListRow/constants';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { type ICategoryRoom } from '../types';

interface INativeRoomCheckItem {
	room: ICategoryRoom;
	isSelected: boolean;
	onToggle: (room: ICategoryRoom) => void;
	isFirst: boolean;
	isLast: boolean;
}

const NativeRoomCheckItem = ({ room, isSelected, onToggle, isFirst, isLast }: INativeRoomCheckItem) => {
	const { colors } = useTheme();

	return (
		<NativeListRow
			title={room.title}
			onPress={() => onToggle(room)}
			testID={`create-category-room-${room.title}`}
			accessibilityLabel={`${room.title} ${isSelected ? I18n.t('Selected') : I18n.t('Unselected')}`}
			isSelected={isSelected}
			isFirst={isFirst}
			isLast={isLast}
			leading={<Avatar text={room.avatar} type={room.t} rid={room.rid} size={AVATAR_SIZE} />}
			trailing={
				<CustomIcon
					name={isSelected ? 'checkbox-checked' : 'checkbox-unchecked'}
					size={22}
					color={isSelected ? colors.fontHint : colors.strokeLight}
				/>
			}
		/>
	);
};

export default memo(NativeRoomCheckItem);
