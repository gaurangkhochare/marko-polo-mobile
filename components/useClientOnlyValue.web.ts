export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return typeof window === 'undefined' ? server : client;
}
