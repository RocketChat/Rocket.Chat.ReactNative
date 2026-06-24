import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../../views/Styles';
import { useTheme } from '../../../../theme';

const MAX_HEIGHT = 216;

const styles = StyleSheet.create(theme => ({
	root: {
		maxHeight: MAX_HEIGHT,
		backgroundColor: theme.colors.surfaceNeutral,
		position: 'absolute',
		borderRadius: 4,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.5,
		shadowRadius: 2,
		elevation: 4
	},
	listContentContainer: {
		borderRadius: 4,
		overflow: 'hidden'
	},
	list: { margin: 8 },
	item: {
		minHeight: 48,
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 6,
		alignItems: 'center'
	},
	slashItem: { flex: 1, justifyContent: 'center' },
	slashTitle: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	slashTitleText: { ...sharedStyles.textBold, fontSize: 14, color: theme.colors.fontDefault },
	slashSubtitle: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
	slashSubtitleText: { ...sharedStyles.textRegular, fontSize: 14, color: theme.colors.fontSecondaryInfo, flex: 1 },
	previewItem: { backgroundColor: theme.colors.surfaceLight, paddingRight: 4 },
	previewImage: { height: 80, minWidth: 80, borderRadius: 4 },
	emoji: { flex: 1, justifyContent: 'center', paddingLeft: 12 },
	emojiTitle: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	emojiText: { ...sharedStyles.textBold, fontSize: 14, color: theme.colors.fontDefault },
	canned: { flex: 1, justifyContent: 'center' },
	cannedTitle: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	cannedTitleText: { ...sharedStyles.textRegular, flex: 1, fontSize: 14, color: theme.colors.fontHint },
	cannedSubtitle: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
	cannedSubtitleText: { ...sharedStyles.textRegular, fontSize: 14, color: theme.colors.fontSecondaryInfo, flex: 1 },
	userRoomContainer: { flex: 1, justifyContent: 'center', flexDirection: 'row' },
	userRoom: { flex: 1, justifyContent: 'center' },
	userRoomHeader: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	userRoomTitleText: { ...sharedStyles.textBold, fontSize: 14, color: theme.colors.fontDefault },
	userRoomSubtitle: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
	userRoomSubtitleText: { ...sharedStyles.textRegular, fontSize: 14, color: theme.colors.fontSecondaryInfo, flex: 1 },
	userRoomOutsideText: { ...sharedStyles.textRegular, fontSize: 12, color: theme.colors.fontSecondaryInfo }
}));

export const useStyle = () => {
	'use memo';

	const { colors } = useTheme();
	return [styles, colors] as const;
};
