use rocketchat_message_parser_ffi::{
    rocketchat_message_parser_free, rocketchat_message_parser_parse, MessageParserStatus,
};

const VALID_OPTIONS: [&str; 4] = [
    "{}",
    r#"{"emoticons":true}"#,
    r#"{"colors":true,"customDomains":["example.com"]}"#,
    r#"{"katex":{"dollarSyntax":true,"parenthesisSyntax":true}}"#,
];

const INVALID_OPTIONS: [&str; 3] = [r#"{"unknown":true}"#, "not json", "true"];

const FRAGMENTS: [&[u8]; 16] = [
    b"*",
    b"_",
    b"~",
    b"`",
    b"|",
    b"$",
    b":",
    b"[",
    b"]",
    b"(",
    b")",
    b"\\",
    b"\n",
    b"a ",
    b"\xED\xA0\x80",
    b"\xF0\x9F\x98",
];

struct Xorshift(u64);

impl Xorshift {
    fn next(&mut self) -> usize {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0 as usize
    }
}

fn random_input(random: &mut Xorshift) -> Vec<u8> {
    let fragments = random.next() % 24;
    (0..fragments)
        .flat_map(|_| FRAGMENTS[random.next() % FRAGMENTS.len()].iter().copied())
        .collect()
}

fn parse_through_c_abi(input: &[u8], options: &[u8]) -> (MessageParserStatus, String) {
    let output = unsafe {
        rocketchat_message_parser_parse(
            input.as_ptr(),
            input.len(),
            options.as_ptr(),
            options.len(),
        )
    };
    let text = unsafe { std::slice::from_raw_parts(output.bytes, output.length) };
    let text = std::str::from_utf8(text).unwrap().to_owned();
    let status = output.status;
    unsafe { rocketchat_message_parser_free(output) };
    (status, text)
}

#[test]
fn every_input_returns_owned_utf8_that_frees_cleanly() {
    let cases = std::env::var("C_ABI_CASES")
        .ok()
        .and_then(|cases| cases.parse().ok())
        .unwrap_or(200);
    let mut random = Xorshift(0x5eed_1234_abcd_0001);
    for _ in 0..cases {
        let input = random_input(&mut random);
        let valid_options = VALID_OPTIONS[random.next() % VALID_OPTIONS.len()];
        let (status, text) = parse_through_c_abi(&input, valid_options.as_bytes());
        assert_eq!(
            status,
            MessageParserStatus::Ok,
            "{input:?} {valid_options}: {text}"
        );
        let ast: serde_json::Value = serde_json::from_str(&text).unwrap();
        assert!(ast.is_array(), "{input:?} {valid_options} -> {text}");

        let invalid_options = INVALID_OPTIONS[random.next() % INVALID_OPTIONS.len()];
        let (status, text) = parse_through_c_abi(&input, invalid_options.as_bytes());
        assert_eq!(
            status,
            MessageParserStatus::InvalidOptions,
            "{invalid_options}: {text}"
        );
    }
}

#[test]
fn empty_and_null_inputs_are_read_as_empty() {
    let output = unsafe { rocketchat_message_parser_parse(std::ptr::null(), 0, b"{}".as_ptr(), 2) };
    assert_eq!(output.status, MessageParserStatus::Ok);
    unsafe { rocketchat_message_parser_free(output) };
    let (status, text) = parse_through_c_abi(b"", b"{}");
    assert_eq!(status, MessageParserStatus::Ok);
    assert_eq!(text, "[]");
}
