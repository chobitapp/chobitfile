///|
/// 既知ベクタ: CRC32("") == 0, CRC32("123456789") == 0xCBF43926
test "crc32 empty" {
  assert_eq(crc32_bytes(b""), 0U)
}

///|
test "crc32 123456789" {
  assert_eq(crc32_bytes(b"123456789"), 0xCBF43926U)
}

///|
test "crc32_pattern zeros size 0" {
  assert_eq(crc32_pattern(0, 0), 0)
}
