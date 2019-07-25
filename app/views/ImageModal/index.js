import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { isIOS, isNotch } from '../../utils/deviceInfo';

import StatusBar from '../../containers/StatusBar';
import ImageViewer from '../../containers/ImageViewer';
import { COLOR_PRIMARY } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';

const styles = StyleSheet.create({
	backButton: {
		position: 'absolute',
		paddingHorizontal: 9,
		left: 15
	},
	imageView: {
		marginTop: 45,
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	}
});


export default class ImageModal extends React.Component {
	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.url = props.navigation.getParam('url');
	}

	renderBack = () => {
		const { navigation } = this.props;

		let top = 15;
		if (isIOS) {
			top = isNotch ? 45 : 30;
		}

		return (
			<TouchableOpacity
				style={[styles.backButton, { top }]}
				onPress={() => navigation.pop()}
			>
				<CustomIcon
					name='cross'
					size={30}
					color={COLOR_PRIMARY}
				/>
			</TouchableOpacity>
		);
	}

	render() {
		return (
			<SafeAreaView>
				<StatusBar light />
				<View style={styles.imageView}>
					<ImageViewer uri={this.url} />
				</View>
				{this.renderBack()}
			</SafeAreaView>
		);
	}
}
