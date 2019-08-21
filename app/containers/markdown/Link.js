import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';
import urlParse from 'url-parse';

import styles from './styles';
import openLink from '../../utils/openLink';

export default class Link extends PureComponent {
	static propTypes = {
		link: PropTypes.string
	};

	handlePress = () => {
		const { link } = this.props;

		if (!link) {
			return;
		}

		openLink(link);
	};

	parseLinkLiteral = (literal) => {
		let nextLiteral = literal;

		const WWW_REGEX = /\b^(?:www.)/i;
		if (nextLiteral.match(WWW_REGEX)) {
			nextLiteral = literal.replace(WWW_REGEX, 'www.');
		}

		const parsed = urlParse(nextLiteral, {});

		return parsed.href;
	};

	render() {
		const { link } = this.props;

		return (
			<Text
				onPress={this.handlePress}
				style={styles.link}
			>
				{link}
			</Text>
		);
	}
}
