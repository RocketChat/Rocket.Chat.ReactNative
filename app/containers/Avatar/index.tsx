import React from 'react';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { Observable, Subscription } from 'rxjs';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { IApplicationState, TSubscriptionModel, TUserModel } from '../../definitions';
import Avatar from './Avatar';
import { IAvatar } from './interfaces';

class AvatarContainer extends React.Component<IAvatar, any> {
	private subscription?: Subscription;

	static defaultProps = {
		text: '',
		type: 'd'
	};

	constructor(props: IAvatar) {
		super(props);
		this.state = { avatarETag: '' };
		this.init();
	}

	componentDidUpdate(prevProps: IAvatar) {
		const { text, type } = this.props;
		if (prevProps.text !== text || prevProps.type !== type) {
			this.init();
		}
	}

	shouldComponentUpdate(nextProps: IAvatar, nextState: { avatarETag: string }) {
		const { avatarETag } = this.state;
		const { text, type, externalProviderUrl } = this.props;
		if (nextProps.externalProviderUrl !== externalProviderUrl) {
			return true;
		}
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
				this.setState({ avatarETag });
			});
		}
	};

	render() {
		const { avatarETag } = this.state;
		const { serverVersion } = this.props;
		return <Avatar {...this.props} avatarETag={avatarETag} serverVersion={serverVersion} />;
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	server: state.share.server.server || state.server.server,
	serverVersion: state.share.server.version || state.server.version,
	blockUnauthenticatedAccess:
		(state.share.settings?.Accounts_AvatarBlockUnauthenticatedAccess as boolean) ??
		state.settings.Accounts_AvatarBlockUnauthenticatedAccess ??
		true,
	externalProviderUrl: state.settings.Accounts_AvatarExternalProviderUrl as string
});
export default connect(mapStateToProps)(AvatarContainer);
