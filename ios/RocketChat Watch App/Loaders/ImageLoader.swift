import Combine
import Foundation
import UIKit

final class ImageLoader: ObservableObject {
	@Dependency private var client: RocketChatClientProtocol
	
	@Published private(set) var image: UIImage?
	
	private var cancellable: AnyCancellable?
	
	private let url: URL
	
	init(url: URL) {
		self.url = url
	}
	
	deinit {
		cancel()
	}

	func load() {
		cancellable = client.session.dataTaskPublisher(for: url)
			.map { UIImage(data: $0.data) }
			.replaceError(with: nil)
			.receive(on: DispatchQueue.main)
			.sink { [weak self] in self?.image = $0 }
	}
	
	func cancel() {
		cancellable?.cancel()
	}
}
