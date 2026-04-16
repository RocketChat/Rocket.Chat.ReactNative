import Contacts
import UIKit

final class CallerContactManager {

    // MARK: - Private constants

    private static let contactQueue = DispatchQueue(label: "chat.rocket.callercontact", qos: .userInitiated)
    private static let contactStore = CNContactStore()
    private static let orgTag = "Rocket.Chat VoIP"

    // MARK: - Public API

    /// Creates a temporary CNContact so CallKit can display a caller avatar.
    /// Completion is called with the synthetic phone number on success, or nil on failure.
    static func createTemporaryContact(
        callerName: String,
        username: String,
        avatarUrl: String,
        callId: String,
        completion: @escaping (String?) -> Void
    ) {
        // Only check — never request — authorization.
        guard CNContactStore.authorizationStatus(for: .contacts) == .authorized else {
            completion(nil)
            return
        }

        let number = syntheticPhoneNumber(for: username)

        // Download avatar first, then write to Contacts on the serial queue.
        downloadAvatar(from: avatarUrl) { imageData in
            contactQueue.async {
                do {
                    let contact = CNMutableContact()
                    contact.givenName = callerName
                    contact.organizationName = orgTag
                    contact.note = "rc-voip-temp-\(callId)"
                    contact.imageData = imageData

                    let phoneNumber = CNLabeledValue(
                        label: CNLabelPhoneNumberMain,
                        value: CNPhoneNumber(stringValue: number)
                    )
                    contact.phoneNumbers = [phoneNumber]

                    let saveRequest = CNSaveRequest()
                    saveRequest.add(contact, toContainerWithIdentifier: nil)
                    try contactStore.execute(saveRequest)

                    completion(number)
                } catch {
                    #if DEBUG
                    print("RocketChat.CallerContactManager createTemporaryContact error: \(error)")
                    #endif
                    completion(nil)
                }
            }
        }
    }

    /// Removes the temporary contact created for the given call id.
    static func removeContact(forCallId callId: String) {
        contactQueue.async {
            do {
                let keysToFetch: [CNKeyDescriptor] = [
                    CNContactOrganizationNameKey as CNKeyDescriptor,
                    CNContactNoteKey as CNKeyDescriptor
                ]
                let predicate = CNContact.predicateForContacts(matchingName: orgTag)
                let candidates = try contactStore.unifiedContacts(matching: predicate, keysToFetch: keysToFetch)

                let saveRequest = CNSaveRequest()
                var found = false
                for contact in candidates {
                    guard contact.organizationName == orgTag,
                          contact.note.contains(callId) else { continue }
                    guard let mutable = contact.mutableCopy() as? CNMutableContact else { continue }
                    saveRequest.delete(mutable)
                    found = true
                }

                if found {
                    try contactStore.execute(saveRequest)
                }
            } catch {
                #if DEBUG
                print("RocketChat.CallerContactManager removeContact(forCallId:) error: \(error)")
                #endif
            }
        }
    }

    /// Removes ALL temporary contacts created by this manager. Call on app launch as an orphan sweep.
    static func removeTemporaryContacts() {
        contactQueue.async {
            do {
                let keysToFetch: [CNKeyDescriptor] = [
                    CNContactOrganizationNameKey as CNKeyDescriptor
                ]
                let predicate = CNContact.predicateForContacts(matchingName: orgTag)
                let candidates = try contactStore.unifiedContacts(matching: predicate, keysToFetch: keysToFetch)

                let saveRequest = CNSaveRequest()
                var found = false
                for contact in candidates {
                    guard contact.organizationName == orgTag else { continue }
                    guard let mutable = contact.mutableCopy() as? CNMutableContact else { continue }
                    saveRequest.delete(mutable)
                    found = true
                }

                if found {
                    try contactStore.execute(saveRequest)
                }
            } catch {
                #if DEBUG
                print("RocketChat.CallerContactManager removeTemporaryContacts error: \(error)")
                #endif
            }
        }
    }

    /// Returns a deterministic synthetic phone number for the given username.
    /// Format: `+00000` followed by a 10-digit zero-padded hash.
    /// Uses a stable hash (djb2) instead of `String.hashValue` which is randomized per launch.
    static func syntheticPhoneNumber(for username: String) -> String {
        var hash: UInt64 = 5381
        for byte in username.utf8 {
            hash = ((hash &<< 5) &+ hash) &+ UInt64(byte)
        }
        let digits = hash % 10_000_000_000
        return "+00000\(String(format: "%010llu", digits))"
    }

    /// Requests access to the Contacts framework. Must be called from the app context (never from PushKit).
    /// Returns "authorized" or "denied" via the completion handler.
    static func requestAccess(completion: @escaping (String) -> Void) {
        contactStore.requestAccess(for: .contacts) { granted, _ in
            completion(granted ? "authorized" : "denied")
        }
    }

    // MARK: - Private helpers

    /// Downloads avatar data from a URL with a 5-second timeout and a 1 MB size cap.
    /// Resizes to at most 400×400 before returning PNG data. Returns nil on any failure.
    private static func downloadAvatar(from urlString: String, completion: @escaping (Data?) -> Void) {
        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }

        var request = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 5)
        request.httpMethod = "GET"

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                #if DEBUG
                print("RocketChat.CallerContactManager avatar download error: \(error)")
                #endif
                completion(nil)
                return
            }

            guard
                let httpResponse = response as? HTTPURLResponse,
                httpResponse.statusCode == 200,
                let data = data,
                data.count <= 1_048_576
            else {
                #if DEBUG
                print("RocketChat.CallerContactManager avatar download: invalid response or data too large")
                #endif
                completion(nil)
                return
            }

            guard let image = UIImage(data: data) else {
                completion(nil)
                return
            }

            let resized = resizeIfNeeded(image, maxDimension: 400)
            completion(resized.pngData())
        }
        task.resume()
    }

    /// Returns a copy of the image scaled down so neither dimension exceeds `maxDimension`.
    /// Returns the original if it already fits.
    private static func resizeIfNeeded(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        guard size.width > maxDimension || size.height > maxDimension else {
            return image
        }

        let scale = min(maxDimension / size.width, maxDimension / size.height)
        let targetSize = CGSize(width: size.width * scale, height: size.height * scale)

        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}
