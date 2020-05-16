import { Dataset } from "../esnext/index.js"
import { addEventListener, getEnvironmentContext } from "@opennetwork/environment"
import {
  DefaultDataFactory
} from "@opennetwork/rdf-data-model";
import { asyncIterable } from "iterable"

addEventListener("configure", () => {

  const context = getEnvironmentContext()

  context.store = new Dataset()

})

addEventListener("execute", async () => {

  const context = getEnvironmentContext()

  // console.log(await context.store.match({
  //   subject: {
  //     termType: "Variable",
  //     value: "1"
  //   }
  // }).toSet())
  // console.log(context.store.lazySet.has({}))

  const artMatcher = context.store.match({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name")
  })

  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"ArtA"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:smart"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"Smart"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  console.log(artMatcher.size, context.store.size)

  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"ArtB"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  console.log(artMatcher.size, context.store.size)

  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"ArtC"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  console.log(artMatcher.size, context.store.size)

  console.log(context.store.toArray())

})

export default import("@opennetwork/environment/esnext/runtime/run.js")
  .then(({ default: promise }) => promise)
