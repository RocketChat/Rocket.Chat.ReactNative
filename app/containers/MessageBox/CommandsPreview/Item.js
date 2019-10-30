import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';

import styles from '../styles';
import { CustomIcon } from '../../../lib/Icons';
import { COLOR_PRIMARY } from '../../../constants/colors';
import MessageboxContext from '../Context';

const Item = ({ item }) => {
	const context = useContext(MessageboxContext);
	const { onPressCommandPreview } = context;
	const [loading, setLoading] = useState(true);

	return (
		<TouchableOpacity
			style={styles.commandPreview}
			onPress={() => onPressCommandPreview(item)}
			testID={`command-preview-item${ item.id }`}
		>
			{item.type === 'image'
				? (
					<FastImage
						style={styles.commandPreviewImage}
						source={{ uri: item.value }}
						resizeMode={FastImage.resizeMode.cover}
						onLoadStart={() => setLoading(true)}
						onLoad={() => setLoading(false)}
					>
						{ loading ? <ActivityIndicator /> : null }
					</FastImage>
				)
				: <CustomIcon name='file-generic' size={36} color={COLOR_PRIMARY} />
			}
		</TouchableOpacity>
	);
};

Item.propTypes = {
	item: PropTypes.object
};

export default Item;
