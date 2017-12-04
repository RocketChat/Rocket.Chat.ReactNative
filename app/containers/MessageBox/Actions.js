import React from 'react';
import PropTypes from 'prop-types';
import { TouchableNativeFeedback, View, Text } from 'react-native';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import ImagePicker from 'react-native-image-picker';

import reduxStore from '../../lib/createStore';

import Collapse from '../../animations/collapse';
import style from './style';
import fontelloConfig from '../../icons.json';
import RocketChat from '../../lib/rocketchat';

const MyIcon = createIconSetFromIcoMoon(fontelloConfig);
const actions = [
	{
		title: 'Location',
		icon: 'location',
		condition: () => {
			const { settings } = reduxStore.getState();
			return settings && settings.MapView_GMapsAPIKey;
		},
		action() {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { settings, room } = reduxStore.getState();
					const { latitude, longitude } = position.coords;
					const url = `https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=500x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ settings.MapView_GMapsAPIKey }`;
					RocketChat.sendMessage(room.rid, url);
				},
				() =>
					({ enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 })
			);
		}
	},
	{
		title: 'Audio',
		icon: 'audio',
		condition: () => false
	}, {
		title: 'Images',
		icon: 'image',
		action: () => {
			ImagePicker.launchImageLibrary({}, (response) => {
				if (response.didCancel || response.error) {
					return;
				}
				const fileInfo = {
					name: response.fileName,
					size: response.fileSize,
					type: response.type || 'image/jpeg',
					// description: '',
					store: 'Uploads'
				};
				const { rid } = reduxStore.getState().room;
				if (!rid) {
					return;
				}
				RocketChat.sendFileMessage(rid, fileInfo, response.data);
			});
		}
	}, {
		title: 'Camera',
		icon: 'video',
		action() {
			ImagePicker.launchCamera({}, (response) => {
				if (response.didCancel || response.error) {
					return;
				}
				const fileInfo = {
					name: response.fileName,
					size: response.fileSize,
					type: response.type || 'image/jpeg',
					// description: '',
					store: 'Uploads'
				};
				const { rid } = reduxStore.getState().room;
				if (!rid) {
					return;
				}
				RocketChat.sendFileMessage(rid, fileInfo, response.data);
			});
		}
	}
];
const render = (item, i, array, action) => (
	<TouchableNativeFeedback key={item.icon} onPress={() => { item.action && item.action(item); action(item); }}>
		<View style={style.actionRow}>
			<Text style={style.actionTitle}>{item.title}</Text>
			<MyIcon style={[style.actionButtons, { color: '#1D74F5', borderBottomWidth: i === array.length - 1 ? 0 : null }]} name={item.icon} />
		</View>
	</TouchableNativeFeedback>
);

export default class Actions extends React.PureComponent {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		onAction: PropTypes.func
	}
	render() {
		return (
			<Collapse open={this.props.open} style={style.actionContent}>
				{actions.filter(item => !item.condition || item.condition()).map((item, i, array) => render(item, i, array, this.props.onAction))}
			</Collapse>);
	}
}
