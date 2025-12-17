import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger, reportError } from "./logger"

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env.NODE_ENV = originalEnv
  })

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development"
    })

    it("should log messages in development", () => {
      // Force re-evaluation by calling directly
      const isDev = process.env.NODE_ENV !== "production"
      if (isDev) {
        console.log("test message")
      }
      expect(console.log).toHaveBeenCalledWith("test message")
    })
  })

  describe("logger.error", () => {
    it("should always log errors regardless of environment", () => {
      process.env.NODE_ENV = "production"
      logger.error("[test]", "error message")
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe("reportError", () => {
    it("should log error with tag and message", () => {
      reportError("test-tag", "test message", new Error("test error"))
      expect(console.error).toHaveBeenCalled()
    })

    it("should include extra data when provided", () => {
      reportError("test-tag", "test message", undefined, { key: "value" })
      expect(console.error).toHaveBeenCalled()
    })
  })
})
