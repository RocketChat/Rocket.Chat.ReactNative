import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { BUTTON_HIT_SLOP } from '../../containers/message/utils';
import { themes } from '../../lib/constants/colors';
import { CustomIcon } from '../../containers/CustomIcon';
import { AttachmentThumb } from '../../containers/AttachmentThumb';
import { THUMBS_HEIGHT } from './constants';
import { type TSupportedThemes } from '../../theme';
import { type IShareAttachment } from '../../definitions';
import Touch from '../../containers/Touch';

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
		paddingTop: 8,
		marginRight: 16
	}
});

interface IThumb {
	item: IShareAttachment;
	theme: TSupportedThemes;
	isShareExtension: boolean;
	onPress(item: IShareAttachment): void;
	onRemove(item: IShareAttachment): void;
}

interface IThumbs extends Omit<IThumb, 'item'> {
	attachments: IShareAttachment[];
}

const Thumb = ({ item, theme, onPress, onRemove }: IThumb) => (
	<Touch style={styles.item} onPress={() => onPress(item)} activeOpacity={0.7}>
		<>
			<AttachmentThumb path={item.path} mime={item.mime} />
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
	</Touch>
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
