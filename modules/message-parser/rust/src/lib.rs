use std::any::Any;
use std::thread;

use message_parser::{parse, Options};

const PARSE_THREAD_STACK_BYTES: usize = 8 * 1024 * 1024;

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MessageParserStatus {
    Ok = 0,
    InvalidOptions = 1,
    Failed = 2,
}

#[repr(C)]
pub struct MessageParserOutput {
    pub status: MessageParserStatus,
    pub bytes: *mut u8,
    pub length: usize,
}

impl MessageParserOutput {
    fn new(status: MessageParserStatus, text: String) -> Self {
        let bytes = Box::into_raw(text.into_bytes().into_boxed_slice());
        MessageParserOutput {
            status,
            bytes: bytes.cast::<u8>(),
            length: bytes.len(),
        }
    }
}

fn parse_to_json(input: &[u8], options_json: &[u8]) -> (MessageParserStatus, String) {
    let options: Options = match serde_json::from_slice(options_json) {
        Ok(options) => options,
        Err(error) => return (MessageParserStatus::InvalidOptions, error.to_string()),
    };
    let text = String::from_utf8_lossy(input).into_owned();

    let parse_thread = thread::Builder::new()
        .name("message-parser".into())
        .stack_size(PARSE_THREAD_STACK_BYTES)
        .spawn(move || serde_json::to_string(&parse(&text, &options)));

    match parse_thread.map(|handle| handle.join()) {
        Ok(Ok(Ok(json))) => (MessageParserStatus::Ok, json),
        Ok(Ok(Err(error))) => (MessageParserStatus::Failed, error.to_string()),
        Ok(Err(panic)) => (MessageParserStatus::Failed, panic_message(panic.as_ref())),
        Err(error) => (MessageParserStatus::Failed, error.to_string()),
    }
}

fn panic_message(panic: &(dyn Any + Send)) -> String {
    panic
        .downcast_ref::<&str>()
        .map(|message| message.to_string())
        .or_else(|| panic.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "message parser panicked".to_string())
}

unsafe fn borrowed_bytes<'a>(bytes: *const u8, length: usize) -> &'a [u8] {
    if bytes.is_null() || length == 0 {
        &[]
    } else {
        std::slice::from_raw_parts(bytes, length)
    }
}

/// # Safety
///
/// `input` and `options_json` must each be null or point to `*_length` readable bytes.
#[no_mangle]
pub unsafe extern "C" fn rocketchat_message_parser_parse(
    input: *const u8,
    input_length: usize,
    options_json: *const u8,
    options_json_length: usize,
) -> MessageParserOutput {
    let (status, text) = parse_to_json(
        borrowed_bytes(input, input_length),
        borrowed_bytes(options_json, options_json_length),
    );
    MessageParserOutput::new(status, text)
}

/// # Safety
///
/// `output` must come from `rocketchat_message_parser_parse` and be freed once.
#[no_mangle]
pub unsafe extern "C" fn rocketchat_message_parser_free(output: MessageParserOutput) {
    if !output.bytes.is_null() {
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
            output.bytes,
            output.length,
        )));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_json(input: &str, options_json: &str) -> serde_json::Value {
        let (status, json) = parse_to_json(input.as_bytes(), options_json.as_bytes());
        assert_eq!(status, MessageParserStatus::Ok, "{json}");
        serde_json::from_str(&json).unwrap()
    }

    #[test]
    fn serializes_the_upstream_ast_shape() {
        assert_eq!(
            parse_json("**hi**", "{}"),
            serde_json::json!([{
                "type": "PARAGRAPH",
                "value": [{ "type": "BOLD", "value": [{ "type": "PLAIN_TEXT", "value": "hi" }] }]
            }])
        );
    }

    #[test]
    fn applies_the_parse_options() {
        let without = parse_json("hi :)", "{}").to_string();
        let with = parse_json("hi :)", r#"{"emoticons":true}"#).to_string();
        assert!(!without.contains("EMOJI"));
        assert!(with.contains("EMOJI"));
    }

    #[test]
    fn replaces_invalid_utf8_instead_of_failing() {
        let (status, json) = parse_to_json(b"a\xED\xA0\x80b", b"{}");
        assert_eq!(status, MessageParserStatus::Ok);
        assert!(json.contains("a\u{FFFD}\u{FFFD}\u{FFFD}b"));
    }

    #[test]
    fn parses_the_deepest_spoiler_emoticon_chain_on_its_own_stack() {
        parse_json(&"||:)".repeat(2_000), r#"{"emoticons":true}"#);
    }
}
