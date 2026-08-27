// Dynamo Exporter Desktop: the renderer does not need Node APIs. Keep this file intentionally empty except for a stable version marker.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("dynamoDesktop", {
  runtime: "electron",
  version: "1.0.0",
});
