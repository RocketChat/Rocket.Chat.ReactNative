import React, { Component } from 'react';
import {
	View, Text, StyleSheet, ActivityIndicator
} from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';

import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_BORDER, COLOR_PRIMARY
} from '../../constants/colors';

const styles = StyleSheet.create({
	button: {
		marginTop: 6
	},
	container: {
		flex: 1,
		flexDirection: 'column',
		borderRadius: 4,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderColor: COLOR_BORDER,
		borderWidth: 1
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		padding: 15,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		color: COLOR_PRIMARY,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 16,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	marginTop: {
		marginTop: 4
	},
	image: {
		width: '100%',
		height: 150,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4
	},
	loading: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		justifyContent: 'center'
	}
});
export default class extends Component {
	static propTypes = {
		url: PropTypes.object.isRequired,
		index: PropTypes.number
	}

	state = { loading: false }

	onPress = (url) => {
		openLink(url);
	};

	setLoading = (loading) => {
		this.setState({ loading });
	}

	renderLoading = () => {
		const { loading } = this.state;
		if (loading) {
			return (
				<ActivityIndicator style={styles.loading} />
			);
		}
	}

	render() {
		const { url, index } = this.props;
		if (!url) {
			return null;
		}
		return (
			<Touchable
				onPress={() => this.onPress(url.url)}
				style={[styles.button, index > 0 && styles.marginTop, styles.container]}
				background={Touchable.Ripple('#fff')}
			>
				<React.Fragment>
					{url.image ? (
						<FastImage
							source={{ uri: url.image }}
							style={styles.image}
							resizeMode={FastImage.resizeMode.cover}
							onLoadStart={() => this.setLoading(true)}
							onLoadEnd={() => this.setLoading(false)}
						>
							{this.renderLoading()}
						</FastImage>
					) : null}
					<View style={styles.textContainer}>
						<Text style={styles.title} numberOfLines={2}>{url.title}</Text>
						<Text style={styles.description} numberOfLines={2}>{url.description}</Text>
					</View>
				</React.Fragment>
			</Touchable>
		);
	}
}
