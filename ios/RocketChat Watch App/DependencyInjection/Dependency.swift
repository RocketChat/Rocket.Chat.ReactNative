@propertyWrapper
struct Dependency<T> {
	var wrappedValue: T {
		guard let dependency = Store.resolve(T.self) else {
			fatalError("No service of type \(ObjectIdentifier(T.self)) registered!")
		}
		
		return dependency
	}
}
