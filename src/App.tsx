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
import { useCallback, useMemo } from "react";
import { useGenerateFile } from "./hooks/useGenerateFile";
import { useQueryParams } from "./hooks/useQueryParams";
import { formatBytes, LocaleProvider, sizeOptionLabel, useT } from "./i18n";
import type { Locale } from "./i18n/locales";
import { buildFilename } from "./lib/filename";
import { toGeneratorParams } from "./lib/query";
import { targetBytesFor } from "./lib/sizes";
import {
  type BoundaryMode,
  FILE_TYPE_LABELS,
  type FileType,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./lib/types";

export function App() {
  const [params, setParams] = useQueryParams();

  const setLocale = useCallback(
    (lang: Locale) => {
      setParams({ ...params, lang });
    },
    [params, setParams],
  );

  return (
    <LocaleProvider locale={params.lang} setLocale={setLocale}>
      <AppInner />
    </LocaleProvider>
  );
}

function AppInner() {
  const [params, setParams] = useQueryParams();
  const t = useT();
  const { generate, isGenerating, error, clearError } = useGenerateFile();

  const target = targetBytesFor(params.sizeMb, params.boundary);
  const filename = buildFilename(params.type, params.sizeMb, params.boundary);

  const fileTypeOptions = useMemo(
    () => [
      {
        type: "section" as const,
        title: t.sections.image,
        options: [
          { value: "png", label: FILE_TYPE_LABELS.png },
          { value: "jpeg", label: FILE_TYPE_LABELS.jpeg },
        ],
      },
      {
        type: "section" as const,
        title: t.sections.document,
        options: [
          { value: "pdf", label: FILE_TYPE_LABELS.pdf },
          { value: "docx", label: FILE_TYPE_LABELS.docx },
          { value: "xlsx", label: FILE_TYPE_LABELS.xlsx },
          { value: "pptx", label: FILE_TYPE_LABELS.pptx },
        ],
      },
      {
        type: "section" as const,
        title: t.sections.text,
        options: [
          { value: "txt", label: FILE_TYPE_LABELS.txt },
          { value: "csv", label: FILE_TYPE_LABELS.csv },
          { value: "json", label: FILE_TYPE_LABELS.json },
        ],
      },
    ],
    [t],
  );

  const cliGenerateExample = `${t.cli.generateComment}
npx chobitfile -t pdf -s 10mb -o ./10mb.pdf`;

  const cliInstallExample = `${t.cli.installComment}
npm i -g chobitfile`;

  return (
    <Center minHeight="100dvh" width="100%">
      <VStack gap={4} padding={4} width="100%" maxWidth={512}>
        <Card maxWidth={480} width="100%" padding={5}>
          <VStack gap={4}>
            <HStack gap={3} hAlign="between" vAlign="center">
              <Heading level={1}>chobitfile</Heading>
              <SegmentedControl
                label={t.lang.label}
                value={params.lang}
                onChange={(value) =>
                  setParams({ ...params, lang: value as Locale })
                }
                isDisabled={isGenerating}
              >
                <SegmentedControlItem value="ja" label={t.lang.ja} />
                <SegmentedControlItem value="en" label={t.lang.en} />
              </SegmentedControl>
            </HStack>

            <FormLayout direction="vertical">
              <Selector
                label={t.form.fileType}
                value={params.type}
                onChange={(value) =>
                  setParams({ ...params, type: value as FileType })
                }
                options={fileTypeOptions}
                isDisabled={isGenerating}
              />

              <RadioList
                label={t.form.size}
                value={String(params.sizeMb)}
                onChange={(value) =>
                  setParams({
                    ...params,
                    sizeMb: Number(value) as SizeMb,
                  })
                }
                isDisabled={isGenerating}
                description={t.form.sizeDescription}
              >
                {SIZE_MB_OPTIONS.map((sizeMb) => (
                  <RadioListItem
                    key={sizeMb}
                    value={String(sizeMb)}
                    label={sizeOptionLabel(sizeMb, params.lang)}
                  />
                ))}
              </RadioList>

              <SegmentedControl
                label={t.form.boundary}
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
                <SegmentedControlItem
                  value="exact"
                  label={t.form.boundaryExact}
                />
                <SegmentedControlItem
                  value="under"
                  label={t.form.boundaryUnder}
                />
                <SegmentedControlItem
                  value="over"
                  label={t.form.boundaryOver}
                />
              </SegmentedControl>
            </FormLayout>

            <VStack gap={1}>
              <Text type="label" display="block">
                {t.form.preview}
              </Text>
              <Text type="supporting" display="block" hasTabularNumbers>
                {filename} / {formatBytes(target, params.lang)}{" "}
                {t.form.previewBytes}
              </Text>
            </VStack>

            {error ? (
              <Banner
                status="error"
                title={t.errors.generateFailed}
                description={error}
                isDismissable
                onDismiss={clearError}
              />
            ) : null}

            <Button
              label={isGenerating ? t.actions.generating : t.actions.generate}
              variant="primary"
              isLoading={isGenerating}
              isDisabled={isGenerating}
              onClick={() => {
                void generate(toGeneratorParams(params), params.lang);
              }}
            />
          </VStack>
        </Card>

        <Card maxWidth={480} width="100%" padding={5}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={2}>{t.cli.heading}</Heading>
            </VStack>
            <CodeBlock
              code={cliGenerateExample}
              language="bash"
              hasCopyButton
              width="100%"
            />
            <CodeBlock
              code={cliInstallExample}
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
