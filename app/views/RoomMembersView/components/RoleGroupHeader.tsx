import { StyleSheet, Text, View } from 'react-native';

import { SECONDARY_LABEL } from '~/containers/List/constants';
import nativeListStyles from '~/containers/List/native/styles';
import I18n from '~/i18n';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { type TMemberRoleGroup } from '~/lib/methods/helpers/groupMembersByRole';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';

const ROLE_GROUP_TITLES: Record<TMemberRoleGroup, string> = {
	owner: 'Owners',
	leader: 'Leaders',
	moderator: 'Moderators',
	member: 'Members'
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	text: {
		fontSize: 14,
		...sharedStyles.textMedium
	}
});

const RoleGroupHeader = ({ group }: { group: TMemberRoleGroup }) => {
	const { theme, colors } = useTheme();
	const title = I18n.t(ROLE_GROUP_TITLES[group]);
	const secondaryLabel = theme === 'light' ? SECONDARY_LABEL.light : SECONDARY_LABEL.dark;
	const containerStyle = hasNativeHeaderBar
		? nativeListStyles.headerRow
		: [styles.container, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.strokeExtraLight }];
	const textStyle = hasNativeHeaderBar
		? [nativeListStyles.header, { color: secondaryLabel }]
		: [styles.text, { color: colors.fontDefault }];

	return (
		<View
			testID={`room-members-view-header-${group}`}
			accessible
			accessibilityRole='header'
			accessibilityLabel={title}
			style={containerStyle}>
			<Text style={textStyle}>{title}</Text>
		</View>
	);
};

export default RoleGroupHeader;
