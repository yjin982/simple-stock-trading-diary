import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "~/utils/apiError";

describe("apiErrorMessage", () => {
  it("응답 본문의 statusMessage를 쓴다 (statusText는 h3가 '.'으로 바꾼 값)", () => {
    const err = { statusMessage: ".", data: { statusMessage: "데모 계정이 설정되어 있지 않습니다." } };

    expect(apiErrorMessage(err, "기본 메시지")).toBe("데모 계정이 설정되어 있지 않습니다.");
  });

  it("본문에 메시지가 없으면 기본 메시지", () => {
    expect(apiErrorMessage({ statusMessage: "." }, "기본 메시지")).toBe("기본 메시지");
    expect(apiErrorMessage({ data: { statusMessage: "  " } }, "기본 메시지")).toBe("기본 메시지");
    expect(apiErrorMessage(null, "기본 메시지")).toBe("기본 메시지");
    expect(apiErrorMessage(new Error("network"), "기본 메시지")).toBe("기본 메시지");
  });
});
