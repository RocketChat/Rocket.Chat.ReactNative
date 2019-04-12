import React from 'react';
import {
	View, Text, ActivityIndicator, StyleSheet
} from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';
import { responsive } from 'react-native-responsive-ui';

import { connect } from 'react-redux';
import sharedStyles from '../../views/Styles';
import { COLOR_WHITE } from '../../constants/colors';

const styles = StyleSheet.create({
	imageWrapper: {
		flex: 1
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		marginTop: 20,
		paddingTop: 40,
		position: 'absolute',
		zIndex: 1
	},
	title: {
		color: COLOR_WHITE,
		textAlign: 'center',
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	description: {
		color: COLOR_WHITE,
		textAlign: 'center',
		fontSize: 14,
		margin: 5,
		...sharedStyles.textMedium
	},
	indicatorContainer: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const margin = 40;

@connect(state => ({
	file: state.messages.file
}), null)
@responsive
export default class PhotoModal extends React.PureComponent {
	static propTypes = {
		isVisible: PropTypes.bool,
		onClose: PropTypes.func.isRequired,
		window: PropTypes.object,
		files: PropTypes.array,
		file: PropTypes.string.isRequired
	};

	loadingView = () => {
		const { window: { width, height } } = this.props;

		return (
			<View style={[styles.indicatorContainer, { width, height }]}>
				<ActivityIndicator />
			</View>
		);
	};

	header = (currentIndex) => {
		const { files } = this.props;

		return (
			<View style={styles.titleContainer}>
				<Text style={styles.title}>{files[currentIndex] ? files[currentIndex].title : ''}</Text>
				<Text style={styles.description}>{files[currentIndex] ? files[currentIndex].description : ''}</Text>
			</View>
		);
	};

	render() {
		const {
			isVisible, window: { width, height }, files, file, onClose
		} = this.props;

		// determine the index of the first image to be opened by ImageViewer
		// slice used because formats of urls are different
		const index = files.findIndex(f => f.url.includes(file.slice(37)));

		return (
			<Modal
				isVisible={isVisible}
				style={{ alignItems: 'center' }}
				onBackdropPress={onClose}
				onBackButtonPress={onClose}
				animationIn='fadeIn'
				animationOut='fadeOut'
				backdropOpacity={0.95}
			>
				<View style={{ width: width - margin, height: height - margin }}>
					<View style={styles.imageWrapper}>
						<ImageViewer
							imageUrls={files.length ? files : [file]}
							onClick={onClose}
							backgroundColor='transparent'
							enableSwipeDown
							onSwipeDown={onClose}
							renderImage={props => <FastImage {...props} />}
							loadingRender={this.loadingView}
							index={files.length ? index : 0}
							enablePreload
							renderHeader={currentIndex => this.header(currentIndex)}
						/>
					</View>
				</View>
			</Modal>
		);
	}
}
