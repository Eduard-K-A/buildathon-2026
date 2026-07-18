const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const DEBUG_API = import.meta.env.DEV;

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = apiUrl(path);
  const startedAt = Date.now();
  logRequest("POST", url, { body });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await parseJson(response);
    logResponse("POST", url, response, startedAt, payload);
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Request failed.");
    }
    return payload as T;
  } catch (error) {
    logFailure("POST", url, startedAt, error);
    throw error;
  }
}

export async function apiPostForm<T>(path: string, body: FormData): Promise<T> {
  const url = apiUrl(path);
  const startedAt = Date.now();
  logRequest("POST", url, { formData: true });

  try {
    const response = await fetch(url, {
      method: "POST",
      body,
    });

    const payload = await parseJson(response);
    logResponse("POST", url, response, startedAt, payload);
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Request failed.");
    }
    return payload as T;
  } catch (error) {
    logFailure("POST", url, startedAt, error);
    throw error;
  }
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid response.");
  }
}

function logRequest(method: string, url: string, details: unknown) {
  if (!DEBUG_API) return;
  console.log(`[api] ${method} ${url}`, details);
}

function logResponse(method: string, url: string, response: Response, startedAt: number, payload: unknown) {
  if (!DEBUG_API) return;
  console.log(`[api] ${method} ${url} -> ${response.status} ${response.statusText} (${Date.now() - startedAt}ms)`, payload);
}

function logFailure(method: string, url: string, startedAt: number, error: unknown) {
  if (!DEBUG_API) return;
  console.log(`[api] ${method} ${url} failed (${Date.now() - startedAt}ms)`, error);
}
