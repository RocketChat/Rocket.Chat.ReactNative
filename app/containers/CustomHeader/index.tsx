import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@react-navigation/elements';

import HeaderContainer from './components/HeaderContainer';
import { isAndroid } from '../../lib/methods/helpers';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { styles } from './styles';

interface IHeaderTitle {
	headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
}

const HeaderTitle = ({ headerTitle }: IHeaderTitle) => {
	const { colors } = useTheme();
	if (!headerTitle) return null;
	if (typeof headerTitle === 'string') {
		if (isAndroid) {
			return (
				<Text
					numberOfLines={1}
					style={{
						...styles.title,
						paddingVertical: 4,
						color: colors.fontTitlesLabels
					}}>
					{headerTitle}
				</Text>
			);
		}
		return (
			<View style={styles.headerTitleContainer}>
				<Text
					numberOfLines={1}
					style={{
						...styles.title,
						paddingVertical: 6,
						color: colors.fontTitlesLabels
					}}>
					{headerTitle}
				</Text>
			</View>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
};

interface IHeader extends NativeStackHeaderProps {}

const CustomHeader = ({ options, navigation, route }: IHeader) => {
	const { headerLeft, headerTitle, headerRight, title } = options;
	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const isRoomViewMasterDetail =
		!isMasterDetail ||
		route.name === 'RoomView' ||
		route.name === 'RoomsListView' ||
		route.name === 'ShareListView' ||
		route.name === 'ShareView';

	return (
		<HeaderContainer addExtraNotchadding={isRoomViewMasterDetail}>
			{headerLeft ? (
				headerLeft({ canGoBack: false })
			) : (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.goBack()}
					tintColor={colors.fontDefault}
					testID='header-back'
					style={styles.headerBackButton}
				/>
			)}
			<HeaderTitle headerTitle={headerTitle ?? title} />
			{headerRight ? headerRight({ canGoBack: false }) : <View style={{ width: 24, height: 24 }} />}
		</HeaderContainer>
	);
};

export default CustomHeader;
