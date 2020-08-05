import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import Avatar from './Avatar';

class AvatarContainer extends React.Component {
	static propTypes = {
		text: PropTypes.string,
		type: PropTypes.string
	};

	static defaultProps = {
		text: '',
		type: 'd'
	};

	constructor(props) {
		super(props);
		this.mounted = false;
		this.state = { avatarETag: '' };
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		if (this.userSubscription?.unsubscribe) {
			this.userSubscription.unsubscribe();
		}
	}

	get isDirect() {
		const { type } = this.props;
		return type === 'd';
	}

	init = async() => {
		if (this.isDirect) {
			const { text } = this.props;
			const db = database.active;
			const usersCollection = db.collections.get('users');
			try {
				const [user] = await usersCollection.query(Q.where('username', text)).fetch();
				if (user) {
					const observable = user.observe();
					this.userSubscription = observable.subscribe((u) => {
						const { avatarETag } = u;
						if (this.mounted) {
							this.setState({ avatarETag });
						} else {
							this.state.avatarETag = avatarETag;
						}
					});
				}
			} catch {
				// User was not found
			}
		}
	}

	render() {
		const { avatarETag } = this.state;
		return (
			<Avatar
				avatarETag={avatarETag}
				{...this.props}
			/>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.share.server || state.server.server
});
export default connect(mapStateToProps)(AvatarContainer);
