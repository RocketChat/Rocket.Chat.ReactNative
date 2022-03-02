import React, { useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

import I18n from '../i18n';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import Button from '../containers/Button';
import { useTheme } from '../theme';
import RocketChat from '../lib/rocketchat';
import Navigation from '../lib/Navigation';
import { goRoom } from '../utils/goRoom';
import { themes } from '../constants/colors';
import Markdown from '../containers/markdown';
import { ICannedResponse } from '../definitions/ICannedResponse';
import { ChatsStackParamList } from '../stacks/types';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	scroll: {
		flex: 1
	},
	container: {
		flex: 1,
		marginTop: 12,
		marginHorizontal: 15
	},
	cannedText: {
		marginTop: 8,
		marginBottom: 16,
		fontSize: 14,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cannedTagWrap: {
		borderRadius: 4,
		marginRight: 4,
		marginTop: 8,
		height: 16
	},
	cannedTagContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	cannedTag: {
		fontSize: 12,
		paddingTop: 0,
		paddingBottom: 0,
		paddingHorizontal: 4,
		...sharedStyles.textRegular
	},
	button: {
		margin: 24,
		marginBottom: 24
	},
	item: {
		paddingVertical: 10,
		justifyContent: 'center'
	},
	itemLabel: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IItem {
	label: string;
	content?: string;
	theme: string;
	testID?: string;
}

const Item = ({ label, content, theme, testID }: IItem) =>
	content ? (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={[styles.itemLabel, { color: themes[theme].titleText }]}>
				{label}
			</Text>
			{/* @ts-ignore */}
			<Markdown style={[styles.itemContent, { color: themes[theme].auxiliaryText }]} msg={content} theme={theme} />
		</View>
	) : null;

interface ICannedResponseDetailProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'CannedResponseDetail'>;
	route: RouteProp<ChatsStackParamList, 'CannedResponseDetail'>;
}

const CannedResponseDetail = ({ navigation, route }: ICannedResponseDetailProps): JSX.Element => {
	const { cannedResponse } = route?.params;
	const { theme } = useTheme();
	const { isMasterDetail } = useSelector((state: any) => state.app);
	const { rooms } = useSelector((state: any) => state.room);

	useEffect(() => {
		navigation.setOptions({
			title: `!${cannedResponse?.shortcut}`
		});
	}, []);

	const navigateToRoom = (item: ICannedResponse) => {
		const { room } = route.params;
		const { name } = room;
		const params = {
			rid: room.rid,
			name: RocketChat.getRoomTitle({
				t: room.t,
				fname: name
			}),
			t: room.t as any,
			roomUserId: RocketChat.getUidDirectMessage(room),
			usedCannedResponse: item.text
		};

		if (room.rid) {
			// if it's on master detail layout, we close the modal and replace RoomView
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
				goRoom({ item: params, isMasterDetail });
			} else {
				let navigate = navigation.push;
				// if this is a room focused
				if (rooms.includes(room.rid)) {
					({ navigate } = navigation);
				}
				navigate('RoomView', params);
			}
		}
	};

	return (
		<SafeAreaView>
			<ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: themes[theme].messageboxBackground }]}>
				<StatusBar />
				<View style={styles.container}>
					<Item label={I18n.t('Shortcut')} content={`!${cannedResponse?.shortcut}`} theme={theme} />
					<Item label={I18n.t('Content')} content={cannedResponse?.text} theme={theme} />
					<Item label={I18n.t('Sharing')} content={cannedResponse?.scopeName} theme={theme} />

					<View style={styles.item}>
						<Text style={[styles.itemLabel, { color: themes[theme].titleText }]}>{I18n.t('Tags')}</Text>
						<View style={styles.cannedTagContainer}>
							{cannedResponse?.tags?.length > 0 ? (
								cannedResponse.tags.map(t => (
									<View style={[styles.cannedTagWrap, { backgroundColor: themes[theme].searchboxBackground }]}>
										<Text style={[styles.cannedTag, { color: themes[theme].auxiliaryTintColor }]}>{t}</Text>
									</View>
								))
							) : (
								<Text style={[styles.cannedText, { color: themes[theme].auxiliaryTintColor }]}>-</Text>
							)}
						</View>
					</View>
				</View>
				<Button
					title={I18n.t('Use')}
					theme={theme}
					style={styles.button}
					type='primary'
					onPress={() => navigateToRoom(cannedResponse)}
				/>
			</ScrollView>
		</SafeAreaView>
	);
};

export default CannedResponseDetail;
