import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, Image, View, StyleSheet
} from 'react-native';
import { RectButton, TouchableOpacity, TouchableNativeFeedback } from 'react-native-gesture-handler';

import { BUTTON_HIT_SLOP } from '../../containers/message/utils';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { isIOS } from '../../utils/deviceInfo';
import { THUMBS_HEIGHT } from './constants';
import { allowPreview } from './utils';

const THUMB_SIZE = 64;

const styles = StyleSheet.create({
	list: {
		height: THUMBS_HEIGHT,
		paddingHorizontal: 8
	},
	videoThumbIcon: {
		position: 'absolute',
		left: 0,
		bottom: 0
	},
	dangerIcon: {
		position: 'absolute',
		right: 16,
		bottom: 0
	},
	removeButton: {
		position: 'absolute',
		right: 6,
		width: 28,
		height: 28,
		borderWidth: 2,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center'
	},
	removeView: {
		width: 28,
		height: 28,
		borderWidth: 2,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center'
	},
	item: {
		paddingTop: 8
	},
	thumb: {
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		borderRadius: 2,
		marginRight: 16,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1
	}
});

const ThumbButton = isIOS ? TouchableOpacity : TouchableNativeFeedback;

const ThumbContent = React.memo(({ item, theme, isShareExtension }) => {
	const type = item?.mime;

	if (type?.match(/image/)) {
		// Disallow preview of images too big in order to prevent memory issues on iOS share extension
		if (allowPreview(isShareExtension, item?.size)) {
			return (
				<Image
					source={{ uri: item.path }}
					style={[styles.thumb, { borderColor: themes[theme].borderColor }]}
				/>
			);
		} else {
			return (
				<View style={[styles.thumb, { borderColor: themes[theme].borderColor }]}>
					<CustomIcon
						name='image'
						size={30}
						color={themes[theme].tintColor}
					/>
				</View>
			);
		}
	}

	if (type?.match(/video/)) {
		const { uri } = item;
		return (
			<>
				<Image source={{ uri }} style={styles.thumb} />
				<CustomIcon
					name='camera-filled'
					size={20}
					color={themes[theme].buttonText}
					style={styles.videoThumbIcon}
				/>
			</>
		);
	}

	// Multiple files upload of files different than image/video is not implemented, so there's no thumb
	return null;
});

const Thumb = ({
	item, theme, isShareExtension, onPress, onRemove
}) => (
	<ThumbButton style={styles.item} onPress={() => onPress(item)} activeOpacity={0.7}>
		<>
			<ThumbContent
				item={item}
				theme={theme}
				isShareExtension={isShareExtension}
			/>
			<RectButton
				hitSlop={BUTTON_HIT_SLOP}
				style={[styles.removeButton, { backgroundColor: themes[theme].bodyText, borderColor: themes[theme].auxiliaryBackground }]}
				activeOpacity={1}
				rippleColor={themes[theme].bannerBackground}
				onPress={() => onRemove(item)}
			>
				<View style={[styles.removeView, { borderColor: themes[theme].auxiliaryBackground }]}>
					<CustomIcon
						name='close'
						color={themes[theme].backgroundColor}
						size={14}
					/>
				</View>
			</RectButton>
			{!item?.canUpload ? (
				<CustomIcon
					name='warning'
					size={20}
					color={themes[theme].dangerColor}
					style={styles.dangerIcon}
				/>
			) : null}
		</>
	</ThumbButton>
);

const Thumbs = React.memo(({
	attachments, theme, isShareExtension, onPress, onRemove
}) => {
	if (attachments?.length > 1) {
		return (
			<FlatList
				horizontal
				data={attachments}
				keyExtractor={item => item.path}
				renderItem={({ item }) => (
					<Thumb
						item={item}
						theme={theme}
						isShareExtension={isShareExtension}
						onPress={() => onPress(item)}
						onRemove={() => onRemove(item)}
					/>
				)}
				style={[styles.list, { backgroundColor: themes[theme].messageboxBackground }]}
			/>
		);
	}
});
Thumbs.propTypes = {
	attachments: PropTypes.array,
	theme: PropTypes.string,
	isShareExtension: PropTypes.bool,
	onPress: PropTypes.func,
	onRemove: PropTypes.func
};
Thumb.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	isShareExtension: PropTypes.bool,
	onPress: PropTypes.func,
	onRemove: PropTypes.func
};
ThumbContent.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	isShareExtension: PropTypes.bool
};

export default Thumbs;
