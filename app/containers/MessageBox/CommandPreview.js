import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';

import styles from './styles';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_PRIMARY } from '../../constants/colors';

export default class CommandPreview extends React.PureComponent {
	static propTypes = {
		onPress: PropTypes.func,
		item: PropTypes.object
	};

	constructor(props) {
		super(props);
		this.state = { loading: true };
	}

	render() {
		const { onPress, item } = this.props;
		const { loading } = this.state;
		return (
			<TouchableOpacity
				style={styles.commandPreview}
				onPress={() => onPress(item)}
				testID={`command-preview-item${ item.id }`}
			>
				{item.type === 'image'
					? (
						<FastImage
							style={styles.commandPreviewImage}
							source={{ uri: item.value }}
							resizeMode={FastImage.resizeMode.cover}
							onLoadStart={() => this.setState({ loading: true })}
							onLoad={() => this.setState({ loading: false })}
						>
							{ loading ? <ActivityIndicator /> : null }
						</FastImage>
					)
					: <CustomIcon name='file-generic' size={36} color={COLOR_PRIMARY} />
				}
			</TouchableOpacity>
		);
	}
}
