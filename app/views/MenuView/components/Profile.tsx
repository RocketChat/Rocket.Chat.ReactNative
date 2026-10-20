import { memo } from 'react';
import { Text, View } from 'react-native';
import { shallowEqual } from 'react-redux';

import Avatar from '~/containers/Avatar';
import { useTheme } from '~/theme';
import { getUserSelector } from '~/selectors/login';
import styles from '../styles';
import * as List from '~/containers/List';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

const Profile = () => {
	const { colors } = useTheme();
	const { username, name } = useAppSelector(getUserSelector, shallowEqual);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server.server);
	const siteName = useAppSelector(state => state.settings.Site_Name) as string;

	return (
		<>
			<List.Separator />
			<View testID='sidebar-user-info' style={[styles.header, { backgroundColor: colors.surfaceRoom }]}>
				<Avatar text={username} style={styles.avatar} size={30} />
				<View style={styles.headerTextContainer}>
					<View style={styles.headerUsername}>
						<Text numberOfLines={1} style={[styles.username, { color: colors.fontTitlesLabels }]}>
							{useRealName ? name : username}
						</Text>
					</View>
					<Text
						style={[styles.currentServerText, { color: colors.fontTitlesLabels }]}
						numberOfLines={1}
						accessibilityLabel={`Connected to ${server}`}>
						{siteName}
					</Text>
				</View>
			</View>
			<List.Separator />
		</>
	);
};

export default memo(Profile);
