import isEmpty from 'lodash/isEmpty';
import RocketChat from '../../../lib/rocketchat';

const createDirect = (setState, props) => new Promise(async(resolve, reject) => {
	const { route } = props;

	// We don't need to create a direct
	const member = route.params?.member;
	if (!isEmpty(member)) {
		return resolve();
	}

	// TODO: Check if some direct with the user already exists on database
	try {
		const { roomUser: { username } } = this.state;
		const result = await RocketChat.createDirectMessage(username);
		if (result.success) {
			const { room: { rid } } = result;
			return setState(({ room }) => ({ room: { ...room, rid } }), resolve);
		}
	} catch {
		// do nothing
	}
	reject();
});

export default createDirect;
