import SwiftUI

struct FontWeightModifier: ViewModifier {
	@Environment(\.font) var font
	
	private let weight: Font.Weight
	
	init(_ weight: Font.Weight) {
		self.weight = weight
	}

	func body(content: Content) -> some View {
		content
			.font(font?.weight(weight))
	}
}

struct ItalicModifier: ViewModifier {
	@Environment(\.font) var font

	func body(content: Content) -> some View {
		content
			.font(font?.italic())
	}
}

extension View {
	func fontWeight(_ weight: Font.Weight) -> some View {
		modifier(FontWeightModifier(weight))
	}
	
	func italic() -> some View {
		modifier(ItalicModifier())
	}
}
