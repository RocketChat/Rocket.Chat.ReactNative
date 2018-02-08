import React from 'react';
import { ScrollView, View } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import PropTypes from 'prop-types';

const styles = {
	imageWrapper: {
		flex: 1,
		alignItems: 'stretch',
		backgroundColor: '#000'
	},
	image: {
		flex: 1
	}
};

export default class Photo extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}
	render() {
		const { image } = this.props.navigation.state.params;
		return (
			<View style={styles.imageWrapper}>
				<ScrollView contentContainerStyle={styles.imageWrapper} maximumZoomScale={1.5}>
					<CachedImage
						style={{ ...styles.image }}
						source={{ uri: encodeURI(image) }}
						mutable
						resizeMode='contain'
					/>
				</ScrollView>
			</View>
		);
	}
}
