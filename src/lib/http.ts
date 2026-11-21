export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  {
    timeoutMs = 7000,
    signal,
    fetchImpl = fetch,
    ...init
  }: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => {
    controller.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Request timeout', 'AbortError'));
  }, timeoutMs);

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut && err instanceof Error && err.name !== 'AbortError') {
      throw new DOMException('Request timeout', 'AbortError');
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
