import { Dataset, getSetLikeFromInsertLike } from "../esnext/index.js"
import { DefaultDataFactory, isQuadLike, isQuad } from "@opennetwork/rdf-data-model"
import Y from "yjs"

const dataset = new Dataset()

const aNameMatch = {
  subject: DefaultDataFactory.blankNode("a"),
  predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
  graph: DefaultDataFactory.defaultGraph()
}

const aMatcher = dataset.match(aNameMatch)

dataset.add({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"A"@en`)
})

dataset.add({
  subject: DefaultDataFactory.blankNode("s"),
  predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
  object: DefaultDataFactory.literal(`"s"@en`),
  graph: DefaultDataFactory.defaultGraph()
})

console.log({ a: aMatcher.size, total: dataset.size })

dataset.add({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"B"@en`)
})

console.log({ a: aMatcher.size, total: dataset.size })

dataset.add({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"C"@en`)
})

console.log({ a: aMatcher.size, total: dataset.size })
console.log({ aObjects: aMatcher.toArray().map(({ object }) => object) })

const { Doc: YDoc } = Y

const doc = new YDoc()
const array = doc.getArray("set")
const ySet = getSetLikeFromInsertLike(
  array,
  (quad) => isQuad(quad) || (typeof quad === "string" && isQuadLike(JSON.parse(quad))),
  (quad) => isQuad(quad) ? quad :  DefaultDataFactory.fromQuad(JSON.parse(quad)),
  (quad) => JSON.stringify(quad),
  (leftJSON, rightJSON) => {
    const left = JSON.parse(leftJSON),
      right = JSON.parse(rightJSON)
    if (!isQuadLike(left) || !isQuadLike(right)) {
      return false
    }
    const leftQuad = DefaultDataFactory.fromQuad(left),
      rightQuad = DefaultDataFactory.fromQuad(right)
    return leftQuad.equals(rightQuad)
  }
)

const yDataset = new Dataset(ySet)

yDataset.add({
  ...aNameMatch,
  object: DefaultDataFactory.literal(`"A"@en`)
})

yDataset.add({
  subject: DefaultDataFactory.blankNode("s"),
  predicate: DefaultDataFactory.namedNode("http://xmlns.com/foaf/0.1/name"),
  object: DefaultDataFactory.literal(`"s"@en`),
  graph: DefaultDataFactory.defaultGraph()
})

console.log({ a: yDataset.match(aNameMatch).size, total: yDataset.size })
