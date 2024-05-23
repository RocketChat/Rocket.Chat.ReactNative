import Combine

typealias CancelBag = Set<AnyCancellable>

extension CancelBag {
	mutating func cancelAll() {
		forEach { $0.cancel() }
		removeAll()
	}
}
