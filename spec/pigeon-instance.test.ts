import { describe, expect, test } from "vitest"
import { createPigeon, createRegistration, input } from "../index"
import { z } from "zod"

const genericImage = createRegistration({
  __typename: "Image",
  dependencies: [],
  fragment: "url",
  schema: z.object({ __typename: z.enum(["Image"]), url: z.string() }).transform((input) => ({
    src: input.url,
    __typename: input.__typename,
  })),
})

const genericHero = createRegistration({
  __typename: "Hero",
  dependencies: [genericImage],
  fragment: `title image { ...${genericImage.fragmentName} }`,
  schema: z.object({
    __typename: z.enum(["Hero"]),
    title: z.string(),
    image: genericImage.schema,
  }),
})

describe("Pigeon Instance", () => {
  test("Generating a query", () => {
    const pigeon = createPigeon([genericHero])

    const query = pigeon.query()

    expect(query).not.toBeUndefined()
    expect(query).toContain(`...on Hero {`)
    expect(query).not.toContain(`...on Image {`)
  })

  test("Generating a query with a fragment", () => {
    const pigeon = createPigeon([genericHero])

    const fragments = pigeon.fragments()

    expect(fragments).not.toBeUndefined()
    expect(fragments).toContain(`fragment ${genericHero.fragmentName} on Hero {`)
    expect(fragments).toContain(`fragment ${genericImage.fragmentName} on Image {`)
  })

  test("Validating and transforming data", async () => {
    const pigeon = createPigeon([genericHero])

    type Input = input<typeof pigeon>
    const data: Input = [
      {
        __typename: "Hero",
        title: "Hello",
        image: {
          __typename: "Image",
          url: "https://example.com/image.jpg",
        },
      },
    ]

    const output = await pigeon.validate(data)

    expect(output).not.toBeUndefined()
    expect(output?.[0]?.title).toBe("Hello")
    expect(output?.[0]?.image.src).toBe("https://example.com/image.jpg")
  })

  test("Validating incorrect input data", async () => {
    const pigeon = createPigeon([genericHero])

    type Input = input<typeof pigeon>
    const data: Input = [
      // @ts-expect-error - Missing title
      {
        __typename: "Hero",
        // title: "Hello",
        image: {
          __typename: "Image",
          url: "https://example.com/image.jpg",
        },
      },
    ]

    await expect(pigeon.validate(data)).rejects.toThrow()
  })

  test("Registering components with the same typename", () => {
    const altHero = createRegistration({
      __typename: "Hero",
      fragmentName: "AltHero",
      dependencies: [genericImage],
      fragment: `title image { ...${genericImage.fragmentName} }`,
      schema: z.object({
        __typename: z.enum(["Hero"]),
        title: z.string(),
        image: genericImage.schema,
      }),
    })
    const pigeon = createPigeon([genericHero, altHero])

    const fragments = pigeon.fragments()

    expect(fragments).contains("fragment AltHero")
    expect(fragments).contains("fragment HeroFragment")
  })
})
