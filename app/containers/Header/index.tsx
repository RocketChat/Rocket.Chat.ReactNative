import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { type NativeStackHeaderProps } from '@react-navigation/native-stack';

import HeaderTitle from './components/HeaderTitle';
import HeaderContainer from './components/HeaderContainer';
import { isAndroid } from '../../lib/methods/helpers';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import { styles } from './styles';
import { HeaderBackButton } from './components/HeaderBackButton';

interface IHeader extends NativeStackHeaderProps {}

const Header = ({ options, navigation, route }: IHeader) => {
	'use memo';

	const { headerLeft, headerTitle, headerRight, title } = options;
	const [rightButtonsWidth, setRightButtonsWidth] = useState<number | null>(null);
	const isMasterDetail = useMasterDetail();

	const isRoomViewMasterDetail =
		!isMasterDetail ||
		route.name === 'RoomView' ||
		route.name === 'RoomsListView' ||
		route.name === 'ShareListView' ||
		route.name === 'ShareView' ||
		route.name === 'AttachmentView' ||
		route.name === 'DrawerNavigator';

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

		return <View style={isAndroid ? styles.headerPlaceholderAndroid : styles.headerPlaceholderIOS} />;
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
					<HeaderBackButton onPress={() => navigation.goBack()} testID='custom-header-back' style={styles.headerBackButton} />
				</View>
			)}
			<HeaderTitle headerTitle={headerTitle ?? title} />
			{renderHeaderRight()}
		</HeaderContainer>
	);
};

export default Header;
