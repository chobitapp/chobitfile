import { useQueryStates } from "nuqs";
import { useCallback } from "react";
import { generatorSearchParams, generatorUrlKeys } from "../lib/query";
import type { GeneratorParams } from "../lib/types";

export function useQueryParams(): [
  GeneratorParams,
  (next: GeneratorParams) => void,
] {
  const [params, setQuery] = useQueryStates(generatorSearchParams, {
    history: "replace",
    urlKeys: generatorUrlKeys,
  });

  const setParams = useCallback(
    (next: GeneratorParams) => {
      void setQuery(next);
    },
    [setQuery],
  );

  return [params, setParams];
}
