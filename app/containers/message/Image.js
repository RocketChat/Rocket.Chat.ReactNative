import PropTypes from 'prop-types';
import React from 'react';
import { CachedImage } from 'react-native-img-cache';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import PhotoModal from './PhotoModal';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'column',
		height: 320,
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 6
	},
	image: {
		flex: 1,
		height: undefined,
		width: undefined,
		resizeMode: 'contain'
	},
	labelContainer: {
		height: 62,
		alignItems: 'center',
		justifyContent: 'center'
	},
	imageName: {
		fontSize: 12,
		alignSelf: 'center',
		fontStyle: 'italic'
	},
	message: {
		alignSelf: 'center',
		fontWeight: 'bold'
	}
});

export default class Image extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired
	}

	state = { modalVisible: false };

	getDescription() {
		if (this.props.file.description) {
			return <Text style={styles.message}>{this.props.file.description}</Text>;
		}
	}

	_onPressButton() {
		this.setState({
			modalVisible: true
		});
	}

	render() {
		const { baseUrl, file, user } = this.props;
		const img = `${ baseUrl }${ file.image_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
		return (
			<View>
				<TouchableOpacity
					onPress={() => this._onPressButton()}
					style={styles.button}
				>
					<CachedImage
						style={styles.image}
						source={{ uri: encodeURI(img) }}
					/>
					<View style={styles.labelContainer}>
						<Text style={styles.imageName}>{this.props.file.title}</Text>
						{this.getDescription()}
					</View>
				</TouchableOpacity>
				<PhotoModal
					title={this.props.file.title}
					image={img}
					isVisible={this.state.modalVisible}
					onClose={() => this.setState({ modalVisible: false })}
				/>
			</View>
		);
	}
}
