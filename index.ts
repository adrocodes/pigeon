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
  dependencies?: RegistrationStruct<string, Schema<string>>[]
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

export type DependencyStruct<TName extends Typename = Typename, TSchema extends ZodSchema = ZodSchema> = {
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
  dependencies?: (RegistrationStruct<string, Schema<string>> | DependencyStruct<string, ZodSchema>)[]
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
> & {
  fragmentName?: string
}

/**
 * Data structure used when creating a dependency for a piece of CMS content
 */
type CreateDependencyStruct<TName extends Typename = Typename, TSchema extends ZodSchema = ZodSchema> = Omit<
  DependencyStruct<TName, TSchema>,
  "fragmentName"
> & {
  fragmentName?: string
}

/**
 * Use this method to prepare a piece of content for registration with Pigeon.
 *
 * ### Example
 * ```ts
 * const hero = createRegistration({
 *  __typename: "HeroRecord",
 *  fragment: `title description`,
 *  schema: z.object({}),
 *  dependencies: [image]
 * })
 * ```
 */
export const createRegistration = <TName extends Typename = Typename, TSchema extends Schema = Schema<TName>>(
  payload: CreateRegistrationStruct<TName, TSchema>,
): RegistrationStruct<TName, TSchema> => {
  const fragmentName = payload.fragmentName || `${payload.__typename}Fragment`
  const fragment = `fragment ${fragmentName} on ${payload.__typename} {${payload.fragment}}`

  return {
    __typename: payload.__typename,
    dependencies: payload.dependencies || [],
    fragment,
    fragmentName,
    schema: payload.schema,
  }
}

/**
 * Use this method to prepare a piece of content for registration with Pigeon.
 *
 * ### Example
 * ```ts
 * const hero = createDependency({
 *  __typename: "HeroRecord",
 *  fragment: `title description`,
 *  schema: z.object({}),
 *  dependencies: [image]
 * })
 * ```
 */
export const createDependency = <TName extends Typename = Typename, TSchema extends ZodSchema = ZodSchema>(
  payload: CreateDependencyStruct<TName, TSchema>,
): DependencyStruct<TName, TSchema> => {
  const fragmentName = payload.fragmentName || `${payload.__typename}Fragment`
  const fragment = `fragment ${fragmentName} on ${payload.__typename} {${payload.fragment}}`

  return {
    __typename: payload.__typename,
    dependencies: payload.dependencies || [],
    fragment,
    fragmentName,
    schema: payload.schema,
  }
}

const recursivelyCollectFragments = (value: RegistrationStruct | DependencyStruct, collected: ComponentMap) => {
  collected.set(value.fragmentName, value)
  if (!value.dependencies) return

  for (let i = 0; i < value.dependencies.length; i++) {
    const next = value.dependencies[i]
    if (next) recursivelyCollectFragments(next, collected)
  }
}

/**
 * Given a list of components, this method will collect all the fragments
 * needed for a query. It will automatically collect any dependencies that
 * are needed and make sure they are unique.
 *
 * This allows you to collect fragments without needing to create
 * a Pigeon instance using `createPigeon`.
 *
 * ### Example
 * ```ts
 * const Hero = createRegistration({...})
 * const Image = createRegistration({...})
 *
 * const fragments = collectFragments([Hero, Image])
 * ```
 */
export const collectFragments = (components: (RegistrationStruct | DependencyStruct)[]) => {
  const map: ComponentMap = new Map()
  for (const value of components) {
    recursivelyCollectFragments(value, map)
  }

  const fragments: string[] = []

  for (const value of map.values()) {
    fragments.push(value.fragment)
  }

  return fragments.join("\n")
}

type ExtractArrayTypes<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never

/**
 * Creates a new instance of Pigeon, your project will have multiple of these depending
 * on how you've structyured your content model.
 *
 * Only register the components that are at the top-level of your GraphQL query.
 */
export const createPigeon = <TRegistration extends RegistrationStruct>(components: TRegistration[]) => {
  type TComponents = TRegistration[]
  type TOutput = z.output<ExtractArrayTypes<TComponents>["schema"]>
  type TInput = z.input<ExtractArrayTypes<TComponents>["schema"]>

  const _input: TInput[] = []
  const _output: TOutput[] = []

  return {
    components,
    /**
     * The input of the query, this is the data that is returned from the CMS.
     *
     * This is used for type checking the input of the validate method. Use the `input` type exported
     * by Pigeon to type check the input of the validate method.
     *
     * ```ts
     * import { type input } from "@adrocodes/pigeon"
     *
     * const pigeon = createPigeon([...])
     * type Input = input<typeof pigeon>
     * ```
     */
    _input,
    /**
     * The output of the query, this is the data that is sent to your components.
     *
     * This is used for type checking the output of the validate method. Use the `output` type exported
     * by Pigeon to type check the output of the validate method.
     *
     * ```ts
     * import { type output } from "@adrocodes/pigeon"
     *
     * const pigeon = createPigeon([...])
     * type Output = output<typeof pigeon>
     * ```
     */
    _output,
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
      return collectFragments(components)
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
    validate: async (data: TInput[]): Promise<TOutput[]> => {
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

export type output<T extends { _output: unknown }> = T["_output"]
export type input<T extends { _input: unknown }> = T["_input"]
