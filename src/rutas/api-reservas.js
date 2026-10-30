const { Router } = require("express");

function crearRouterApiReservas(controladorApi) {
  const router = Router();

  router.get("/", controladorApi.listar);
  router.get("/:id", controladorApi.obtenerPorId);
  router.post("/", controladorApi.crear);

  return router;
}

module.exports = crearRouterApiReservas;
