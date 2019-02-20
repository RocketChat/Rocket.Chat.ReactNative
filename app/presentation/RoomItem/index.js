import withObservables from '@nozbe/with-observables';
import { connect } from 'react-redux';

import RoomItem from './RoomItem';

const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	showLastMessage: state.settings.Store_Last_Message
});

const enhance = withObservables(['item'], ({ item }) => ({
	item: item.observe()
}));
export default connect(mapStateToProps)(enhance(RoomItem));
