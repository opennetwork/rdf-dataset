import promise from "./example.js"

promise
  .then(result => {
    console.log({ result })
    console.log("complete. bye")
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
