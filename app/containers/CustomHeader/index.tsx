import React, { ReactNode } from 'react';
import { Text } from 'react-native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@react-navigation/elements';

import HeaderContainer from './components/HeaderContainer';
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
		return (
			<Text
				numberOfLines={1}
				style={{
					...styles.title,
					color: colors.fontTitlesLabels
				}}>
				{headerTitle}
			</Text>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
};

interface IHeader extends NativeStackHeaderProps {}

const CustomHeader = ({ options, navigation, route }: IHeader) => {
	const { header, headerLeft, headerTitle, headerRight, title } = options;
	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const isRoomViewMasterDetail = !isMasterDetail || route.name === 'RoomView' || route.name === 'RoomsListView';
	if (header) return header({ options: {}, navigation, route });

	return (
		<HeaderContainer addExtraNotchPadding={isRoomViewMasterDetail}>
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
			{headerRight ? headerRight({ canGoBack: false }) : null}
		</HeaderContainer>
	);
};

export default CustomHeader;
