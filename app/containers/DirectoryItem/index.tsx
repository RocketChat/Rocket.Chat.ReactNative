import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import Touch from '../Touch';
import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import styles from './styles';
import { useTheme } from '../../theme';
import { MarkdownPreview } from '../markdown';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

export const ROW_HEIGHT = 54;
interface IDirectoryItemLabel {
	text?: string;
	color: string;
}

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
}

const DirectoryItemLabel = React.memo(({ text, color }: IDirectoryItemLabel) => {
	if (!text) {
		return null;
	}
	return <Text style={[styles.directoryItemLabel, { color }]}>{text}</Text>;
});

const DirectoryItem = ({
	title,
	description,
	avatar,
	onPress,
	testID,
	style,
	rightLabel,
	type,
	rid,
	teamMain
}: IDirectoryItem): React.ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const height = ROW_HEIGHT * fontScale;

	return (
		<View accessible accessibilityLabel={`${title} ${rightLabel}`}>
			<Touch onPress={onPress} style={{ backgroundColor: colors.surfaceRoom }} testID={testID}>
				<View style={[styles.directoryItemContainer, { height }, style]}>
					<Avatar text={avatar} size={30} type={type} rid={rid} style={styles.directoryItemAvatar} />
					<View style={styles.directoryItemTextContainer}>
						<View style={styles.directoryItemTextTitle}>
							{type !== 'd' ? <RoomTypeIcon type={type} teamMain={teamMain} /> : null}
							<Text style={[styles.directoryItemName, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
								{title}
							</Text>
						</View>
						{description ? (
							<MarkdownPreview
								msg={description}
								style={[styles.directoryItemUsername, { color: colors.fontSecondaryInfo }]}
								numberOfLines={1}
							/>
						) : null}
					</View>
					<DirectoryItemLabel text={rightLabel} color={colors.fontSecondaryInfo} />
				</View>
			</Touch>
		</View>
	);
};

export default DirectoryItem;
