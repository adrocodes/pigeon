# @adrocodes/pigeon

> Build Jamstack with safety and speed in mind!

---

## What is Pigeon

Pigeon provides a standard way to integrate with a CMS to build content pages. It allows GraphQL queries to be generated for you, collect and de-deupe fragments and validate data against a `zod` schema.

It also allows you to write your components once and create CMS specific integrations. This is done through the `transform` setup on your `zod` schema. Utilising this schema we can also validate incoming data to ensure it is the structure that you are expecting, allowing you to react to CMS changes or alter your components to be more flexible depending on the data.

## How it works

With Pigeon you'll be defining a consistent schema for your data which includes a validation model using `zod`, incoming CMS data will be validated against this data to ensure you get the data you're expecting. Additionally, creating dependencies between components will allow you to generate GraphQL queries and collect fragments for those queries to make the integration easy.

### CMS Model Setup

Pigeon works on the assumption that you're allowing clients to structure pages using "blocks" of content, similar to lego. The author has the choice of multiple components to place on the page. I borrow the "Flexible Content" terminology from Advanced Custom Fields (WordPress), but whatever naming works. Essentially in the end you'll be building out a query which will return an array of different components.

#### Model

<img src="docs/model-setup.png" />

#### Hero Block

<img src="docs/pigeon-hero.png" />

#### Testimonial Block

<img src="docs/pigeon-testimonial.png" />

### Manual GraphQL definition

With the model above, you'd be expected to write a query similar to the one below. We're separating out the different components are fragments, this allows for reuse if a different page content type uses the same component, its better to have a single source of truth.

```graphql
fragment HeroFragment on PigeonHeroRecord {
  id
  title
  image {
    url
    alt
  }
}

fragment TestimonialFragment on PigeonTestimonialRecord {
  id
  content
  source
}

query PigeonPage {
  pigeon {
    flexibleContent {
      __typename
      ... on PigeonHeroRecord {
        ...HeroFragment
      }
      ... on PigeonTestimonialRecord {
        ...TestimonialFragment
      }
    }
  }
}
```

### Data transformation

There are 2 ways you can approach building your site:

1. Base your component props on the CMS data - from experience this usually results in me rebuilding a Hero banner every project.
2. Build generic components and transform your CMS data to match your props.

Option 2 is my favourite, it promotes reusability across projects and means you can continually build up a collection of components you can use across new projects. Saving time and allowing you to focus on building cool shit.

With option 2 in mind, once we have our data we need to run some transformation on it. You'll most likely set up some type of mapping object to map the `__typename` to a transformation function and loop through the data each and transform each as needed.

```ts
const mapping = {
  // These functions will probably be extracted into another file somewhere
  PigeonHeroRecord: (input: HeroCmsData): HeroProps => {...},
  PigeonTestimonialRecord: (input: TestimonialCmsData): TestimonialProps => {...}
}

const data = client.query(...)

return data.pigeon.flexibleContent.map((value) => {
  return mapping[value.__typename](value)
})
```

This will mostly likely cause some TypeScript errors about mismatching types or possible undefined errors, but in that cause nothing a good old `any` can't fix.

### Reacting to model changes

> TODO:

## Comparing this to Pigeon

> TODO:

### Setup:

```bash
npm i @adrocodes/pigeon zod
```

```bash
yarn add @adrocodes/pigeon zod
```

```bash
pnpm i @adrocodes/pigeon zod
```

### Registering components

> TODO:

### Building the query

> TODO:

### Validation data

> TODO:
