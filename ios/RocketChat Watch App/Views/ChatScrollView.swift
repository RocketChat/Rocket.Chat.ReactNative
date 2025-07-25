import SwiftUI

/// We need to reverse the scroll view to make it look like a Chat list.
/// Since we want to support older WatchOS versions, we made this wrapper to rotate the scroll view, when we can't use defaultScrollAnchor modifier.
/// It should do the trick for older WatchOS versions and have the native implementation for newer ones.
/// We hide the indicators for the flipped scroll view, since they appear reversed.
struct ChatScrollView<Content: View>: View {
	private let content: () -> Content
	
	init(@ViewBuilder content: @escaping () -> Content) {
		self.content = content
	}
	
	var body: some View {
		if #available(watchOS 10.0, *) {
			ScrollView {
				content()
			}
			.defaultScrollAnchor(.bottom)
		} else {
			ScrollView(showsIndicators: false) {
				content()
					.rotationEffect(.degrees(180))
			}
			.rotationEffect(.degrees(180))
		}
	}
}
