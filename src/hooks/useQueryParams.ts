import { useCallback, useEffect, useState } from "react";
import { paramsFromSearch, searchFromParams } from "../lib/query";
import type { GeneratorParams } from "../lib/types";

export function useQueryParams(): [
  GeneratorParams,
  (next: GeneratorParams) => void,
] {
  const [params, setParamsState] = useState<GeneratorParams>(() =>
    paramsFromSearch(window.location.search),
  );

  useEffect(() => {
    const onPopState = () => {
      setParamsState(paramsFromSearch(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setParams = useCallback((next: GeneratorParams) => {
    setParamsState(next);
    const search = searchFromParams(next);
    const url = `${window.location.pathname}${search}`;
    window.history.replaceState(null, "", url);
  }, []);

  return [params, setParams];
}
