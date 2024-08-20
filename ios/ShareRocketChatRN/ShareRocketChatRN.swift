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
    // TODO: whitelabel?
    let appScheme = "rocketchat"

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments,
              let firstAttachment = attachments.first else {
            self.completeRequest()
            return
        }

        if firstAttachment.hasItemConformingToTypeIdentifier("public.data") {
            self.handleMedia(items: attachments, type: "public.data")
        } else if firstAttachment.hasItemConformingToTypeIdentifier("public.image") {
            self.handleMedia(items: attachments, type: "public.image")
        } else if firstAttachment.hasItemConformingToTypeIdentifier("public.movie") {
            self.handleMedia(items: attachments, type: "public.movie")
        } else if firstAttachment.hasItemConformingToTypeIdentifier("public.url") {
            self.handleUrl(item: firstAttachment)
        } else if firstAttachment.hasItemConformingToTypeIdentifier("public.text") {
            self.handleText(item: firstAttachment)
        } else {
            self.completeRequest()
        }
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

    private func handleMedia(items: [NSItemProvider], type: String) {
        var valid = true
        var mediaUris = ""

        let dispatchGroup = DispatchGroup()

        for (index, item) in items.enumerated() {
            var mediaUriInfo: String?

            dispatchGroup.enter()

            item.loadItem(forTypeIdentifier: type, options: nil) { (data, error) in
                if let dataUri = data as? URL {
                    do {
                        let data = try Data(contentsOf: dataUri)
                        let originalFilename = dataUri.lastPathComponent
                        let savedUrl = self.saveDataToSharedContainer(data: data, filename: originalFilename)
                        mediaUriInfo = savedUrl?.absoluteString
                    } catch {
                        valid = false
                    }
                } else if let data = data as? Data {
                    if let fileExtension = self.inferFileExtension(from: item) {
                        let filename = UUID().uuidString + "." + fileExtension
                        let savedUrl = self.saveDataToSharedContainer(data: data, filename: filename)
                        mediaUriInfo = savedUrl?.absoluteString
                    } else {
                        valid = false
                    }
                }

                if let mediaUriInfo = mediaUriInfo {
                    mediaUris.append(mediaUriInfo)
                    if index < items.count - 1 {
                        mediaUris.append(",")
                    }
                } else {
                    valid = false
                }

                dispatchGroup.leave()
            }
        }

        dispatchGroup.notify(queue: .main) {
            if valid,
               let encoded = mediaUris.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed),
               let url = URL(string: "\(self.appScheme)://shareextension?mediaUris=\(encoded)") {
                _ = self.openURL(url)
            }
            self.completeRequest()
        }
    }

    private func saveDataToSharedContainer(data: Data, filename: String) -> URL? {
        guard let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.ios.chat.rocket") else {
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
