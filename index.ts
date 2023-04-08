type Typename = string
type Scope = string
type ComponentMap = Map<Typename, RegistrationStruct>

export type RegistrationStruct<T extends Typename = Typename> = {
  /**
   * This should match up with the `__typename` value in your
   * GraphQL CMS.
   */
  __typename: T

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
  schema: import("zod").ZodSchema<{ __typename: T }>
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
   *  ${pigeon.scope("article").fragments()}
   *
   *  query Article {
   *    page(...) {
   *      flexibleContent {
   *        __typename
   *        ${pigeon.scope("article").query()}
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
type CreateRegistrationStruct<T extends Typename = Typename> = Omit<
  RegistrationStruct<T>,
  "fragmentName" | "dependencies" | "scope"
> & {
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
 *  dependencies: [image.__typename],
 *  scope: ["page", "articles"]
 * })
 * ```
 */
export const createRegistration = <T extends Typename>(payload: CreateRegistrationStruct<T>): RegistrationStruct<T> => {
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

const recursivelyCollectFragments = (components: ComponentMap, value: RegistrationStruct, collected: ComponentMap) => {
  collected.set(value.__typename, value)
  for (let i = 0; i < value.dependencies.length; i++) {
    const next = components.get(value.dependencies[i] as string)
    if (next) recursivelyCollectFragments(components, next, collected)
  }
}

/**
 * Creates a new instance of Pigeon, your project will most likely only have one of these
 * but you can create multiple.
 */
export const createPigeon = () => {
  const components: ComponentMap = new Map()

  return {
    components,
    /**
     * Use this to register your components to pigeon, under the hood this uses a `Map`.
     * Meaning you can register the same component twice and only the latest one will be
     * used.
     */
    register: function <T extends Typename = Typename>(component: RegistrationStruct<T>) {
      components.set(component.__typename, component)
      return this
    },
    /**
     * Extract a subset of components by scope, use this to generate queries, fragments
     * and validate data against the CMS data.
     *
     * `scope` expects a non-empty string
     */
    scope: <S extends Scope>(scope: S extends "" ? never : S) => {
      const scopedComponents: ComponentMap = new Map()

      components.forEach((value) => {
        if (value.scope.includes(scope)) {
          scopedComponents.set(value.__typename, value)
        }
      })

      return {
        components: scopedComponents,
        /**
         * Generates the query needed in the flexible content query.
         *
         * ```ts
         * const query = gql`
         *  query Article {
         *    page(...) {
         *      flexibleContent {
         *        __typename
         *        ${pigeon.scope("article").query()}
         *      }
         *    }
         *  }
         * `
         * ```
         */
        query: () => {
          const query: string[] = []

          for (const [key, value] of scopedComponents) {
            query.push(`...on ${key} { ...${value.fragmentName} }`)
          }

          return query.join("\n")
        },
        /**
         * Generates the fragments needed for a scoped query.
         *
         * ```ts
         * const query = gql`
         *  ${pigeon.scope("article").fragments()}
         *
         *  query Article {
         *    page(...) {
         *      flexibleContent {
         *        __typename
         *        ${pigeon.scope("article").query()}
         *      }
         *    }
         *  }
         * `
         * ```
         */
        fragments: () => {
          const map: ComponentMap = new Map()
          for (const value of scopedComponents.values()) {
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
         * If a entry is not apart of the scope - it will be ignored and not present in the
         * returned results.
         *
         * If **any** of the validations fail, this method will throw a `ZodError`.
         *
         * ### Example
         * ```ts
         * const { data } = await client.query({ query })
         *
         * const results = await pigeon.scope("page").validate(data.flexibleContent)
         * ```
         *
         * @throws {import("zod").ZodError}
         */
        validate: async <T extends Typename, D extends { __typename: T }>(data: D[]) => {
          const validationPromises = []
          for (const value of data) {
            const component = scopedComponents.get(value.__typename)

            if (component) {
              validationPromises.push(component.schema.parseAsync(value))
            }
          }

          const result = await Promise.all(validationPromises)
          return result
        },
      }
    },
  }
}
