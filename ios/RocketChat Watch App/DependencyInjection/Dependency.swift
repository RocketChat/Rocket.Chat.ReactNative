@propertyWrapper
struct Dependency<T> {
	private var dependency: T

	init() {
		guard let dependency = Store.resolve(T.self) else {
			fatalError("No service of type \(T.self) registered!")
		}

		self.dependency = dependency
	}

	var wrappedValue: T {
		get {
			dependency
		}
		mutating set {
			dependency = newValue
		}
	}
}
