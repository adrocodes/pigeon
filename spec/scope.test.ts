import { describe, test, expect } from "vitest"
import { ZodError, z } from "zod"
import { createPigeon, createRegistration } from "../index"

const genericImage = createRegistration({
  __typename: "Image",
  fragment: "url",
  schema: z.object({ __typename: z.enum(["Image"]), url: z.string() }).transform((input) => ({
    __typename: input.__typename,
    src: input.url,
  })),
})

const genericHero = createRegistration({
  __typename: "Hero",
  dependencies: [genericImage.__typename],
  fragment: `title image { ...${genericImage.fragmentName} }`,
  schema: z.object({
    __typename: z.enum(["Hero"]),
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

  test("fragment collection", () => {
    const pigeon = createPigeon()

    pigeon.register(genericHero).register(genericImage)
    const pageScope = pigeon.scope("page")
    const fragments = pageScope.fragments()

    expect(fragments).not.toEqual("")
    expect(fragments).toContain("fragment HeroFragment on Hero")
    expect(fragments).toContain("fragment ImageFragment on Image")
  })

  test("result validation - success", async () => {
    const pigeon = createPigeon()

    pigeon.register(genericHero).register(genericImage)
    const pageScope = pigeon.scope("page")

    const data = [{ __typename: "Hero", title: "Hero Example", image: { __typename: "Image", url: "https://image" } }]

    await expect(pageScope.validate(data)).resolves.toEqual([
      {
        __typename: "Hero",
        title: "Hero Example",
        image: {
          __typename: "Image",
          src: "https://image",
        },
      },
    ])
  })

  test("result validation - fails", async () => {
    const pigeon = createPigeon()

    pigeon.register(genericHero).register(genericImage)
    const pageScope = pigeon.scope("page")

    const data = [{ __typename: "Hero", image: { __typename: "Image", url: "https://image" } }]

    await expect(pageScope.validate(data)).rejects.toThrowError(ZodError)
  })
})
