import { Dataset, ReadonlyDataset, DatasetWatcher, mutateArray } from "../esnext/index.js"
import { DefaultDataFactory} from "@opennetwork/rdf-data-model"
import canonize from "rdf-canonize"

const watch = new DatasetWatcher({})

async function subscribe() {
  for await (const [writes, deletes] of watch) {
    console.log([...writes], [...deletes])
  }
}

const subscription = subscribe()
const dataset = new Dataset({
  watch,
  mutate: mutateArray()
})

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

dataset.add(DefaultDataFactory.fromQuad({
  ...aNameMatch,
  subject: DefaultDataFactory.blankNode('c'),
  object: DefaultDataFactory.literal(`"D"@en`)
}))

console.log({ a: aMatcher.size, total: dataset.size })
console.log({ aObjects: aMatcher.toArray().map(({ object }) => object) })
console.log({ a: await canonize.canonize(aMatcher.toArray().map(cloneQuad), { algorithm: "URDNA2015" }) })

watch.close()
await subscription

function cloneQuad(quad) {
  return DefaultDataFactory.fromQuad(JSON.parse(JSON.stringify(quad)))
}

console.log("done")
