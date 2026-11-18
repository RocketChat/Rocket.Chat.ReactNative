export function isRead(item: any): boolean {
	let isUnread = item.archived !== true && item.open === true;
	isUnread = isUnread && (item.unread > 0 || item.alert === true || item.tunread?.length > 0);
	return !isUnread;
}
