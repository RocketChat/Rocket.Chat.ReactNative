import { type ReactElement } from 'react';
import { Text } from 'react-native';

import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import NativeListRow from '../NativeListRow';
import { AVATAR_SIZE } from '../NativeListRow/constants';
import styles from './styles';
import { useTheme } from '~/theme';
import usePreviewFormatText from '~/lib/hooks/usePreviewFormatText';
import { type IDirectoryItem } from './index';
import { getAccessibilityLabel } from './getAccessibilityLabel';

export { ROW_HEIGHT } from '../NativeListRow/constants';

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
	isLast,
	disabledReason
}: IDirectoryItem): ReactElement => {
	const { colors } = useTheme();
	const formattedDescription = usePreviewFormatText(description ?? '');
	return (
		<NativeListRow
			title={title}
			subtitle={formattedDescription || undefined}
			onPress={onPress}
			testID={testID}
			accessibilityLabel={getAccessibilityLabel({ title, rightLabel, disabledReason })}
			isFirst={isFirst}
			isLast={isLast}
			disabled={!!disabledReason}
			disabledReason={disabledReason}
			leading={<Avatar accessible={false} text={avatar} size={AVATAR_SIZE} type={type} rid={rid} />}
			titleLeading={type !== 'd' ? <RoomTypeIcon type={type} teamMain={teamMain} style={styles.titleIcon} /> : undefined}
			trailing={
				rightLabel ? (
					<Text style={[styles.directoryItemLabel, styles.nativeRowLabel, { color: colors.fontSecondaryInfo }]}>
						{rightLabel}
					</Text>
				) : undefined
			}
		/>
	);
};

export default DirectoryItem;
