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
	imageContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	image: {
		width: 256,
		height: 256,
		resizeMode: 'cover'
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

	constructor(props) {
		super(props);
		const { baseUrl, file, user } = props;
		this.state = {
			modalVisible: false,
			img: `${ baseUrl }${ file.image_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
	}

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
		return (
			<View>
				<TouchableOpacity
					onPress={() => this._onPressButton()}
					style={styles.button}
				>
					<View style={styles.imageContainer}>
						<CachedImage
							style={styles.image}
							source={{ uri: encodeURI(this.state.img) }}
						/>
					</View>
					<View style={styles.labelContainer}>
						<Text style={styles.imageName}>{this.props.file.title}</Text>
						{this.getDescription()}
					</View>
				</TouchableOpacity>
				<PhotoModal
					title={this.props.file.title}
					image={this.state.img}
					isVisible={this.state.modalVisible}
					onClose={() => this.setState({ modalVisible: false })}
				/>
			</View>
		);
	}
}
