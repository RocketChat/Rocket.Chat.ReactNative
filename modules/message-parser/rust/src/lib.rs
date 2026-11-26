use std::any::Any;
use std::thread;

use message_parser::{parse, Options};

const PARSE_THREAD_STACK_BYTES: usize = 8 * 1024 * 1024;

#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    InvalidOptions(String),
    Failed(String),
}

pub fn parse_to_json(input: &[u8], options_json: &[u8]) -> Result<String, ParseError> {
    let options: Options = serde_json::from_slice(options_json)
        .map_err(|error| ParseError::InvalidOptions(error.to_string()))?;
    let text = String::from_utf8_lossy(input).into_owned();

    let parse_thread = thread::Builder::new()
        .name("message-parser".into())
        .stack_size(PARSE_THREAD_STACK_BYTES)
        .spawn(move || serde_json::to_string(&parse(&text, &options)))
        .map_err(|error| ParseError::Failed(error.to_string()))?;

    match parse_thread.join() {
        Ok(Ok(json)) => Ok(json),
        Ok(Err(error)) => Err(ParseError::Failed(error.to_string())),
        Err(panic) => Err(ParseError::Failed(panic_message(panic.as_ref()))),
    }
}

fn panic_message(panic: &(dyn Any + Send)) -> String {
    panic
        .downcast_ref::<&str>()
        .map(|message| message.to_string())
        .or_else(|| panic.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "message parser panicked".to_string())
}

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
    let input = borrowed_bytes(input, input_length);
    let options_json = borrowed_bytes(options_json, options_json_length);
    match parse_to_json(input, options_json) {
        Ok(json) => MessageParserOutput::new(MessageParserStatus::Ok, json),
        Err(ParseError::InvalidOptions(message)) => {
            MessageParserOutput::new(MessageParserStatus::InvalidOptions, message)
        }
        Err(ParseError::Failed(message)) => {
            MessageParserOutput::new(MessageParserStatus::Failed, message)
        }
    }
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

    fn parse_json(input: &str, options_json: &str) -> Result<serde_json::Value, ParseError> {
        parse_to_json(input.as_bytes(), options_json.as_bytes())
            .map(|json| serde_json::from_str(&json).unwrap())
    }

    #[test]
    fn serializes_the_upstream_ast_shape() {
        let ast = parse_json("**hi**", "{}").unwrap();
        assert_eq!(
            ast,
            serde_json::json!([{
                "type": "PARAGRAPH",
                "value": [{ "type": "BOLD", "value": [{ "type": "PLAIN_TEXT", "value": "hi" }] }]
            }])
        );
    }

    #[test]
    fn applies_the_parse_options() {
        let without = parse_json("hi :)", "{}").unwrap().to_string();
        let with = parse_json("hi :)", r#"{"emoticons":true}"#)
            .unwrap()
            .to_string();
        assert!(!without.contains("EMOJI"));
        assert!(with.contains("EMOJI"));
    }

    #[test]
    fn rejects_options_upstream_does_not_define() {
        assert!(matches!(
            parse_to_json(b"hi", br#"{"unknown":true}"#),
            Err(ParseError::InvalidOptions(_))
        ));
        assert!(matches!(
            parse_to_json(b"hi", b"not json"),
            Err(ParseError::InvalidOptions(_))
        ));
    }

    #[test]
    fn replaces_invalid_utf8_instead_of_failing() {
        let ast = parse_to_json(b"a\xED\xA0\x80b", b"{}").unwrap();
        assert!(ast.contains("a\u{FFFD}\u{FFFD}\u{FFFD}b"));
    }

    #[test]
    fn parses_the_deepest_spoiler_emoticon_chain_on_its_own_stack() {
        let input = "||:)".repeat(2_000);
        assert!(parse_json(&input, r#"{"emoticons":true}"#).is_ok());
    }

    #[test]
    fn round_trips_through_the_c_abi() {
        let input = "**hi**";
        let options = "{}";
        let output = unsafe {
            rocketchat_message_parser_parse(
                input.as_ptr(),
                input.len(),
                options.as_ptr(),
                options.len(),
            )
        };
        assert_eq!(output.status, MessageParserStatus::Ok);
        let json = unsafe { std::slice::from_raw_parts(output.bytes, output.length) };
        assert!(std::str::from_utf8(json)
            .unwrap()
            .starts_with("[{\"type\":\"PARAGRAPH\""));
        unsafe { rocketchat_message_parser_free(output) };
    }

    #[test]
    fn reports_bad_options_through_the_c_abi() {
        let options = "true";
        let output = unsafe {
            rocketchat_message_parser_parse(std::ptr::null(), 0, options.as_ptr(), options.len())
        };
        assert_eq!(output.status, MessageParserStatus::InvalidOptions);
        unsafe { rocketchat_message_parser_free(output) };
    }
}
