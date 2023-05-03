import type { ZodSchema, z } from "zod"

type Typename = string
type ComponentMap = Map<Typename, RegistrationStruct>
type Schema<TName extends Typename = Typename> = ZodSchema<{ __typename: TName }>

export type RegistrationStruct<TName extends Typename = Typename, TSchema extends Schema = Schema<TName>> = {
  /**
   * This should match up with the `__typename` value in your
   * GraphQL CMS.
   */
  __typename: TName

  /**
   * The fragment used to pull in the content specified by your `schema`.
   *
   * **IMPORTANT:** Do not wrap your fragment in the fragment defintion,
   * only the inner part of the fragment is needed.
   *
   * ### Example:
   * ```ts
   * const Hero = createRegistration({
   *  fragment: `title description`,
   *  // ...rest
   * })
   * ```
   *
   * ### Example - dependency fragment
   * If you need to use a fragment from a different registered component,
   * you can use their registration definition.
   *
   * ```ts
   * const Image = createRegistration({
   *  __typename: "ImageRecord"
   * })
   *
   * const Hero = createRegistration({
   *  fragment: `image { ...${Image.fragmentName} }`,
   *  dependencies: [Image.__typename]
   *  // ...rest
   * })
   * ```
   *
   * During the query building process, the `dependencies` will be
   * collected as needed.
   * ```
   */
  fragment: string
  /**
   * A list of other registered content that you require in your `fragment`.
   *
   * ```ts
   * const Hero = createRegistration({
   *  fragment: `image { ...${Image.fragmentName} }`,
   *  dependencies: [Image.__typename]
   *  // ...rest
   * })
   * ```
   */
  dependencies?: Typename[]
  /**
   * The schema used to validate and transform the CMS data into your
   * component props.
   *
   * ```ts
   * const Hero = createRegistration({
   *  __typename: "Hero",
   *  schema: z.object({
   *      title: z.string()
   *    })
   *    .transform((input) => ({
   *      heading: input.title
   *    }))
   * })
   * ```
   */
  schema: TSchema
  /**
   * The generated Fragment name for this content. This is used when building
   * fragments for components that depend on this one.
   *
   * ```ts
   * const Hero = createRegistration({
   *  fragment: `image { ...${Image.fragmentName} }`,
   * })
   * ```
   */
  fragmentName: string
}

/**
 * Data structure used when creating a registration for a piece of CMS content
 */
type CreateRegistrationStruct<TName extends Typename = Typename, TSchema extends Schema = Schema<TName>> = Omit<
  RegistrationStruct<TName, TSchema>,
  "fragmentName"
>

/**
 * Use this method to prepare a piece of content for registration with Pigeon.
 *
 * ### Example
 * ```ts
 * const hero = createRegistration({
 *  __typename: "HeroRecord",
 *  fragment: `title description`,
 *  schema: z.object({}),
 *  dependencies: [image.__typename]
 * })
 * ```
 */
export const createRegistration = <TName extends Typename = Typename, TSchema extends Schema = Schema<TName>>(
  payload: CreateRegistrationStruct<TName, TSchema>,
): RegistrationStruct<TName, TSchema> => {
  const fragmentName = `${payload.__typename}Fragment`
  const fragment = `fragment ${fragmentName} on ${payload.__typename} {${payload.fragment}}`

  return {
    __typename: payload.__typename,
    dependencies: payload.dependencies || [],
    fragment,
    fragmentName,
    schema: payload.schema,
  }
}

const recursivelyCollectFragments = <TRegistration extends RegistrationStruct>(
  components: TRegistration[],
  value: RegistrationStruct,
  collected: ComponentMap,
) => {
  collected.set(value.__typename, value)
  if (!value.dependencies) return

  for (let i = 0; i < value.dependencies.length; i++) {
    const next = components.find((item) => item.__typename === (value.dependencies?.[i] as string))
    if (next) recursivelyCollectFragments(components, next, collected)
  }
}

type ExtractArrayTypes<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never

/**
 * Creates a new instance of Pigeon, your project will most likely only have one of these
 * but you can create multiple.
 */
export const createPigeon = <TRegistration extends RegistrationStruct>(components: TRegistration[]) => {
  type TComponents = TRegistration[]
  type TOutput = z.infer<ExtractArrayTypes<TComponents>["schema"]>

  return {
    components,
    /**
     * Generates the query needed in the flexible content query.
     *
     * ```ts
     * const query = gql`
     *  query Article {
     *    page(...) {
     *      flexibleContent {
     *        __typename
     *        ${instance.query()}
     *      }
     *    }
     *  }
     * `
     * ```
     */
    query: () => {
      const query: string[] = []

      for (const value of components) {
        query.push(`...on ${value.__typename} { ...${value.fragmentName} }`)
      }

      return query.join("\n")
    },
    /**
     * Generates the fragments needed for a query.
     *
     * ```ts
     * const query = gql`
     *  ${instance.fragments()}
     *
     *  query Article {
     *    page(...) {
     *      flexibleContent {
     *        __typename
     *        ${instance.query()}
     *      }
     *    }
     *  }
     * `
     * ```
     */
    fragments: () => {
      const map: ComponentMap = new Map()
      for (const value of components) {
        recursivelyCollectFragments(components, value, map)
      }

      const fragments: string[] = []

      for (const value of map.values()) {
        fragments.push(value.fragment)
      }

      return fragments.join("\n")
    },
    /**
     * Given a list of results from a GraphQL query, this function will loop through
     * each entry and attempt to validate it against the registered schema.
     *
     * If a entry is not apart of the components - it will be ignored and not present in the
     * returned results.
     *
     * If **any** of the validations fail, this method will throw a `ZodError`.
     *
     * ### Example
     * ```ts
     * const { data } = await client.query({ query })
     *
     * const results = await instance.validate(data.flexibleContent)
     * ```
     *
     * @throws {import("zod").ZodError}
     */
    validate: async <T extends Typename, D extends { __typename: T }>(data: D[]): Promise<TOutput[]> => {
      const validationPromises: Promise<TOutput>[] = []
      for (const value of data) {
        const component = components.find((item) => item.__typename === value.__typename)

        if (component) {
          validationPromises.push(component.schema.parseAsync(value))
        }
      }

      const result = await Promise.all(validationPromises)
      return result as TOutput[]
    },
  }
}
