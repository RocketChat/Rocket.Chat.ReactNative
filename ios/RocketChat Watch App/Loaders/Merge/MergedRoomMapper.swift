extension MergedRoom {
	init(_ subscription: SubscriptionsResponse.Subscription, _ room: RoomsResponse.Room?) {
		id = subscription._id
		name = subscription.name ?? room?.fname
		fname = subscription.fname
		t = subscription.t
		unread = subscription.unread
		alert = subscription.alert
		lr = subscription.lr
		open = subscription.open
		rid = subscription.rid
		hideUnreadStatus = subscription.hideUnreadStatus

		if let room {
			if room._updatedAt != nil {
				updatedAt = room._updatedAt
				lastMessage = .init(from: room.lastMessage?.value)
				archived = room.archived ?? false
				usernames = room.usernames
				uids = room.uids
			} else {
				updatedAt = nil
				lastMessage = nil
				archived = nil
				usernames = nil
				uids = nil
			}
			
			let lastRoomUpdate = room.lm ?? room.ts ?? subscription._updatedAt
			
			if let lr = subscription.lr, let lastRoomUpdate {
				ts = max(lr, lastRoomUpdate)
			} else {
				ts = lastRoomUpdate
			}
			
			isReadOnly = room.ro ?? false
			broadcast = room.broadcast
			encrypted = room.encrypted
			teamMain = room.teamMain
			prid = room.prid
			lm = room.lm
		} else {
			updatedAt = nil
			lastMessage = nil
			archived = nil
			usernames = nil
			uids = nil
			ts = nil
			isReadOnly = nil
			broadcast = nil
			encrypted = nil
			teamMain = nil
			prid = nil
			lm = nil
		}
	}
}
