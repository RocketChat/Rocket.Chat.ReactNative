import Foundation

protocol StoreInterface {
	static func register<T>(_ type: T.Type, factory: @autoclosure @escaping () -> T)
	static func resolve<T>(_ type: T.Type) -> T?
}

final class Store: StoreInterface {
	private static var factories: [ObjectIdentifier: () -> Any] = [:]
	private static var cache: [ObjectIdentifier: Any] = [:]
	
	static func register<T>(_ type: T.Type, factory: @autoclosure @escaping () -> T) {
		let identifier = ObjectIdentifier(type)
		factories[identifier] = factory
	}
	
	static func resolve<T>(_ type: T.Type) -> T? {
		let identifier = ObjectIdentifier(type)
		
		if let dependency = cache[identifier] {
			return dependency as? T
		} else {
			let dependency = factories[identifier]?() as? T
			
			if let dependency {
				cache[identifier] = dependency
			}
			
			return dependency
		}
	}
}

private final class WeakRef<T: AnyObject> {
	weak var value: T?
	
	init(value: T) {
		self.value = value
	}
}
