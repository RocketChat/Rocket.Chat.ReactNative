import SwiftUI

struct ServerView: View {
	@ObservedObject var server: Server
	
	var body: some View {
		VStack(alignment: .leading) {
			Text(server.name)
				.font(.caption.bold())
				.foregroundStyle(Color.titleLabels)
			Text(server.url.host ?? "")
				.font(.caption)
				.foregroundStyle(Color.default)
		}
	}
}
