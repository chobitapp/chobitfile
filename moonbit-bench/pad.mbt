///|
/// ゼロ埋め。単純なメモリ確保 + 初期化のコストを測る。
/// DCE 防止のため先頭・末尾バイトを混ぜた疑似チェックサムを返す。
pub fn pad_zeros(size : Int) -> Int {
  let data = Bytes::make(size, b'\x00')
  let last = if size > 0 { data[size - 1].to_int() } else { 0 }
  size ^ last
}

///|
/// インデックス依存のパターン埋め。ゼロ埋めより「書き込み」が重い。
/// data[i] = (i * 131 + pattern) & 0xFF
pub fn pad_pattern(size : Int, pattern : Int) -> Int {
  let base = pattern & 0xFF
  let data = Bytes::makei(size, fn(i) {
    ((i * 131 + base) & 0xFF).to_byte()
  })
  let mut sum = 0
  // 全走査は CRC と被るので、等間隔サンプリング + 末尾で DCE 防止
  let step = if size > 4096 { size / 4096 } else { 1 }
  for i = 0; i < size; i = i + step {
    sum = sum + data[i].to_int()
  }
  if size > 0 {
    sum = sum + data[size - 1].to_int()
  }
  sum
}
