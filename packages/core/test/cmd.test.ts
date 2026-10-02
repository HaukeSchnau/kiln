import { describe, expect, it } from "@effect/vitest"
import { Cmd, cmd } from "../src/index.ts"
import { release } from "./fixtures.ts"

describe("cmd", () => {
  it("splits literals and keeps values whole", () => {
    const c = cmd`just ${"qa static"} --flag=${3} 'quoted arg' "x ${"y"}"`
    expect(Cmd.render(c, {})).toEqual(["just", "qa static", "--flag=3", "quoted arg", "x y"])
  })
  it("spreads lists and resolves steps", () => {
    const c = cmd`vitest run ${["a.test.ts", "b.test.ts"]} --release ${release}`
    expect(c.steps).toEqual([release])
    expect(Cmd.render(c, { release: "/nix/store/abc-release" })).toEqual([
      "vitest",
      "run",
      "a.test.ts",
      "b.test.ts",
      "--release",
      "/nix/store/abc-release",
    ])
    expect(Cmd.show(c)).toBe("vitest run a.test.ts b.test.ts --release ${release}")
  })
  it("refuses unclosed quotes", () => {
    expect(() => cmd`echo 'oops`).toThrow(/unclosed/)
  })
})
