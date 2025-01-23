//
//  ShareRocketChatRN.swift
//  ShareRocketChatRN
//
//  Created by Diego Mello on 8/15/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import UIKit
import MobileCoreServices

class ShareRocketChatRN: UIViewController {
    let appScheme = "rocketchat"

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            self.completeRequest()
            return
        }

        // Handle URL or Text using the first attachment only
        if let firstAttachment = attachments.first {
            if firstAttachment.hasItemConformingToTypeIdentifier("public.url") {
                firstAttachment.loadItem(forTypeIdentifier: "public.url", options: nil) { (data, error) in
                    if let url = data as? URL {
                        if url.isFileURL {
                            // Handle all file URLs
                            self.handleAllFileURLs(items: attachments)
                        } else {
                            // Handle as a web URL
                            self.handleUrl(item: firstAttachment)
                        }
                    }
                }
                return
            } else if firstAttachment.hasItemConformingToTypeIdentifier("public.text") {
                self.handleText(item: firstAttachment)
                return
            }
        }

        // Handle Media (Images, Videos) and Data (PDFs, etc.) for all attachments
        self.handleMultipleMediaAndData(items: attachments)
    }

    private func handleText(item: NSItemProvider) {
        item.loadItem(forTypeIdentifier: "public.text", options: nil) { (data, error) in
            if let text = data as? String {
                if let encoded = text.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
                   let url = URL(string: "\(self.appScheme)://shareextension?text=\(encoded)") {
                    _ = self.openURL(url)
                }
            }
            self.completeRequest()
        }
    }

    private func handleUrl(item: NSItemProvider) {
        item.loadItem(forTypeIdentifier: "public.url", options: nil) { (data, error) in
            if let url = data as? URL {
                if let encoded = url.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
                   let finalUrl = URL(string: "\(self.appScheme)://shareextension?url=\(encoded)") {
                    _ = self.openURL(finalUrl)
                }
            }
            self.completeRequest()
        }
    }

    private func handleAllFileURLs(items: [NSItemProvider]) {
        var fileUris = [String]()
        let dispatchGroup = DispatchGroup()

        for item in items {
            dispatchGroup.enter()
            item.loadItem(forTypeIdentifier: "public.data", options: nil) { (data, error) in
                if let fileUrl = data as? URL, fileUrl.isFileURL {
                    do {
                        let fileData = try Data(contentsOf: fileUrl)
                        let originalFilename = fileUrl.lastPathComponent
                        let savedUrl = self.saveDataToSharedContainer(data: fileData, filename: originalFilename)
                        if let finalUrl = savedUrl?.absoluteString {
                            fileUris.append(finalUrl)
                        }
                    } catch {
                        // Handle error
                    }
                }
                dispatchGroup.leave()
            }
        }

        dispatchGroup.notify(queue: .main) {
            let combinedFileUris = fileUris.joined(separator: ",")
            if let encoded = combinedFileUris.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
            let url = URL(string: "\(self.appScheme)://shareextension?mediaUris=\(encoded)") {
                _ = self.openURL(url)
            }
            self.completeRequest()
        }
    }


    private func handleMultipleMediaAndData(items: [NSItemProvider]) {
        var mediaUris = [String]()
        let dispatchGroup = DispatchGroup()

        for (_, item) in items.enumerated() {
            dispatchGroup.enter()

            if item.hasItemConformingToTypeIdentifier("public.image") {
                self.loadAndSaveItem(item: item, type: "public.image", dispatchGroup: dispatchGroup) { mediaUriInfo in
                    if let mediaUriInfo = mediaUriInfo {
                        mediaUris.append(mediaUriInfo)
                    }
                }
            } else if item.hasItemConformingToTypeIdentifier("public.movie") {
                self.loadAndSaveItem(item: item, type: "public.movie", dispatchGroup: dispatchGroup) { mediaUriInfo in
                    if let mediaUriInfo = mediaUriInfo {
                        mediaUris.append(mediaUriInfo)
                    }
                }
            } else if item.hasItemConformingToTypeIdentifier("public.data") {
                self.loadAndSaveItem(item: item, type: "public.data", dispatchGroup: dispatchGroup) { mediaUriInfo in
                    if let mediaUriInfo = mediaUriInfo {
                        mediaUris.append(mediaUriInfo)
                    }
                }
            } else {
                dispatchGroup.leave()
            }
        }

        dispatchGroup.notify(queue: .main) {
            let combinedMediaUris = mediaUris.joined(separator: ",")
            if let encoded = combinedMediaUris.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
               let url = URL(string: "\(self.appScheme)://shareextension?mediaUris=\(encoded)") {
                _ = self.openURL(url)
            }
            self.completeRequest()
        }
    }

    private func loadAndSaveItem(item: NSItemProvider, type: String, dispatchGroup: DispatchGroup, completion: @escaping (String?) -> Void) {
        item.loadItem(forTypeIdentifier: type, options: nil) { (data, error) in
            var mediaUriInfo: String?

            if let dataUri = data as? URL {
                do {
                    let data = try Data(contentsOf: dataUri)
                    let originalFilename = dataUri.lastPathComponent
                    let savedUrl = self.saveDataToSharedContainer(data: data, filename: originalFilename)
                    mediaUriInfo = savedUrl?.absoluteString
                } catch {
                    mediaUriInfo = nil
                }
            } else if let data = data as? Data {
                if let fileExtension = self.inferFileExtension(from: item) {
                    let filename = UUID().uuidString + "." + fileExtension
                    let savedUrl = self.saveDataToSharedContainer(data: data, filename: filename)
                    mediaUriInfo = savedUrl?.absoluteString
                }
            } else if let image = data as? UIImage {
                if let imageData = image.pngData() {
                    let filename = UUID().uuidString + ".png"
                    let savedUrl = self.saveDataToSharedContainer(data: imageData, filename: filename)
                    mediaUriInfo = savedUrl?.absoluteString
                }
            }

            completion(mediaUriInfo)
            dispatchGroup.leave()
        }
    }

    private func saveDataToSharedContainer(data: Data, filename: String) -> URL? {
        guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String else {
            return nil
        }
        guard let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else {
            return nil
        }
        let fileURL = groupURL.appendingPathComponent(filename)
        do {
            try data.write(to: fileURL)
            return fileURL
        } catch {
            return nil
        }
    }

    private func inferFileExtension(from item: NSItemProvider) -> String? {
        if item.hasItemConformingToTypeIdentifier(kUTTypeImage as String) {
            return "jpeg"
        } else if item.hasItemConformingToTypeIdentifier(kUTTypeMovie as String) {
            return "mp4"
        } else if let typeIdentifier = item.registeredTypeIdentifiers.first as CFString? {
            if let utType = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, typeIdentifier, nil)?.takeRetainedValue() {
                if let preferredExtension = UTTypeCopyPreferredTagWithClass(utType, kUTTagClassFilenameExtension)?.takeRetainedValue() {
                    return preferredExtension as String
                }
            }
        }
        return nil
    }

    @objc private func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                return application.perform(#selector(openURL(_:)), with: url) != nil
            }
            responder = responder?.next
        }
        return false
    }

    private func completeRequest() {
        self.extensionContext?.completeRequest(returningItems: nil)
    }
}
