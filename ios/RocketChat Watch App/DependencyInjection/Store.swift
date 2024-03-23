import Foundation

protocol StoreInterface {
	static func register<T>(_ type: T.Type, factory: @autoclosure @escaping () -> T)
	static func resolve<T>(_ type: T.Type) -> T?
}

final class Store: StoreInterface {
	private static var factories: [ObjectIdentifier: () -> Any] = [:]
	private static var cache: [ObjectIdentifier: WeakRef<AnyObject>] = [:]
	
	static func register<T>(_ type: T.Type, factory: @autoclosure @escaping () -> T) {
		let identifier = ObjectIdentifier(type)
		factories[identifier] = factory
		cache[identifier] = nil
	}
	
	static func resolve<T>(_ type: T.Type) -> T? {
		let identifier = ObjectIdentifier(type)
		
		if let dependency = cache[identifier]?.value {
			return dependency as? T
		} else {
			let dependency = factories[identifier]?() as? T
			
			if let dependency {
				cache[identifier] = WeakRef(value: dependency as AnyObject)
			}
			
			return dependency
		}
	}
}

private final class WeakRef<T: AnyObject> {
	private(set) weak var value: T?
	
	init(value: T) {
		self.value = value
	}
}
