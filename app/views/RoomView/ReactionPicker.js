import React from 'react';
import PropTypes from 'prop-types';
import { View, Dimensions, Platform } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import EmojiPicker from '../../containers/EmojiPicker';
import { toggleReactionPicker } from '../../actions/messages';
import styles from './styles';

const { width } = Dimensions.get('window');
const tabEmojiStyle = { fontSize: 15 };
@connect(state => ({
	showReactionPicker: state.messages.showReactionPicker
}), dispatch => ({
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message))
}))
export default class extends React.Component {
	static propTypes = {
		showReactionPicker: PropTypes.bool,
		toggleReactionPicker: PropTypes.func,
		onEmojiSelected: PropTypes.func
	};

	onEmojiSelected(emoji, shortname) {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		this.props.onEmojiSelected(shortname || emoji);
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.showReactionPicker != this.props.showReactionPicker;
	}

	render() {
		return (
			<Modal
				isVisible={this.props.showReactionPicker}
				style={{ alignItems: 'center' }}
				onBackdropPress={() => this.props.toggleReactionPicker()}
				onBackButtonPress={() => this.props.toggleReactionPicker()}
				animationIn='fadeIn'
				animationOut='fadeOut'
			>
				<View style={styles.reactionPickerContainer}>
					<EmojiPicker
						tabEmojiStyle={tabEmojiStyle}
						emojisPerRow={8}
						width={width - (Platform.OS === 'android' ? 40 : 20)}
						onEmojiSelected={(emoji, shortname) => this.onEmojiSelected(emoji, shortname)}
					/>
				</View>
			</Modal>
		);
	}
}
