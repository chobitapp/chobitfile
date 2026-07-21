import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useGenerateFile } from "./hooks/useGenerateFile";
import { useQueryParams } from "./hooks/useQueryParams";
import { buildFilename } from "./lib/filename";
import { formatBytes, sizeOptionLabel, targetBytesFor } from "./lib/sizes";
import {
  type BoundaryMode,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./lib/types";

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
              <Text type="supporting" display="block">
                ファイルはブラウザ内で生成されます。サーバーには送信しません。
              </Text>
            </VStack>

            <FormLayout direction="vertical">
              <SegmentedControl
                label="ファイル形式"
                value={params.type}
                onChange={(value) =>
                  setParams({ ...params, type: value as FileType })
                }
                layout="fill"
                isDisabled={isGenerating}
              >
                <SegmentedControlItem value="png" label="PNG" />
                <SegmentedControlItem value="docx" label="DOCX" />
              </SegmentedControl>

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
      </VStack>
    </Center>
  );
}
