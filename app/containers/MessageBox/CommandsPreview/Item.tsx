import React, { useContext, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';

import styles from '../styles';
import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';
import MessageboxContext from '../Context';
import ActivityIndicator from '../../ActivityIndicator';

interface IMessageBoxCommandsPreviewItem {
	item: {
		type: string;
		id: string;
		value: string;
	};
	theme?: string;
}

const Item = ({ item, theme }: IMessageBoxCommandsPreviewItem) => {
	const context = useContext(MessageboxContext);
	const { onPressCommandPreview } = context;
	const [loading, setLoading] = useState(true);

	return (
		<TouchableOpacity
			style={styles.commandPreview}
			onPress={() => onPressCommandPreview(item)}
			testID={`command-preview-item${item.id}`}>
			{item.type === 'image' ? (
				<FastImage
					style={styles.commandPreviewImage}
					source={{ uri: item.value }}
					resizeMode={FastImage.resizeMode.cover}
					onLoadStart={() => setLoading(true)}
					onLoad={() => setLoading(false)}>
					{loading ? <ActivityIndicator theme={theme} /> : null}
				</FastImage>
			) : (
				<CustomIcon name='attach' size={36} color={themes[theme!].actionTintColor} />
			)}
		</TouchableOpacity>
	);
};

export default Item;
