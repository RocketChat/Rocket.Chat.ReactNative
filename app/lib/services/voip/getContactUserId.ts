import type { CallContact } from '@rocket.chat/media-signaling';

/** The Rocket.Chat user behind a call contact: `uid` when the server sends it (e.g. a user dialed by extension), else the id of a `user` contact. */
export const getContactUserId = (contact: CallContact | undefined): string | undefined => {
	if (contact?.uid) {
		return contact.uid;
	}

	if (contact?.type === 'user' && contact.id) {
		return contact.id;
	}

	return undefined;
};
