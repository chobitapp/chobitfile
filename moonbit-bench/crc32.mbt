///|
/// IEEE CRC-32 (poly 0xEDB88320) テーブル。PNG / ZIP と同じ。
fn make_crc32_table() -> FixedArray[UInt] {
  let table = FixedArray::make(256, 0U)
  for n in 0..<256 {
    let mut c = n.reinterpret_as_uint()
    for _ in 0..<8 {
      if (c & 1U) == 1U {
        c = (c >> 1) ^ 0xEDB88320U
      } else {
        c = c >> 1
      }
    }
    table[n] = c
  }
  table
}

///|
let crc32_table : FixedArray[UInt] = make_crc32_table()

///|
/// バイト列の CRC-32 を計算する。
pub fn crc32_bytes(data : Bytes) -> UInt {
  let mut crc = 0xFFFFFFFFU
  let len = data.length()
  for i in 0..<len {
    let idx = ((crc ^ data[i].to_uint()) & 0xFFU).reinterpret_as_int()
    crc = (crc >> 8) ^ crc32_table[idx]
  }
  crc ^ 0xFFFFFFFFU
}

///|
/// パターン埋め + CRC-32。PNG 向け計算コストの近似。
///
/// `pattern` は 0–255。全バイトをその値で埋め、CRC-32 を返す。
/// 返り値は UInt を Int として再解釈（WASM 経由で JS に渡すため）。
pub fn crc32_pattern(size : Int, pattern : Int) -> Int {
  let p = (pattern & 0xFF).to_byte()
  let data = Bytes::make(size, p)
  crc32_bytes(data).reinterpret_as_int()
}
