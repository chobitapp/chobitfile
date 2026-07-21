import { utf8 } from "../lib/bytes";
import { buildStoreZip, type ZipEntry } from "./zip";

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="bin" ContentType="application/octet-stream"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
`;

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>chobitfile dummy document</w:t>
      </w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>
`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>
`;

const PADDING_NAME = "word/padding.bin";

function fixedEntries(): ZipEntry[] {
  return [
    { name: "[Content_Types].xml", data: utf8(CONTENT_TYPES) },
    { name: "_rels/.rels", data: utf8(ROOT_RELS) },
    { name: "word/document.xml", data: utf8(DOCUMENT_XML) },
    { name: "word/_rels/document.xml.rels", data: utf8(DOCUMENT_RELS) },
  ];
}

/**
 * 目標バイト数ちょうどになる最小有効 DOCX を生成する。
 * 余りは word/padding.bin（store）で埋める。
 */
export function generateDocx(targetBytes: number): Uint8Array {
  if (!Number.isInteger(targetBytes) || targetBytes <= 0) {
    throw new Error(`不正な目標サイズ: ${targetBytes}`);
  }

  const fixed = fixedEntries();
  const nameLen = utf8(PADDING_NAME).byteLength;
  // 追加エントリ分: local(30+name) + data + central(46+name)
  const paddingEntryOverhead = 30 + nameLen + 46 + nameLen;

  const baseZip = buildStoreZip(fixed);
  const paddingDataLen =
    targetBytes - baseZip.byteLength - paddingEntryOverhead;

  if (paddingDataLen < 0) {
    throw new Error(
      `目標サイズ ${targetBytes} は最小 DOCX（${baseZip.byteLength + paddingEntryOverhead}）より小さい`,
    );
  }

  const padding = new Uint8Array(paddingDataLen);
  const marker = utf8("chobitfile-padding");
  if (marker.byteLength <= paddingDataLen) {
    padding.set(marker, 0);
  }

  const out = buildStoreZip([...fixed, { name: PADDING_NAME, data: padding }]);

  if (out.byteLength !== targetBytes) {
    throw new Error(
      `DOCX サイズ不一致: expected ${targetBytes}, got ${out.byteLength}`,
    );
  }
  return out;
}

export function isZipLocalHeader(data: Uint8Array): boolean {
  return (
    data.byteLength >= 4 &&
    data[0] === 0x50 &&
    data[1] === 0x4b &&
    data[2] === 0x03 &&
    data[3] === 0x04
  );
}
