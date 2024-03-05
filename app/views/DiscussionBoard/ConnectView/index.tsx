import React, { useEffect } from 'react';
import { View, Text, Dimensions, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import Avatar from '../../../containers/Avatar/Avatar';
import { IApplicationState } from '../../../definitions';
import Status from '../../../containers/Status/Status';
import { Services } from '../../../lib/services';
import { getRoomTitle, getUidDirectMessage } from '../../../lib/methods/helpers';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import styles from './styles';

const playIcon = require('../../../static/images/discussionboard/play_icon.png');
const screenWidth = Dimensions.get('window').width;

const ConnectView: React.FC = ({ route }: { route: any }) => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const server = useSelector((state: IApplicationState) => state.server.server);
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);

	const [username, setUsername] = React.useState(null);
	const [userInfo, setUserInfo] = React.useState({});

	const user = route.params?.user;

	const fetchData = async (userId: string) => {
		if (user) {
			setUsername(user.username);
		}
		const roomUserId = getUidDirectMessage({
			rid: userId,
			t: 'd'
		});
		const result = await Services.getUserInfo(roomUserId);
		if (result?.user) {
			setUserInfo(result.user);
		}
	};

	useEffect(() => {
		if (route.params?.user) {
			const userId = route.params?.user.id ?? route.params?.user._id;
			fetchData(userId);
		}
	}, [route.params?.user]);

	const handleCreateDirectMessage = async (onPress: (rid: string) => void) => {
		try {
			const result = await Services.createDirectMessage(username);
			if (result.success) {
				const {
					room: { rid }
				} = result;
				if (rid) {
					onPress(rid);
				}
			}
		} catch {}
	};

	const goToRoom = (rid: string) => {
		const room = { rid: rid, t: 'd' };

		const params = {
			rid: room.rid,
			name: getRoomTitle(room),
			t: room.t,
			roomUserId: getUidDirectMessage(room)
		};

		if (room.rid) {
			try {
				navigation.navigate('ChatsStackNavigator', {
					screen: 'RoomListView'
				});
				goRoom({ item: params, isMasterDetail, popToRoot: true });
			} catch {}
		}
	};

	let age,
		location,
		bio,
		t1dSince,
		videoUrl = '';

	let devices = [];
	const customFields = userInfo?.customFields;
	const name = userInfo.name;

	if (customFields) {
		age = customFields.Age;
		location = customFields.Location;
		bio = customFields.Bio;
		t1dSince = customFields['T1D Since'];
		videoUrl = customFields.VideoUrl;
		if (customFields['Glucose Monitoring Method'] !== '') {
			devices.push(customFields['Glucose Monitoring Method']);
		}
		if (customFields['Insulin Delivery Method'] !== '') {
			devices.push(customFields['Insulin Delivery Method']);
		}
	}

	return (
		<View style={styles.mainContainer}>
			<ScrollView>
				<View style={styles.profileContainer}>
					{username && (
						<View>
							<Avatar
								text={username}
								style={styles.profileImage}
								size={screenWidth * 0.4}
								server={server}
								borderRadius={screenWidth * 0.05}
							/>
							{videoUrl && videoUrl !== '' ? (
								<TouchableOpacity
									style={styles.playIconContainer}
									onPress={() => {
										Linking.openURL(videoUrl);
									}}
								>
									<Image source={playIcon} style={styles.playIcon} />
								</TouchableOpacity>
							) : null}
						</View>
					)}
				</View>
				<View style={styles.nameContainer}>
					<Status size={20} id={user._id} />
					<Text style={styles.profileName}>{age ? `${name}, ${age}` : `${name ?? ''}`}</Text>
				</View>
				<View style={styles.locationContainer}>
					<Text style={styles.locationText}>{location ?? ''}</Text>
				</View>
				<View style={styles.userInfoContainer}>
					<View style={styles.userInfoTextContainerLeft}>
						<Text style={styles.userInfoText}>T1D Since</Text>
						<Text style={styles.userInfoTextGrey}>{t1dSince !== '' ? t1dSince : '-'}{age? ` (${age})` : ''}</Text>
					</View>
					<View style={styles.userInfoTextContainerRight}>
						<Text style={styles.userInfoText}>Devices</Text>
						{devices.length > 0 ? (
							devices.map((device, index) => {
								return (
									<Text style={styles.userInfoTextGrey} key={index}>
										{device}
									</Text>
								);
							})
						) : (
							<Text style={styles.userInfoTextGrey}>-</Text>
						)}
					</View>
				</View>
				<View>
					<TouchableOpacity style={styles.connectButton} onPress={() => handleCreateDirectMessage(goToRoom)}>
						<Text style={styles.connectButtonText}>Connect</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.bioContainer}>
					<Text style={styles.aboutTextHeader}>About</Text>
					<Text style={styles.aboutText}>{bio ?? ''}</Text>
				</View>
			</ScrollView>
		</View>
	);
};

export default ConnectView;
