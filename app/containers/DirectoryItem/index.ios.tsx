import { type ReactElement } from 'react';
import { Text, type ViewStyle } from 'react-native';

import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import NativeListRow from '../NativeListRow';
import { AVATAR_SIZE } from '../NativeListRow/constants';
import styles from './styles';
import { useTheme } from '~/theme';
import usePreviewFormatText from '~/lib/hooks/usePreviewFormatText';

export { ROW_HEIGHT } from '../NativeListRow/constants';

interface IDirectoryItem {
	title: string;
	description?: string;
	avatar?: string;
	type: string;
	onPress(): void;
	testID: string;
	style?: ViewStyle;
	rightLabel?: string;
	rid?: string;
	teamMain?: boolean;
	isFirst?: boolean;
	isLast?: boolean;
}

const DirectoryItem = ({
	title,
	description,
	avatar,
	onPress,
	testID,
	rightLabel,
	type,
	rid,
	teamMain,
	isFirst,
	isLast
}: IDirectoryItem): ReactElement => {
	const { colors } = useTheme();
	const formattedDescription = usePreviewFormatText(description ?? '');
	return (
		<NativeListRow
			title={title}
			subtitle={formattedDescription || undefined}
			onPress={onPress}
			testID={testID}
			accessibilityLabel={`${title || ''} ${rightLabel || ''}`}
			isFirst={isFirst}
			isLast={isLast}
			leading={<Avatar accessible={false} text={avatar} size={AVATAR_SIZE} type={type} rid={rid} />}
			titleLeading={type !== 'd' ? <RoomTypeIcon type={type} teamMain={teamMain} /> : undefined}
			trailing={
				rightLabel ? (
					<Text style={[styles.directoryItemLabel, { color: colors.fontSecondaryInfo }]}>{rightLabel}</Text>
				) : undefined
			}
		/>
	);
};

export default DirectoryItem;
