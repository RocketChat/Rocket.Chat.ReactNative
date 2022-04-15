import FastImage from '@rocket.chat/react-native-fast-image';
import React, { useContext, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { themes } from '../../../lib/constants';
import { CustomIcon } from '../../../lib/Icons';
import { useTheme } from '../../../theme';
import ActivityIndicator from '../../ActivityIndicator';
import MessageboxContext from '../Context';
import styles from '../styles';

interface IMessageBoxCommandsPreviewItem {
	item: {
		type: string;
		id: string;
		value: string;
	};
}

const Item = ({ item }: IMessageBoxCommandsPreviewItem) => {
	const context = useContext(MessageboxContext);
	const { onPressCommandPreview } = context;
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();

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
					{loading ? <ActivityIndicator /> : null}
				</FastImage>
			) : (
				<CustomIcon name='attach' size={36} color={themes[theme].actionTintColor} />
			)}
		</TouchableOpacity>
	);
};

export default Item;
