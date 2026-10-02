import { isStep, type Step } from "./Step.ts"

export const TypeId = "~@kiln/core/Cmd" as const

/** A value a command can interpolate: plain strings and numbers, lists of them, or steps whose value is one. */
export type Interpolation =
  | string
  | number
  | ReadonlyArray<string>
  | Step<string | number, any, any, any, any>

/**
 * One argument of a command: literal text and interpolated values, concatenated.
 * A list interpolated on its own spreads into several arguments.
 */
export type Arg = ReadonlyArray<string | { readonly step: string } | { readonly list: ReadonlyArray<string> }>

export interface Cmd<out R = never> {
  readonly [TypeId]: { readonly _R: (_: never) => R }
  readonly args: ReadonlyArray<Arg>
  /** Steps whose values the command reads. */
  readonly steps: ReadonlyArray<Step.Any>
}

const variance = { _R: (_: never) => _ }

/**
 * Builds an argv from a template. Literal text splits on whitespace and honours single and
 * double quotes; interpolated values never split. Commands run without a shell.
 */
export const cmd = <const V extends ReadonlyArray<Interpolation>>(
  strings: TemplateStringsArray,
  ...values: V
): Cmd<Step.Services<Extract<V[number], Step.Any>>> => {
  const args: Array<Array<Arg[number]>> = []
  const steps: Array<Step.Any> = []
  let current: Array<Arg[number]> | undefined
  let quote: "'" | '"' | undefined

  const push = (part: Arg[number]) => {
    current ??= []
    current.push(part)
  }
  const end = () => {
    if (current !== undefined) args.push(current)
    current = undefined
  }

  strings.forEach((literal, i) => {
    let text = ""
    for (const ch of literal) {
      if (quote !== undefined) {
        if (ch === quote) quote = undefined
        else text += ch
        continue
      }
      if (ch === "'" || ch === '"') {
        quote = ch
        current ??= []
        continue
      }
      if (/\s/.test(ch)) {
        if (text !== "") push(text)
        text = ""
        end()
        continue
      }
      text += ch
    }
    if (text !== "") push(text)
    if (i >= values.length) return
    const value = values[i]!
    if (isStep(value)) {
      steps.push(value)
      push({ step: value.name })
    } else if (Array.isArray(value)) {
      push({ list: value })
    } else {
      push(String(value))
    }
  })
  if (quote !== undefined) throw new Error(`cmd: unclosed ${quote} in \`${strings.join("${…}")}\``)
  end()
  return { [TypeId]: variance, args, steps }
}

export const isCmd = (u: unknown): u is Cmd<unknown> => typeof u === "object" && u !== null && TypeId in u

/** Resolves a command to argv, given the values of the steps it interpolates. */
export const render = (self: Cmd<unknown>, values: { readonly [step: string]: unknown }): ReadonlyArray<string> =>
  self.args.flatMap((arg) => {
    if (arg.length === 1 && typeof arg[0] === "object" && "list" in arg[0]) return [...arg[0].list]
    return [
      arg
        .map((part) => {
          if (typeof part === "string") return part
          if ("list" in part) return part.list.join(" ")
          const value = values[part.step]
          if (typeof value !== "string" && typeof value !== "number") {
            throw new Error(`cmd: step ${part.step} has no string or number value`)
          }
          return String(value)
        })
        .join(""),
    ]
  })

/** The command as text, with interpolated steps shown as `${name}`. */
export const show = (self: Cmd<unknown>): string =>
  self.args
    .flatMap((arg) =>
      arg.length === 1 && typeof arg[0] === "object" && "list" in arg[0]
        ? arg[0].list
        : [arg.map((part) => (typeof part === "string" ? part : "step" in part ? `\${${part.step}}` : part.list.join(" "))).join("")]
    )
    .map((text) => (/[\s'"]/.test(text) ? JSON.stringify(text) : text))
    .join(" ")
