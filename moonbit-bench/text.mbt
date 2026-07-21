///|
/// PDF 風のテキストを StringBuilder で組み立て、最終的な文字数を返す。
/// コメント行パディングで target_size 付近まで伸ばす。
///
/// 文字列操作中心なので、JS エンジンの方が有利になり得るカテゴリ。
pub fn text_pad(target_size : Int) -> Int {
  let header =
    "%PDF-1.4\n%// binary marker\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
  let footer = "\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n"
  let overhead = header.length() + footer.length() + 2 // "%" + "\n"
  let pad_needed = target_size - overhead
  let n = if pad_needed > 0 { pad_needed } else { 0 }

  let sb = StringBuilder(size_hint=target_size)
  sb.write_string(header)
  sb.write_string("%")

  // 64 文字チャンクでパディング（コメント行の中身）
  let chunk =
    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  let chunk_len = chunk.length()
  let mut remaining = n
  while remaining >= chunk_len {
    sb.write_string(chunk)
    remaining = remaining - chunk_len
  }
  if remaining > 0 {
    sb.write_string(chunk[0:remaining].to_owned())
  }
  sb.write_string("\n")
  sb.write_string(footer)
  sb.to_string().length()
}
