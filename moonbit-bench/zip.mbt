///|
/// ZIP store（無圧縮）でダミーエントリを1つ持つアーカイブを組み立て、
/// ペイロードの CRC-32 とアーカイブ総バイト数を合成した値を返す。
///
/// Office 系 (DOCX/XLSX) で必要な「CRC + ヘッダ組み立て」の近似。
pub fn zip_store(payload_size : Int) -> Int {
  let payload = Bytes::make(payload_size, b'\x00')
  let crc = crc32_bytes(payload)
  let name = b"dummy.bin"
  let name_len = name.length()
  let name_len16 = name_len.to_uint16()
  let zero16 = (0).to_uint16()
  let one16 = (1).to_uint16()
  let ver16 = (20).to_uint16()

  // local file header (30) + name + data + central dir (46) + name + EOCD (22)
  let local_header_size = 30 + name_len
  let central_size = 46 + name_len
  let eocd_size = 22
  let total = local_header_size + payload_size + central_size + eocd_size

  let buf = @buffer.Buffer(size_hint=total)

  // --- Local file header ---
  buf.write_uint_le(0x04034b50U) // signature
  buf.write_uint16_le(ver16) // version needed
  buf.write_uint16_le(zero16) // flags
  buf.write_uint16_le(zero16) // method = store
  buf.write_uint16_le(zero16) // mod time
  buf.write_uint16_le(zero16) // mod date
  buf.write_uint_le(crc)
  buf.write_uint_le(payload_size.reinterpret_as_uint())
  buf.write_uint_le(payload_size.reinterpret_as_uint())
  buf.write_uint16_le(name_len16)
  buf.write_uint16_le(zero16) // extra len
  buf.write_bytes(name[:])
  buf.write_bytes(payload[:])

  // --- Central directory file header ---
  let central_offset = local_header_size + payload_size
  buf.write_uint_le(0x02014b50U)
  buf.write_uint16_le(ver16) // version made by
  buf.write_uint16_le(ver16) // version needed
  buf.write_uint16_le(zero16)
  buf.write_uint16_le(zero16)
  buf.write_uint16_le(zero16)
  buf.write_uint16_le(zero16)
  buf.write_uint_le(crc)
  buf.write_uint_le(payload_size.reinterpret_as_uint())
  buf.write_uint_le(payload_size.reinterpret_as_uint())
  buf.write_uint16_le(name_len16)
  buf.write_uint16_le(zero16) // extra
  buf.write_uint16_le(zero16) // comment
  buf.write_uint16_le(zero16) // disk start
  buf.write_uint16_le(zero16) // int attrs
  buf.write_uint_le(0U) // ext attrs
  buf.write_uint_le(0U) // relative offset of local header
  buf.write_bytes(name[:])

  // --- EOCD ---
  buf.write_uint_le(0x06054b50U)
  buf.write_uint16_le(zero16)
  buf.write_uint16_le(zero16)
  buf.write_uint16_le(one16) // entries on this disk
  buf.write_uint16_le(one16) // total entries
  buf.write_uint_le(central_size.reinterpret_as_uint())
  buf.write_uint_le(central_offset.reinterpret_as_uint())
  buf.write_uint16_le(zero16) // comment len

  let archive = buf.to_bytes()
  // DCE 防止: アーカイブ長と CRC を混ぜて返す
  (archive.length().reinterpret_as_uint() ^ crc).reinterpret_as_int()
}
