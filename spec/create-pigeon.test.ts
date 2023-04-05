import { describe, test, expect } from "vitest"
import { createPigeon, createRegistration } from "../index"
import { z } from "zod"

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

describe("Create Pigeon", () => {
  test("Creating a instance", () => {
    const pigeon = createPigeon()

    expect(pigeon.register).not.toBeUndefined()
    expect(pigeon.scope).not.toBeUndefined()
  })

  test("Can register a component", () => {
    const pigeon = createPigeon()

    pigeon.register(genericImage)

    expect(pigeon.components.has("Image")).toBeTruthy()
  })

  test("Can register multiple components at once", () => {
    const pigeon = createPigeon()

    pigeon.register(genericImage).register(genericHero)

    expect(pigeon.components.has("Image")).toBeTruthy()
    expect(pigeon.components.has("Hero")).toBeTruthy()
  })
})
