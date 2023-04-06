type Typename = string
type Scope = string

export type RegistrationStruct = {
  /**
   * This should match up with the `__typename` value in your
   * GraphQL CMS.
   */
  __typename: Typename

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
  dependencies: Typename[]
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
  schema: import("zod").Schema
  /**
   * The scope allows content to be scoped to specific regions/content models.
   * Dynamically built queries & fragment inclusion will be based on the scope.
   * This should only be applied to "top-level" content rather than the smaller
   * pieces of content that makes up the top-level content.
   *
   * ```ts
   * const Image = createRegistration({
   *  __typename: "ImageRecord"
   * })
   *
   * const Hero = createRegistration({
   *  __typename: "HeroRecord",
   *  dependencies: [Image.__typename],
   *  scope: ["article"]
   * })
   *
   * const query = gql`
   *  ${pigeon.fromScope("article").fragments()}
   *
   *  query Article {
   *    page(...) {
   *      flexibleContent {
   *        __typename
   *        ${pigeon.fromScope("article").query()}
   *      }
   *    }
   *  }
   * `
   *
   * // Results in;
   * ```text
   * fragment ImageRecordFragment on ImageRecord {...}
   * fragment HeroRecordFragment on HeroRecord {
   *  image { ...ImageRecordFragment }
   * }
   *
   * query Article {
   *   page(...) {
   *     flexibleContent {
   *       __typename
   *       ...on HeroRecord {
   *         ...HeroRecordFragment
   *       }
   *     }
   *   }
   * }
   * ```
   * ```
   */
  scope: Scope[]
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
type CreateRegistrationStruct = Omit<RegistrationStruct, "fragmentName" | "dependencies" | "scope"> & {
  dependencies?: RegistrationStruct["dependencies"]
  scope?: RegistrationStruct["scope"]
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
 *  dependencies: [image.fragmentName],
 *  scope: ["page", "articles"]
 * })
 * ```
 */
export const createRegistration = (payload: CreateRegistrationStruct): RegistrationStruct => {
  const fragmentName = `${payload.__typename}Fragment`
  const fragment = `fragment ${fragmentName} on ${payload.__typename} {${payload.fragment}}`

  return {
    __typename: payload.__typename,
    dependencies: payload.dependencies || [],
    fragment,
    fragmentName,
    schema: payload.schema,
    scope: payload.scope || [],
  }
}

/**
 * Creates a new instance of Pigeon, your project will most likely only have one of these
 * but you can create multiple.
 */
export const createPigeon = () => {
  const components: Map<Typename, RegistrationStruct> = new Map()

  return {
    components,
    /**
     * Use this to register your components to pigeon, under the hood this uses a `Map`.
     * Meaning you can register the same component twice and only the latest one will be
     * used.
     */
    register: function (component: RegistrationStruct) {
      components.set(component.__typename, component)
      return this
    },
    scope: <S extends Scope>(scope: S extends "" ? never : S) => {
      const scopedComponents: Map<Typename, RegistrationStruct> = new Map()

      components.forEach((value) => {
        if (value.scope.includes(scope)) {
          scopedComponents.set(value.__typename, value)
        }
      })

      return {
        components: scopedComponents,
        query: () => undefined,
        fragment: () => undefined,
        validate: () => undefined,
      }
    },
  }
}
