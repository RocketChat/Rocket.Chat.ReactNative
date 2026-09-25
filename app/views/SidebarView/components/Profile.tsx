import { memo } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';
import { TouchableWithoutFeedback, View } from 'react-native';
import { PlainText } from '~/containers/PlainText';
import { shallowEqual } from 'react-redux';

import Avatar from '~/containers/Avatar';
import { useTheme } from '~/theme';
import { getUserSelector } from '~/selectors/login';
import styles from '../styles';
import { type DrawerParamList } from '~/stacks/types';
import * as List from '~/containers/List';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';

const Profile = ({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => {
	const { colors } = useTheme();
	const isMasterDetail = useMasterDetail();
	const { username, name } = useAppSelector(getUserSelector, shallowEqual);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server.server);
	const siteName = useAppSelector(state => state.settings.Site_Name) as string;

	const onPressUser = () => {
		if (isMasterDetail) {
			return;
		}
		navigation.closeDrawer();
	};

	return (
		<>
			<List.Separator />
			<TouchableWithoutFeedback onPress={onPressUser} testID='sidebar-close-drawer'>
				<View style={[styles.header, { backgroundColor: colors.surfaceRoom }]}>
					<Avatar text={username} style={styles.avatar} size={30} />
					<View style={styles.headerTextContainer}>
						<View style={styles.headerUsername}>
							<PlainText numberOfLines={1} style={[styles.username, { color: colors.fontTitlesLabels }]}>
								{useRealName ? name : username}
							</PlainText>
						</View>
						<PlainText
							style={[styles.currentServerText, { color: colors.fontTitlesLabels }]}
							numberOfLines={1}
							accessibilityLabel={`Connected to ${server}`}>
							{siteName}
						</PlainText>
					</View>
				</View>
			</TouchableWithoutFeedback>
			<List.Separator />
		</>
	);
};

export default memo(Profile);
