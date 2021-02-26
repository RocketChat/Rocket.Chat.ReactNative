import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import Avatar from './Avatar';

class AvatarContainer extends React.Component {
	static propTypes = {
		rid: PropTypes.string,
		text: PropTypes.string,
		type: PropTypes.string,
		blockUnauthenticatedAccess: PropTypes.bool,
		serverVersion: PropTypes.string
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

	componentDidUpdate(prevProps) {
		const { text, type } = this.props;
		if (prevProps.text !== text || prevProps.type !== type) {
			this.init();
		}
	}

	componentWillUnmount() {
		if (this.subscription?.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	get isDirect() {
		const { type } = this.props;
		return type === 'd';
	}

	init = async() => {
		const db = database.active;
		const usersCollection = db.get('users');
		const subsCollection = db.get('subscriptions');

		let record;
		try {
			if (this.isDirect) {
				const { text } = this.props;
				const [user] = await usersCollection.query(Q.where('username', text)).fetch();
				record = user;
			} else {
				const { rid } = this.props;
				record = await subsCollection.find(rid);
			}
		} catch {
			// Record not found
		}

		if (record) {
			const observable = record.observe();
			this.subscription = observable.subscribe((r) => {
				const { avatarETag } = r;
				if (this.mounted) {
					this.setState({ avatarETag });
				} else {
					this.state.avatarETag = avatarETag;
				}
			});
		}
	}

	render() {
		const { avatarETag } = this.state;
		const { serverVersion } = this.props;
		return (
			<Avatar
				avatarETag={avatarETag}
				serverVersion={serverVersion}
				{...this.props}
			/>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.share.server.server || state.server.server,
	serverVersion: state.share.server.version || state.server.version,
	blockUnauthenticatedAccess:
		state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess
		?? state.settings.Accounts_AvatarBlockUnauthenticatedAccess
		?? true
});
export default connect(mapStateToProps)(AvatarContainer);
