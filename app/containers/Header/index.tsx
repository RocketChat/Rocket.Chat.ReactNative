import React, { useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@react-navigation/elements';

import HeaderTitle from './components/HeaderTitle';
import HeaderContainer from './components/HeaderContainer';
import { isAndroid } from '../../lib/methods/helpers';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { styles } from './styles';

interface IHeader extends NativeStackHeaderProps {}

const Header = ({ options, navigation, route }: IHeader) => {
	const { headerLeft, headerTitle, headerRight, title } = options;
	const [rightButtonsWidth, setRightButtonsWidth] = useState<number | null>(null);
	const { colors } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { fontScale } = useWindowDimensions();

	// It helps create an empty view to properly align the header when there is no component on the right.
	// 32.5 is the value I found that makes it work correctly on both platforms.
	const size = 32.5 * fontScale;

	const isRoomViewMasterDetail =
		!isMasterDetail ||
		route.name === 'RoomView' ||
		route.name === 'RoomsListView' ||
		route.name === 'ShareListView' ||
		route.name === 'ShareView' ||
		route.name === 'AttachmentView';

	const handleOnLayout = ({
		nativeEvent: {
			layout: { width }
		}
	}: LayoutChangeEvent) => {
		if (isAndroid || !headerTitle) {
			return;
		}
		setRightButtonsWidth(width + 12);
	};

	const renderHeaderRight = () => {
		if (headerRight) {
			return <View onLayout={handleOnLayout}>{headerRight({ canGoBack: false })}</View>;
		}
		if (route.name === 'ShareView') {
			return null;
		}

		return <View style={{ width: isAndroid ? undefined : size, height: size }} />;
	};

	return (
		<HeaderContainer
			customRightIcon={!!headerRight}
			customLeftIcon={!!headerLeft}
			addExtraNotchPadding={isRoomViewMasterDetail}
			isMasterDetail={isMasterDetail}>
			{headerLeft ? (
				headerLeft({ canGoBack: false })
			) : (
				<View style={{ width: rightButtonsWidth }}>
					<HeaderBackButton
						labelVisible={false}
						onPress={() => navigation.goBack()}
						tintColor={colors.fontDefault}
						testID='custom-header-back'
						style={styles.headerBackButton}
					/>
				</View>
			)}
			<HeaderTitle headerTitle={headerTitle ?? title} />
			{renderHeaderRight()}
		</HeaderContainer>
	);
};

export default Header;
