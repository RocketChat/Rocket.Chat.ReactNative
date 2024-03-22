import React, { useEffect } from 'react';
import { View, Text, Dimensions, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import Avatar from '../../../containers/Avatar/Avatar';
import { IApplicationState } from '../../../definitions';
import Status from '../../../containers/Status/Status';
import { Services } from '../../../lib/services';
import { getRoomTitle, getUidDirectMessage } from '../../../lib/methods/helpers';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import makeStyles from './styles';

import { withTheme } from '../../../theme';
import { themes } from '../../../lib/constants';

const playIcon = require('../../../static/images/discussionboard/play_icon.png');
const screenWidth = Dimensions.get('window').width;

const ConnectView: React.FC = ({ route, theme }: { route: any, theme: string }) => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const server = useSelector((state: IApplicationState) => state.server.server);
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);

	const [username, setUsername] = React.useState(null);
	const [userInfo, setUserInfo] = React.useState({});

	const user = route.params?.user;

	const styles = makeStyles(themes, theme);

	const fetchData = async (userId: string) => {
		if (user) {
			setUsername(user.username);
		}
		const roomUserId = getUidDirectMessage({
			rid: userId,
			t: 'd'
		}, avoidLegacy = true);
		const result = await Services.getUserInfo(roomUserId);
		if (result?.user) {
			setUserInfo(result.user);
			setUsername(result.user.username);
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
				goRoom({ item: params, isMasterDetail: true, popToRoot: true });
			} catch (e) {
				log(e);
			}
		}
	};

	let age,
		location,
		bio,
		t1dSince,
		videoUrl = '';

	const devices = [];
	const {customFields, name} = userInfo || {};

	if (customFields) {
		age = customFields.Age;
		location = customFields.Location;
		bio = customFields.Bio;
		t1dSince = customFields['T1D Since'];
		videoUrl = customFields.VideoUrl;
		videoUrl = videoUrl.replace("https://youtu.be/", "https://www.youtube.com/embed/");
		videoUrl = `${videoUrl}?autoplay=1`;
		if (customFields['Glucose Monitoring Method'] !== '') {
			devices.push(customFields['Glucose Monitoring Method']);
		}
		if (customFields['Insulin Delivery Method'] !== '') {
			devices.push(customFields['Insulin Delivery Method']);
		}
	}

	const isVideoUrlPresent = !!videoUrl && videoUrl !== '' && videoUrl !== '?autoplay=1';

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
							{isVideoUrlPresent ? (
								<TouchableOpacity
									style={styles.playIconContainer}
									onPress={() => {
										navigation.navigate('VideoPlayerView', { videoUrl: `${ videoUrl }` });
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
					<Text style={[styles.profileName, {color: themes[theme].titleText}]}>{age ? `${name}, ${age}` : `${name ?? ''}`}</Text>
				</View>
				<View style={styles.locationContainer}>
					<Text style={[styles.locationText, {color: themes[theme].titleText}]}>{location ?? ''}</Text>
				</View>
				<View style={styles.userInfoContainer}>
					<View style={styles.userInfoTextContainerLeft}>
						<Text style={[styles.userInfoText, {color: themes[theme].titleText}]}>T1D Since</Text>
						<Text style={[styles.userInfoTextGrey, {color: themes[theme].bodyText}]}>{t1dSince !== '' ? t1dSince : '-'}</Text>
					</View>
					<View style={styles.userInfoTextContainerRight}>
						<Text style={[styles.userInfoText, {color: themes[theme].titleText}]}>Devices</Text>
						{devices.length > 0 ? 
							devices.map((device, index) => (
								<Text style={[styles.userInfoTextGrey, {color: themes[theme].bodyText}]} key={index}>
									{device}
								</Text>
							)
							)
						 : (
								<Text style={[styles.userInfoTextGrey, {color: themes[theme].bodyText}]}>-</Text>
							)}
					</View>
				</View>
				<View>
					<TouchableOpacity style={styles.connectButton} onPress={() => handleCreateDirectMessage(goToRoom)}>
						<Text style={styles.connectButtonText}>Connect</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.bioContainer}>
					<Text style={[styles.aboutTextHeader, {color: themes[theme].titleText}]}>About</Text>
					<Text style={[styles.aboutText, {color: themes[theme].bodyText}]}>{bio ?? ''}</Text>
				</View>
			</ScrollView>
		</View>
	);
};

export default withTheme(ConnectView);
