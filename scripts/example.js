import { Dataset } from "../esnext/index.js"
import { DefaultDataFactory} from "@opennetwork/rdf-data-model"

const dataset = new Dataset()

const aNameMatch = {
  subject: DefaultDataFactory.blankNode("a"),
  predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
  graph: DefaultDataFactory.defaultGraph()
}

const aMatcher = dataset.match(aNameMatch)

dataset.add(DefaultDataFactory.fromQuad({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"A"@en`)
}))

dataset.add(DefaultDataFactory.fromQuad({
  subject: DefaultDataFactory.blankNode("s"),
  predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
  object: DefaultDataFactory.literal(`"s"@en`),
  graph: DefaultDataFactory.defaultGraph()
}))

console.log({ a: aMatcher.size, total: dataset.size })

dataset.add(DefaultDataFactory.fromQuad({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"B"@en`)
}))

console.log({ a: aMatcher.size, total: dataset.size })

dataset.add(DefaultDataFactory.fromQuad({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"C"@en`)
}))

console.log({ a: aMatcher.size, total: dataset.size })
console.log({ aObjects: aMatcher.toArray().map(({ object }) => object) })
