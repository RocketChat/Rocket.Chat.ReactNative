import UAParser from 'ua-parser-js';
import setHeader from '../Components/header';
import RocketChat from '../../../lib/rocketchat';

const loadVisitor = async(state, props, setState) => {
	const { roomUser, room, showEdit } = state;
	const { navigation, route } = props;

	try {
		const result = await RocketChat.getVisitorInfo(room?.visitor?._id);
		if (result.success) {
			const { visitor } = result;
			if (visitor.userAgent) {
				const ua = new UAParser();
				ua.setUA(visitor.userAgent);
				visitor.os = `${ ua.getOS().name } ${ ua.getOS().version }`;
				visitor.browser = `${ ua.getBrowser().name } ${ ua.getBrowser().version }`;
			}
			setState({ roomUser: visitor }, () => setHeader(roomUser, room, showEdit, navigation, route));
		}
	} catch (error) {
		// Do nothing
	}
};

export default loadVisitor;
