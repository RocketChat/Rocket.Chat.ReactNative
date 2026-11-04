import { memo } from 'react';

import DirectoryItem from '~/containers/DirectoryItem';
import I18n from '~/i18n';
import { type IServerRoom } from '~/definitions';
import { useTheme } from '~/theme';
import sharedStyles from '../Styles';

interface IDirectoryRow {
	item: IServerRoom;
	type: string;
	isFirst: boolean;
	isLast: boolean;
	onPressItem: (item: IServerRoom) => void;
}

const getRowDetails = (item: IServerRoom, type: string) => {
	if (type === 'users') {
		return { avatar: item.username, description: item.username, rightLabel: item.federation?.peer };
	}
	if (type === 'teams') {
		return { avatar: item.name, description: item.name, rightLabel: I18n.t('N_channels', { n: item.roomsCount }) };
	}
	return { avatar: item.name, description: item.topic, rightLabel: I18n.t('N_users', { n: item.usersCount }) };
};

const DirectoryRow = ({ item, type, isFirst, isLast, onPressItem }: IDirectoryRow) => {
	const { colors } = useTheme();
	const title = item.name as string;
	const onPress = () => onPressItem(item);
	const testID = `directory-view-item-${item.name}`;
	const style = isLast ? { ...sharedStyles.separatorBottom, borderColor: colors.strokeLight } : undefined;

	const { avatar, description, rightLabel } = getRowDetails(item, type);

	return (
		<DirectoryItem
			title={title}
			onPress={onPress}
			testID={testID}
			style={style}
			rid={item._id}
			isFirst={isFirst}
			isLast={isLast}
			avatar={avatar}
			description={description}
			rightLabel={rightLabel}
			type={type === 'users' ? 'd' : item.t}
			teamMain={type === 'teams' ? item.teamMain : undefined}
		/>
	);
};

export default memo(DirectoryRow);
