export type RequestState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string }

export type RequestAction<T> =
  | { type: "start" }
  | { type: "succeed"; data: T }
  | { type: "fail"; error: string }

export function idleRequestState<T>(): RequestState<T> {
  return { status: "idle", data: null, error: null }
}

export function requestStateReducer<T>(
  _state: RequestState<T>,
  action: RequestAction<T>
): RequestState<T> {
  switch (action.type) {
    case "start":
      return { status: "loading", data: null, error: null }
    case "succeed":
      return { status: "success", data: action.data, error: null }
    case "fail":
      return { status: "error", data: null, error: action.error }
  }
}
