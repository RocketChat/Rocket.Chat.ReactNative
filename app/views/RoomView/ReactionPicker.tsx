import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';

import EmojiPicker from '../../containers/EmojiPicker';
import { isAndroid } from '../../lib/methods/helpers';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import styles from './styles';
import { IApplicationState } from '../../definitions';

const margin = isAndroid ? 40 : 20;
const maxSize = 400;

interface IReactionPickerProps {
	baseUrl: string;
	message?: any;
	show: boolean;
	isMasterDetail: boolean;
	reactionClose: () => void;
	onEmojiSelected: (shortname: string, id: string) => void;
	width: number;
	height: number;
	theme: TSupportedThemes;
}

class ReactionPicker extends React.Component<IReactionPickerProps> {
	shouldComponentUpdate(nextProps: IReactionPickerProps) {
		const { show, width, height } = this.props;
		return nextProps.show !== show || width !== nextProps.width || height !== nextProps.height;
	}

	onEmojiSelected = (emoji: string, shortname?: string) => {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		const { onEmojiSelected, message } = this.props;
		if (message) {
			onEmojiSelected(shortname || emoji, message.id);
		}
	};

	render() {
		const { width, height, show, baseUrl, reactionClose, isMasterDetail, theme } = this.props;

		let widthStyle = width - margin;
		let heightStyle = Math.min(width, height) - margin * 2;

		if (isMasterDetail) {
			widthStyle = maxSize;
			heightStyle = maxSize;
		}

		return show ? (
			<Modal
				isVisible={show}
				style={{ alignItems: 'center' }}
				onBackdropPress={reactionClose}
				onBackButtonPress={reactionClose}
				animationIn='fadeIn'
				animationOut='fadeOut'
				backdropOpacity={themes[theme].backdropOpacity}>
				<View
					style={[
						styles.reactionPickerContainer,
						{
							width: widthStyle,
							height: heightStyle
						}
					]}
					testID='reaction-picker'>
					<EmojiPicker theme={theme} onEmojiSelected={this.onEmojiSelected} baseUrl={baseUrl} />
				</View>
			</Modal>
		) : null;
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(ReactionPicker));
