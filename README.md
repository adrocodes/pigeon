# @adrocodes/pigeon

> Build Jamstack with safety and speed in mind!

---

## What is Pigeon

> TODO:

## How it works

> TODO:

### CMS Model Setup

> TODO:

#### Model

<img src="docs/model-setup.png" />

#### Hero Block

<img src="docs/pigeon-hero.png" />

#### Testimonial Block

<img src="docs/pigeon-testimonial.png" />

### Manual GraphQL definition

> TODO:

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

> TODO:

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
