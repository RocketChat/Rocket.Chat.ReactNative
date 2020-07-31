import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import Component from './Avatar';

const Avatar = React.memo(({ type, text, ...props }) => {
	const [avatarETag, setAvatarETag] = useState();

	const subscribeAvatar = async() => {
		if (type === 'd') {
			const db = database.active;
			const usersCollection = db.collections.get('users');
			try {
				const [userRecord] = await usersCollection.query(Q.where('username', text)).fetch();
				if (userRecord) {
					const observable = userRecord.observe();
					observable.subscribe((u) => {
						setAvatarETag(u.avatarETag);
					});
				}
			} catch {
				// Do nothing
			}
		}
	};

	useEffect(() => {
		subscribeAvatar();
	}, []);

	return (
		<Component
			text={text}
			type={type}
			avatarETag={avatarETag}
			{...props}
		/>
	);
});
Avatar.propTypes = {
	text: PropTypes.string,
	type: PropTypes.string
};
Avatar.defaultProps = {
	text: '',
	type: 'd'
};

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.share.server || state.server.server
});
export default connect(mapStateToProps)(Avatar);
