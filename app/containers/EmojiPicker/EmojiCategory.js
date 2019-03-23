import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { responsive } from 'react-native-responsive-ui';
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import Modal from 'react-native-modal';

import styles from './styles';
import CustomEmoji from './CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { isIOS } from '../../utils/deviceInfo';

const EMOJIS_PER_ROW = isIOS ? 8 : 9;

const renderEmoji = (emoji, size, baseUrl) => {
	if (emoji.isCustom) {
		return <CustomEmoji style={[styles.customCategoryEmoji, { height: size - 8, width: size - 8 }]} emoji={emoji} baseUrl={baseUrl} />;
	}
	return (
		<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
			{emoji.symbol}
		</Text>
	);
};


@responsive
export default class EmojiCategory extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emojis: PropTypes.any,
		window: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	}

	constructor(props) {
		super(props);
		const { window, width, emojisPerRow } = this.props;
		const { width: widthWidth, height: windowHeight } = window;

		this.size = Math.min(width || widthWidth, windowHeight) / (emojisPerRow || EMOJIS_PER_ROW);
		this.emojis = props.emojis;
		this.state = {
			isModalVisible: false,
			modalX: 0,
			modalY: 0,
			modalData: []
		};
	}

	shouldComponentUpdate() {
		return true;
	}

	componentWillUnmount() {
		this.setState({ isModalVisible: false });
	}

	getModelStyle() {
		const { modalX, modalY } = this.state;
		const { width } = Dimensions.get('window');
		const widthOfModal = this.size * 5.2;
		let xCenter = modalX - (widthOfModal) / 2;
		if (xCenter < 0) {
			xCenter = 0;
		} else if (xCenter + (widthOfModal) / 2 > widthOfModal) {
			xCenter = width - widthOfModal - 20;
		}

		const yCenter = modalY - 2.5 * this.size;
		return {
			position: 'absolute',
			alignSelf: 'baseline',
			width: widthOfModal,
			left: xCenter,
			top: yCenter,
			flexDirection: 'row',
			backgroundColor: '#fefefe',
			borderRadius: 10,
			padding: 5,
			borderColor: '#d6d7da',
			borderWidth: 0.5
		};
	}

	showModal = (event, modalData) => {
		this.setState({
			isModalVisible: true,
			modalX: event.nativeEvent.pageX,
			modalY: event.nativeEvent.pageY,
			modalData
		});
	}

	renderItem(emoji, size) {
		const { baseUrl, onEmojiSelected } = this.props;
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.isCustom ? emoji.content : emoji}
				onPress={() => onEmojiSelected(emoji)}
				onLongPress={emoji.tone ? (event) => { this.showModal(event, emoji.tone); } : null}
				testID={`reaction-picker-${ emoji.isCustom ? emoji.content : emoji }`}
			>
				{renderEmoji(emoji, size, baseUrl)}
			</TouchableOpacity>
		);
	}

	render() {
		const { emojis } = this.props;
		const { modalData, isModalVisible } = this.state;
		const modelStyle = this.getModelStyle();

		return (
			<React.Fragment>
				<OptimizedFlatList
					keyExtractor={item => (item.isCustom && item.content) || item.name}
					data={emojis}
					renderItem={({ item }) => this.renderItem(item, this.size)}
					numColumns={EMOJIS_PER_ROW}
					initialNumToRender={45}
					getItemLayout={(data, index) => ({ length: this.size, offset: this.size * index, index })}
					removeClippedSubviews
					{...scrollPersistTaps}
				/>
				<Modal
					isVisible={isModalVisible}
					onBackdropPress={() => this.setState({ isModalVisible: false })}
					onBackButtonPress={() => this.setState({ isModalVisible: false })}
					backdropOpacity={0}
					animationIn='fadeIn'
					animationOut='fadeOut'
					animationOutTiming={10}
					animationInTiming={10}
					backdropTransitionInTiming={10}
					backdropTransitionOutTiming={10}
				>
					<View style={modelStyle}>
						<OptimizedFlatList
							keyExtractor={item => (item.isCustom && item.content) || item.name}
							data={modalData}
							renderItem={({ item }) => this.renderItem(item, this.size)}
							numColumns={5}
							initialNumToRender={5}
							getItemLayout={(data, index) => ({ length: this.size, offset: this.size * index, index })}
							removeClippedSubviews
							{...scrollPersistTaps}
						/>
					</View>
				</Modal>
			</React.Fragment>
		);
	}
}
