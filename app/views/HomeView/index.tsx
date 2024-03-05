import React, { useEffect } from 'react';
import { ScrollView, Text, View, Image } from 'react-native';
import { useSelector } from 'react-redux';
import Touchable from 'react-native-platform-touchable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { getUserSelector } from '../../selectors/login';
import { LISTENER } from '../../containers/Toast';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import EventEmitter from '../../lib/methods/helpers/events';
import { themes } from '../../lib/constants';
import {
	//  useTheme,
	withTheme
} from '../../theme';
import { IApplicationState } from '../../definitions';
import * as tileData from './data';
import * as allStyles from './styles';
import { Tileprops } from './interfaces';
import { navigateTo247Chat } from './helpers';
import Avatar from '../../containers/Avatar/Avatar';
import Navigation from '../../lib/navigation/appNavigation';

const HomeView: React.FC = () => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const server = useSelector((state: IApplicationState) => state.server.server);
	const userName = user?.name || '';
	// const { theme } = useTheme();
	const theme = 'light';

	const { largeTiles, smallTiles } = tileData;
	const { styles, createTileStyles } = allStyles;

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => <HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />,
				headerRight: () => (
					<HeaderButton.Container>
						<HeaderButton.Item
							iconName='search'
							onPress={() => {
								EventEmitter.emit(LISTENER, { message: `Open search` });
							}}
						/>
						<Touchable style={styles.profileImageContainer} onPress={() => navigation.navigate('ProfileStackNavigator')}>
							{userName ? (
								<Avatar text={userName} style={styles.profileImage} size={24} server={server} borderRadius={12} />
							) : (
								<></>
							)}
						</Touchable>
					</HeaderButton.Container>
				)
			});
		}
	});

	const homeViewTile = ({ icon, title, size, screen, color, disabled = false }: Tileprops, index: number) => {
		const tileStyles = createTileStyles({
			size,
			color: themes[theme][color]
		});
		const imageStyle = size === 'large' ? tileStyles.largeImage : tileStyles.smallImage;

		return (
			<Touchable
				onPress={() => {
					if (screen) {
						if (screen === '24Chat') {
							navigateTo247Chat(Navigation, isMasterDetail);
							return;
						}
						navigation.navigate(screen);
					}
				}}
				style={{ opacity: disabled ? 0.4 : 1, ...tileStyles.tile }}
				key={index}
				disabled={disabled}
				activeOpacity={0.6}
			>
				<View style={tileStyles.tileContent}>
					<View style={tileStyles.imageContainer}>
						<Image source={icon} style={imageStyle} resizeMode='contain' />
					</View>
					<Text style={tileStyles.text}>{title}</Text>
				</View>
			</Touchable>
		);
	};

	return (
		<View style={styles.mainContainer} testID='home-view'>
			<StatusBar />
			<ScrollView>
				<Text style={styles.title}>{`Welcome ${userName},`}</Text>
				<View style={styles.tileContainer}>{largeTiles.map((item, index) => homeViewTile(item, index))}</View>
				<View style={styles.tileContainer}>{smallTiles.map((item, index) => homeViewTile(item, index))}</View>
			</ScrollView>
		</View>
	);
};

export default withTheme(HomeView);
