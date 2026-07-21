import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { CodeBlock } from "@astryxdesign/core/CodeBlock";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Link } from "@astryxdesign/core/Link";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useGenerateFile } from "./hooks/useGenerateFile";
import { useQueryParams } from "./hooks/useQueryParams";
import { buildFilename } from "./lib/filename";
import { formatBytes, sizeOptionLabel, targetBytesFor } from "./lib/sizes";
import {
  type BoundaryMode,
  FILE_TYPE_LABELS,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./lib/types";

const FILE_TYPE_OPTIONS = [
  {
    type: "section" as const,
    title: "画像",
    options: [
      { value: "png", label: FILE_TYPE_LABELS.png },
      { value: "jpeg", label: FILE_TYPE_LABELS.jpeg },
    ],
  },
  {
    type: "section" as const,
    title: "ドキュメント",
    options: [
      { value: "pdf", label: FILE_TYPE_LABELS.pdf },
      { value: "docx", label: FILE_TYPE_LABELS.docx },
      { value: "xlsx", label: FILE_TYPE_LABELS.xlsx },
      { value: "pptx", label: FILE_TYPE_LABELS.pptx },
    ],
  },
  {
    type: "section" as const,
    title: "テキスト",
    options: [
      { value: "txt", label: FILE_TYPE_LABELS.txt },
      { value: "csv", label: FILE_TYPE_LABELS.csv },
      { value: "json", label: FILE_TYPE_LABELS.json },
    ],
  },
];

const CLI_GENERATE_EXAMPLE = `# 10MBのPDFファイルを生成
npx chobitfile -t pdf -s 10mb -o ./10mb.pdf`;

const CLI_INSTALL_EXAMPLE = `# グローバルにインストール
npm i -g chobitfile`;

export function App() {
  const [params, setParams] = useQueryParams();
  const { generate, isGenerating, error, clearError } = useGenerateFile();

  const target = targetBytesFor(params.sizeMb, params.boundary);
  const filename = buildFilename(params.type, params.sizeMb, params.boundary);

  return (
    <Center minHeight="100dvh" width="100%">
      <VStack gap={4} padding={4} width="100%" maxWidth={512}>
        <Card maxWidth={480} width="100%" padding={5}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={1}>chobitfile</Heading>
            </VStack>

            <FormLayout direction="vertical">
              <Selector
                label="ファイル形式"
                value={params.type}
                onChange={(value) =>
                  setParams({ ...params, type: value as FileType })
                }
                options={FILE_TYPE_OPTIONS}
                isDisabled={isGenerating}
              />

              <RadioList
                label="サイズ"
                value={String(params.sizeMb)}
                onChange={(value) =>
                  setParams({
                    ...params,
                    sizeMb: Number(value) as SizeMb,
                  })
                }
                isDisabled={isGenerating}
                description="1 MB = 1,048,576 バイト（1024 系）"
              >
                {SIZE_MB_OPTIONS.map((sizeMb) => (
                  <RadioListItem
                    key={sizeMb}
                    value={String(sizeMb)}
                    label={sizeOptionLabel(sizeMb)}
                  />
                ))}
              </RadioList>

              <SegmentedControl
                label="境界モード"
                value={params.boundary}
                onChange={(value) =>
                  setParams({
                    ...params,
                    boundary: value as BoundaryMode,
                  })
                }
                layout="fill"
                isDisabled={isGenerating}
              >
                <SegmentedControlItem value="exact" label="ちょうど" />
                <SegmentedControlItem value="under" label="−1 バイト" />
                <SegmentedControlItem value="over" label="+1 バイト" />
              </SegmentedControl>
            </FormLayout>

            <VStack gap={1}>
              <Text type="label" display="block">
                生成内容
              </Text>
              <Text type="supporting" display="block" hasTabularNumbers>
                {filename} / {formatBytes(target)} バイト
              </Text>
            </VStack>

            {error ? (
              <Banner
                status="error"
                title="生成に失敗しました"
                description={error}
                isDismissable
                onDismiss={clearError}
              />
            ) : null}

            <Button
              label={isGenerating ? "生成中…" : "生成してダウンロード"}
              variant="primary"
              isLoading={isGenerating}
              isDisabled={isGenerating}
              onClick={() => {
                void generate(params);
              }}
            />
          </VStack>
        </Card>

        <Card maxWidth={480} width="100%" padding={5}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={2}>CLI でも使えます</Heading>
              <Text type="supporting" display="block">
                ターミナルから同じダミーファイルを生成できます。npx
                でその場実行するか、グローバルにインストールしてください。
              </Text>
            </VStack>
            <CodeBlock
              code={CLI_GENERATE_EXAMPLE}
              language="bash"
              hasCopyButton
              width="100%"
            />
            <CodeBlock
              code={CLI_INSTALL_EXAMPLE}
              language="bash"
              hasCopyButton
              width="100%"
            />
          </VStack>
        </Card>

        <Center axis="horizontal">
          <HStack gap={3} vAlign="center">
            <Link
              href="https://github.com/zaru/chobitfile"
              isExternalLink
              isStandalone
            >
              GitHub
            </Link>
            <Link href="https://nanabit.dev/" isExternalLink isStandalone>
              nanabit
            </Link>
          </HStack>
        </Center>
      </VStack>
    </Center>
  );
}
