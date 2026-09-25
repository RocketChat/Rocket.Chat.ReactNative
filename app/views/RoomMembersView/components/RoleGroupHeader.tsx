import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	text: {
		fontSize: 14,
		...sharedStyles.textMedium
	}
});

const RoleGroupHeader = ({ group, count }: { group: TMemberRoleGroup; count: number }) => {
	const { colors } = useTheme();
	const title = I18n.t(ROLE_GROUP_TITLES[group]);

	return (
		<View
			testID={`room-members-view-header-${group}`}
			accessible
			accessibilityRole='header'
			accessibilityLabel={`${title}, ${count}`}
			style={[styles.container, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.strokeExtraLight }]}>
			<Text style={[styles.text, { color: colors.fontDefault }]}>{title}</Text>
			<Text style={[styles.text, { color: colors.fontDefault }]}>{count}</Text>
		</View>
	);
};

export default RoleGroupHeader;
