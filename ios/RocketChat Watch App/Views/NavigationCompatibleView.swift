import SwiftUI

struct NavigationCompatibleView<Content: View>: View {
	private let content: () -> Content
	
	init(@ViewBuilder content: @escaping () -> Content) {
		self.content = content
	}
	
	var body: some View {
		if #available(watchOS 10.0, *) {
			NavigationStack {
				content()
			}
		} else {
			NavigationView {
				content()
			}
		}
	}
}
