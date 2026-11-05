import { memo, type ReactElement } from 'react';
import { PixelRatio, Text, View, type ViewStyle } from 'react-native';

import Touch from '../Touch';
import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import styles from './styles';
import { useTheme } from '~/theme';
import { MarkdownPreview } from '../markdown';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { showToast } from '~/lib/methods/helpers/showToast';
import { getAccessibilityLabel } from './getAccessibilityLabel';

export const ROW_HEIGHT = 54;
interface IDirectoryItemLabel {
	text?: string;
	color: string;
}

export interface IDirectoryItem {
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
	disabledReason?: string;
}

const DirectoryItemLabel = memo(({ text, color }: IDirectoryItemLabel) => {
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
	teamMain,
	disabledReason
}: IDirectoryItem): ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const height = PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);

	return (
		<View
			testID={testID}
			accessible
			accessibilityLabel={getAccessibilityLabel({ title, rightLabel, disabledReason })}
			accessibilityState={{ disabled: !!disabledReason }}
			importantForAccessibility='yes'>
			<Touch
				onPress={disabledReason ? () => showToast(disabledReason) : onPress}
				style={{ backgroundColor: colors.surfaceRoom }}
				testID={testID}>
				<View style={[styles.directoryItemContainer, { height }, !!disabledReason && styles.disabled, style]}>
					<Avatar accessible={false} text={avatar} size={30} type={type} rid={rid} style={styles.directoryItemAvatar} />
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
