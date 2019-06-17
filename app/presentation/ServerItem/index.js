import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { connect } from 'react-redux';

import Touch from '../../utils/touch';
import log from '../../utils/log';
import Check from '../../containers/Check';
import styles from './styles';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

@connect(state => ({
	server: state.server.server
}))
/** @extends React.Component */
export default class ServerItem extends React.Component {
	static propTypes = {
		onPress: PropTypes.func.isRequired,
		item: PropTypes.object.isRequired,
		hasCheck: PropTypes.bool,
		disclosure: PropTypes.bool,
		server: PropTypes.string
	}

	render() {
		const {
			server, item, onPress, hasCheck, disclosure
		} = this.props;

		return (
			<Touch onPress={onPress} style={styles.serverItem} testID={`rooms-list-header-server-${ item.id }`}>
				<View style={styles.serverItemContainer}>
					{item.iconURL
						? (
							<FastImage
								source={{
									uri: item.iconURL,
									priority: FastImage.priority.high
								}}
								defaultSource={{ uri: 'logo' }}
								style={styles.serverIcon}
								onError={() => log('error loading serverIcon')}
							/>
						)
						: (
							<FastImage
								source={{ uri: 'logo' }}
								style={styles.serverIcon}
							/>
						)
					}
					<View style={styles.serverTextContainer}>
						<Text style={styles.serverName}>{item.name || item.id}</Text>
						<Text style={styles.serverUrl}>{item.id}</Text>
					</View>
					{item.id === server && hasCheck ? <Check /> : null}
					{disclosure ? <DisclosureIndicator /> : null}
				</View>
			</Touch>
		);
	}
}
