import SwiftUI

extension Binding where Value == Bool {
	init<Wrapped>(bindingOptional: Binding<Wrapped?>) {
		self.init(
			get: {
				bindingOptional.wrappedValue != nil
			},
			set: { newValue in
				guard newValue == false else { return }
				
				/// We only handle `false` booleans to set our optional to `nil`
				/// as we can't handle `true` for restoring the previous value.
				bindingOptional.wrappedValue = nil
			}
		)
	}
}

extension Binding {
	func mappedToBool<Wrapped>() -> Binding<Bool> where Value == Wrapped? {
		Binding<Bool>(bindingOptional: self)
	}
}
