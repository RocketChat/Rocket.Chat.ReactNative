extension String {
	static func random(_ count: Int) -> String {
		let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
		return String((0..<count).compactMap { _ in letters.randomElement() })
	}
}
