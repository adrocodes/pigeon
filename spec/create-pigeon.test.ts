import { describe, test, expect } from "vitest"
import { createPigeon, createRegistration } from "../index"
import { z } from "zod"

const genericImage = createRegistration({
  __typename: "Image",
  dependencies: [],
  fragment: "url",
  schema: z.object({ __typename: z.enum(["Image"]), src: z.string(), id: z.string() }).transform((input) => ({
    src: input.src,
    id: input.id,
    __typename: input.__typename,
  })),
})

const genericHero = createRegistration({
  __typename: "Hero",
  dependencies: [genericImage.__typename],
  fragment: `title image { ...${genericImage.fragmentName} }`,
  schema: z.object({
    __typename: z.enum(["Hero"]),
    id: z.string(),
    title: z.string(),
    image: genericImage.schema,
  }),
})

describe("Create Pigeon", () => {
  test("Creating a instance", () => {
    const pigeon = createPigeon([genericHero])

    expect(pigeon.components).not.toBeUndefined()
  })

  test("Can register a component", () => {
    const pigeon = createPigeon([genericImage])

    expect(pigeon.components.length).toBe(1)
  })

  test("Can register multiple components at once", () => {
    const pigeon = createPigeon([genericImage, genericHero])

    expect(pigeon.components.length).toBe(2)
  })
})
