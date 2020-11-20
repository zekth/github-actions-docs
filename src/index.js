const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const START_TAG = "<!-- GHA START -->";
const END_TAG = "<!-- GHA END -->";

async function main() {


}

if (require.main === module) {
  main().catch((e) => {
    console.log("Something terrible happened");
    console.log(e);
  });
}
