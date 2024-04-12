extension MergedRoom.LastMessage {
	init?(from lastMessage: MessageResponse?) {
		guard let lastMessage else {
			return nil
		}
		
		_id = lastMessage._id
		rid = lastMessage.rid
		msg = lastMessage.msg
		u = .init(from: lastMessage.u)
		ts = lastMessage.ts
		attachments = lastMessage.attachments?.map { .init(from: $0) }
		t = lastMessage.t
		groupable = lastMessage.groupable
		editedAt = lastMessage.editedAt
		role = lastMessage.role
		comment = lastMessage.comment
	}
}

extension MergedRoom.LastMessage.User {
	init(from user: UserResponse) {
		_id = user._id
		username = user.username
		name = user.name
	}
}

extension MergedRoom.LastMessage.Attachment {
	init(from attachment: AttachmentResponse) {
		title = attachment.title
		imageURL = attachment.imageURL
		audioURL = attachment.audioURL
		description = attachment.description
		dimensions = .init(from: attachment.dimensions)
	}
}

extension MergedRoom.LastMessage.Attachment.Dimensions {
	init?(from dimensions: DimensionsResponse?) {
		guard let dimensions else {
			return nil
		}
		
		width = dimensions.width
		height = dimensions.height
	}
}
