import { StyleSheet, Text, View } from 'react-native';

import NativeListSectionHeader from '~/containers/List/native/components/SectionHeader';
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
	const { colors } = useTheme();
	const title = I18n.t(ROLE_GROUP_TITLES[group]);
	const testID = `room-members-view-header-${group}`;

	if (hasNativeHeaderBar) {
		return <NativeListSectionHeader testID={testID} title={title} />;
	}

	return (
		<View
			testID={testID}
			accessible
			accessibilityRole='header'
			accessibilityLabel={title}
			style={[styles.container, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.strokeExtraLight }]}>
			<Text style={[styles.text, { color: colors.fontDefault }]}>{title}</Text>
		</View>
	);
};

export default RoleGroupHeader;
