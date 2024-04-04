import { describe, test, expect } from "vitest"
import { createDependency } from "../index"
import { z } from "zod"

const createGenericHero = () =>
  createDependency({
    __typename: "Hero",
    dependencies: [],
    fragment: "title",
    schema: z.object({ title: z.string() }),
  })

describe("Create Registration", () => {
  test("Generates a fragment name", () => {
    const hero = createGenericHero()

    expect(hero.fragmentName).not.toBeUndefined()
    expect(hero.fragmentName).toEqual("HeroFragment")
  })

  test("Generates a valid fragment pattern", () => {
    const hero = createGenericHero()

    expect(hero.fragment).not.toBeUndefined()
    expect(hero.fragment.startsWith("fragment HeroFragment on Hero {")).toBeTruthy()
  })

  test("Populates optional fields", () => {
    const hero = createDependency({
      __typename: "Hero",
      fragment: ``,
      schema: z.object({ title: z.string() }),
    })

    expect(hero.dependencies).not.toBeUndefined()
    expect(hero.dependencies?.length).toBe(0)
  })

  test("Doesn't override optional fields", () => {
    const hero = createDependency({
      __typename: "Hero",
      fragment: ``,
      schema: z.object({ __typename: z.enum(["Hero"]) }),
      dependencies: [
        createDependency({
          __typename: "Image",
          fragment: ``,
          schema: z.object({ __typename: z.enum(["Image"]) }),
        }),
      ],
    })

    expect(hero.dependencies).not.toBeUndefined()
    expect(hero.dependencies?.length).toBe(1)
    expect(hero.dependencies?.[0]?.__typename).toEqual("Image")
  })

  test("Can override fragment name", () => {
    const hero = createDependency({
      __typename: "Hero",
      fragment: ``,
      schema: z.string(),
      fragmentName: "CustomHeroFragment",
    })

    expect(hero.fragmentName).toEqual("CustomHeroFragment")
  })

  test("Can override fragment name and dependencies", () => {
    const hero = createDependency({
      __typename: "Hero",
      fragment: ``,
      schema: z.object({ __typename: z.enum(["Hero"]) }),
      fragmentName: "CustomHeroFragment",
      dependencies: [
        createDependency({
          __typename: "Image",
          fragment: ``,
          schema: z.object({ __typename: z.enum(["Image"]) }),
        }),
      ],
    })

    expect(hero.fragmentName).toEqual("CustomHeroFragment")
    expect(hero.dependencies?.length).toBe(1)
    expect(hero.dependencies?.[0]?.__typename).toEqual("Image")
  })
})
