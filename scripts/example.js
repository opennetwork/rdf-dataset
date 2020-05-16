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

  // _:art <http://xmlns.com/foaf/0.1/name> "Art Barstow"
  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"ArtA"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  console.log(artMatcher.size)

  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"ArtBB"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  console.log(artMatcher.size)

  context.store.add(DefaultDataFactory.fromQuad({
    subject: DefaultDataFactory.blankNode("_:art"),
    predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
    object: DefaultDataFactory.literal(`"ArtC"@en`),
    graph: DefaultDataFactory.defaultGraph()
  }))

  console.log(artMatcher.size)

  console.log(context.store.toArray())

})

export default import("@opennetwork/environment/esnext/runtime/run.js")
  .then(({ default: promise }) => promise)
