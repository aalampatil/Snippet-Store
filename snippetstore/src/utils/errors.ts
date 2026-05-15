import { isAxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  issues?: { message: string }[];
};

export function getErrorMessage(error: unknown) {
  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;

    if (body?.issues?.length) {
      return body.issues.map((issue) => issue.message).join("\n");
    }

    if (body?.message) {
      return body.message;
    }

    if (error.code === "ERR_NETWORK") {
      return "Could not reach the API. Check the server URL and network connection.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
