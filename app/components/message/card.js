import PropTypes from 'prop-types';
import React from 'react';
import Meteor from 'react-native-meteor';
import { CachedImage } from 'react-native-img-cache';
import { Text, TouchableOpacity } from 'react-native';
import { Navigation } from 'react-native-navigation';
import {
	Card,
	CardImage,
	// CardTitle,
	CardContent
	// CardAction
} from 'react-native-card-view';
import RocketChat from '../../lib/rocketchat';

const close = () => Navigation.dismissModal({
	animationType: 'slide-down'
});

const CustomButton = ({ text }) => (
	<TouchableOpacity onPress={close}>
		<Text style={{ color: 'blue' }}>{text}</Text>
	</TouchableOpacity>
);

Navigation.registerComponent('CustomButton', () => CustomButton);
export default class Cards extends React.PureComponent {
	static propTypes = {
		data: PropTypes.object.isRequired
	}
	constructor() {
		super();
		const user = Meteor.user();
		this.state = {};
		RocketChat.getUserToken().then((token) => {
			this.setState({ img: `${ RocketChat.currentServer }${ this.props.data.image_url }?rc_uid=${ user._id }&rc_token=${ token }` });
		});
	}
	_onPressButton() {
		Navigation.showModal({
			screen: 'Photo',
			title: this.props.data.title, // title of the screen as appears in the nav bar (optional)
			passProps: { image: this.state.img },
			// navigatorStyle: {}, // override the navigator style for the screen, see "Styling the navigator" below (optional)
			navigatorButtons: {
				leftButtons: [{
					id: 'custom-button',
					component: 'CustomButton',
					passProps: {
						text: 'close'
					}
				}]
			}, // override the nav buttons for the screen, see "Adding buttons to the navigator" below (optional)
			animationType: 'slide-up' // 'none' / 'slide-up' , appear animation for the modal (optional, default 'slide-up')
		});
	}
	render() {
		return this.state.img ? (
			<TouchableOpacity onPress={() => this._onPressButton()}>
				<Card>
					<CardImage style={{ width: 256, height: 256 }}>
						<CachedImage
							style={{ width: 256, height: 256 }}
							source={{ uri: encodeURI(this.state.img) }}
						/>
					</CardImage>
					<CardContent>
						<Text style={[{ fontSize: 12, alignSelf: 'center', fontStyle: 'italic' }]}>{this.props.data.title}</Text>
						<Text style={{ alignSelf: 'center', fontWeight: 'bold' }}>{this.props.data.description}</Text>
					</CardContent>
				</Card>
			</TouchableOpacity>
		) :
			<Text style={[{ fontSize: 12, alignSelf: 'center', fontStyle: 'italic' }]}>{this.props.data.title}</Text>;
	}
}
