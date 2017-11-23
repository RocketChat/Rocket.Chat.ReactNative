import PropTypes from 'prop-types';
import React from 'react';
import Meteor from 'react-native-meteor';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-img-cache';
import { Text, TouchableOpacity, View } from 'react-native';
import {
	Card,
	CardImage,
	// CardTitle,
	CardContent
	// CardAction
} from 'react-native-card-view';
import RocketChat from '../../lib/rocketchat';

import PhotoModal from './PhotoModal';


@connect(state => ({
	base: state.settings.Site_Url,
	canShowList: state.login.token.length || state.login.user.token
}))
export default class Cards extends React.PureComponent {
	static propTypes = {
		data: PropTypes.object.isRequired,
		base: PropTypes.string
	}

	constructor() {
		super();
		const user = Meteor.user();
		this.state = {
			modalVisible: false
		};
		RocketChat.getUserToken().then((token) => {
			this.setState({ img: `${ this.props.base }${ this.props.data.image_url }?rc_uid=${ user._id }&rc_token=${ token }` });
		});
	}

	getDescription() {
		if (this.props.data.description) {
			return <Text style={{ alignSelf: 'center', fontWeight: 'bold' }}>{this.props.data.description}</Text>;
		}
	}

	getImage() {
		return (
			<View>
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
							{this.getDescription()}
						</CardContent>
					</Card>
				</TouchableOpacity>
				<PhotoModal
					title={this.props.data.title}
					image={this.state.img}
					isVisible={this.state.modalVisible}
					onClose={() => this.setState({ modalVisible: false })}
				/>
			</View>
		);
	}

	getOther() {
		return (
			<Text style={[{ fontSize: 12, alignSelf: 'center', fontStyle: 'italic' }]}>{this.props.data.title}</Text>
		);
	}

	_onPressButton() {
		this.setState({
			modalVisible: true
		});
	}

	render() {
		return this.state.img ? this.getImage() : this.getOther();
	}
}
