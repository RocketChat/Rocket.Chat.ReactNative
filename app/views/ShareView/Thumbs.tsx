import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { RectButton, TouchableNativeFeedback, TouchableOpacity } from 'react-native-gesture-handler';

import { BUTTON_HIT_SLOP } from '../../containers/message/utils';
import { themes } from '../../lib/constants';
import { CustomIcon } from '../../containers/CustomIcon';
import { isIOS } from '../../lib/methods/helpers';
import { THUMBS_HEIGHT } from './constants';
import { TSupportedThemes } from '../../theme';
import { IShareAttachment } from '../../definitions';

const THUMB_SIZE = 64;

const styles = StyleSheet.create({
	list: {
		height: THUMBS_HEIGHT,
		paddingHorizontal: 8
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
		borderRadius: 4,
		marginRight: 16,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1
	}
});

interface IThumbContent {
	item: IShareAttachment;
	theme: TSupportedThemes;
	isShareExtension: boolean;
}

interface IThumb extends IThumbContent {
	onPress(item: IShareAttachment): void;
	onRemove(item: IShareAttachment): void;
}

interface IThumbs extends Omit<IThumb, 'item'> {
	attachments: IShareAttachment[];
}

const ThumbContent = React.memo(({ item, theme }: IThumbContent) => {
	const type = item?.mime;

	if (type?.match(/image/)) {
		return <Image source={{ uri: item.path }} style={[styles.thumb, { borderColor: themes[theme].strokeLight }]} />;
	}

	if (type?.match(/video/)) {
		return (
			<View style={[styles.thumb, { borderColor: themes[theme].strokeLight }]}>
				<CustomIcon name='camera' size={30} color={themes[theme].badgeBackgroundLevel2} />
			</View>
		);
	}

	return (
		<View style={[styles.thumb, { borderColor: themes[theme].strokeLight }]}>
			<CustomIcon name='attach' size={30} color={themes[theme].badgeBackgroundLevel2} />
		</View>
	);
});

const ThumbButton: typeof React.Component = isIOS ? TouchableOpacity : TouchableNativeFeedback;

const Thumb = ({ item, theme, isShareExtension, onPress, onRemove }: IThumb) => (
	<ThumbButton style={styles.item} onPress={() => onPress(item)} activeOpacity={0.7}>
		<>
			<ThumbContent item={item} theme={theme} isShareExtension={isShareExtension} />
			<RectButton
				hitSlop={BUTTON_HIT_SLOP}
				style={[styles.removeButton, { backgroundColor: themes[theme].fontDefault, borderColor: themes[theme].surfaceHover }]}
				activeOpacity={1}
				rippleColor={themes[theme].surfaceNeutral}
				onPress={() => onRemove(item)}>
				<View style={[styles.removeView, { borderColor: themes[theme].surfaceHover }]}>
					<CustomIcon name='close' color={themes[theme].surfaceRoom} size={14} />
				</View>
			</RectButton>
			{!item?.canUpload ? (
				<CustomIcon name='warning' size={20} color={themes[theme].buttonBackgroundDangerDefault} style={styles.dangerIcon} />
			) : null}
		</>
	</ThumbButton>
);

const Thumbs = ({ attachments, theme, isShareExtension, onPress, onRemove }: IThumbs) => {
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
				style={[styles.list, { backgroundColor: themes[theme].surfaceLight }]}
			/>
		);
	}
	return null;
};

export default Thumbs;
