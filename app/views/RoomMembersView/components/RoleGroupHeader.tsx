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
	const { colors } = useTheme();
	const title = I18n.t(ROLE_GROUP_TITLES[group]);

	return (
		<View
			testID={`room-members-view-header-${group}`}
			accessible
			accessibilityRole='header'
			accessibilityLabel={title}
			style={[styles.container, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.strokeExtraLight }]}>
			<Text style={[styles.text, { color: colors.fontDefault }]}>{title}</Text>
		</View>
	);
};

export default RoleGroupHeader;
