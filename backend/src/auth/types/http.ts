export interface HttpRequest {
  method?: string;
  headers: Record<string, string | undefined>;
  query?: Record<string, string | string[] | undefined>;
}

export interface HttpResponse {
  status: (code: number) => HttpResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  statusCode: number;
  end: () => void;
}
