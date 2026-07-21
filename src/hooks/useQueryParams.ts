import { useQueryStates } from "nuqs";
import { useCallback } from "react";
import { generatorSearchParams, generatorUrlKeys } from "../lib/query";
import type { AppParams } from "../lib/types";

export function useQueryParams(): [AppParams, (next: AppParams) => void] {
  const [params, setQuery] = useQueryStates(generatorSearchParams, {
    history: "replace",
    urlKeys: generatorUrlKeys,
  });

  const setParams = useCallback(
    (next: AppParams) => {
      void setQuery(next);
    },
    [setQuery],
  );

  return [params, setParams];
}
