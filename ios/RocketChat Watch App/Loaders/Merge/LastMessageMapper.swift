extension MergedRoom.Message {
	init?(from newMessage: MessageResponse?) {
		guard let newMessage else {
			return nil
		}
		
		_id = newMessage._id
		rid = newMessage.rid
		msg = newMessage.msg
		u = .init(from: newMessage.u)
		ts = newMessage.ts
		attachments = newMessage.attachments?.map { .init(from: $0) }
		t = newMessage.t
		groupable = newMessage.groupable
		editedAt = newMessage.editedAt
		role = newMessage.role
		comment = newMessage.comment
	}
}

extension MergedRoom.Message.User {
	init(from user: UserResponse) {
		_id = user._id
		username = user.username
		name = user.name
	}
}

extension MergedRoom.Message.Attachment {
	init(from attachment: AttachmentResponse) {
		title = attachment.title
		imageURL = attachment.imageURL
		audioURL = attachment.audioURL
		description = attachment.description
		dimensions = .init(from: attachment.dimensions)
	}
}

extension MergedRoom.Message.Attachment.Dimensions {
	init?(from dimensions: DimensionsResponse?) {
		guard let dimensions else {
			return nil
		}
		
		width = dimensions.width
		height = dimensions.height
	}
}
