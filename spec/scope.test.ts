import { describe, test, expect } from "vitest"
import { z } from "zod"
import { createPigeon, createRegistration } from "../index"

const genericImage = createRegistration({
  __typename: "Image",
  dependencies: [],
  fragment: "url",
  schema: z.object({ src: z.string() }).transform((input) => ({
    src: input.src,
  })),
  scope: [],
})

const genericHero = createRegistration({
  __typename: "Hero",
  dependencies: [genericImage.__typename],
  fragment: `title image { ...${genericImage.fragmentName} }`,
  schema: z.object({
    title: z.string(),
    image: genericImage.schema,
  }),
  scope: ["page"],
})

describe("Pigeon - Scope", () => {
  test("correct scopes components", () => {
    const pigeon = createPigeon()

    pigeon.register(genericHero).register(genericImage)
    const pageScope = pigeon.scope("page")

    expect(pageScope.components.has("Hero")).toBeTruthy()
    expect(pageScope.components.has("Image")).toBeFalsy()
  })

  test("query creation", () => {
    const pigeon = createPigeon()

    pigeon.register(genericHero).register(genericImage)
    const pageScope = pigeon.scope("page")
    const query = pageScope.query()

    expect(query).not.toEqual("")
    expect(query).toContain("...on Hero { ...HeroFragment }")
    expect(query).not.toContain("...on Image { ...ImageFragment }")
  })
})
