import React from 'react';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { Observable, Subscription } from 'rxjs';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { TSubscriptionModel, TUserModel } from '../../definitions';
import Avatar from './Avatar';
import { IAvatar } from './interfaces';

class AvatarContainer extends React.Component<IAvatar, any> {
	private mounted: boolean;

	private subscription?: Subscription;

	static defaultProps = {
		text: '',
		type: 'd'
	};

	constructor(props: IAvatar) {
		super(props);
		this.mounted = false;
		this.state = { avatarETag: '' };
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentDidUpdate(prevProps: any) {
		const { text, type } = this.props;
		if (prevProps.text !== text || prevProps.type !== type) {
			this.init();
		}
	}

	shouldComponentUpdate(nextProps: IAvatar, nextState: { avatarETag: string }) {
		const { avatarETag } = this.state;
		const { text, type } = this.props;
		if (nextState.avatarETag !== avatarETag) {
			return true;
		}
		if (nextProps.text !== text) {
			return true;
		}
		if (nextProps.type !== type) {
			return true;
		}
		return false;
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

	init = async () => {
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
				if (rid) {
					record = await subsCollection.find(rid);
				}
			}
		} catch {
			// Record not found
		}

		if (record) {
			const observable = record.observe() as Observable<TSubscriptionModel | TUserModel>;
			this.subscription = observable.subscribe(r => {
				const { avatarETag } = r;
				if (this.mounted) {
					this.setState({ avatarETag });
				} else {
					// @ts-ignore
					this.state.avatarETag = avatarETag;
				}
			});
		}
	};

	render() {
		const { avatarETag } = this.state;
		const { serverVersion } = this.props;
		return <Avatar {...this.props} avatarETag={avatarETag} serverVersion={serverVersion} />;
	}
}

const mapStateToProps = (state: any) => ({
	user: getUserSelector(state),
	server: state.share.server.server || state.server.server,
	serverVersion: state.share.server.version || state.server.version,
	blockUnauthenticatedAccess:
		state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess ??
		state.settings.Accounts_AvatarBlockUnauthenticatedAccess ??
		true
});
export default connect(mapStateToProps)(AvatarContainer);
