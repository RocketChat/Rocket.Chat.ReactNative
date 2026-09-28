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

const DirectoryRow = ({ item, type, isFirst, isLast, onPressItem }: IDirectoryRow) => {
	const { colors } = useTheme();
	const title = item.name as string;
	const onPress = () => onPressItem(item);
	const testID = `directory-view-item-${item.name}`;
	const style = isLast ? { ...sharedStyles.separatorBottom, borderColor: colors.strokeLight } : undefined;

	if (type === 'users') {
		return (
			<DirectoryItem
				title={title}
				onPress={onPress}
				testID={testID}
				style={style}
				rid={item._id}
				isFirst={isFirst}
				isLast={isLast}
				avatar={item.username}
				description={item.username}
				rightLabel={item.federation && item.federation.peer}
				type='d'
			/>
		);
	}

	if (type === 'teams') {
		return (
			<DirectoryItem
				title={title}
				onPress={onPress}
				testID={testID}
				style={style}
				rid={item._id}
				isFirst={isFirst}
				isLast={isLast}
				avatar={item.name}
				description={item.name}
				rightLabel={I18n.t('N_channels', { n: item.roomsCount })}
				type={item.t}
				teamMain={item.teamMain}
			/>
		);
	}

	return (
		<DirectoryItem
			title={title}
			onPress={onPress}
			testID={testID}
			style={style}
			rid={item._id}
			isFirst={isFirst}
			isLast={isLast}
			avatar={item.name}
			description={item.topic}
			rightLabel={I18n.t('N_users', { n: item.usersCount })}
			type={item.t}
		/>
	);
};

export default memo(DirectoryRow);
