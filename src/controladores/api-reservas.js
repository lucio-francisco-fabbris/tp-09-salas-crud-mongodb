const mongoose = require("mongoose");
const { formatearReserva } = require("../utils/formatear");

function crearControladorApiReservas(servicioReserva) {
  async function listar(req, res, next) {
    try {
      if (Array.isArray(req.query.sala)) {
        return res.status(400).json({
          error: "El parámetro de filtro 'sala' no puede estar repetido.",
        });
      }

      const filtro = {};
      if (req.query.sala) {
        filtro.sala = req.query.sala;
      }

      const reservas = await servicioReserva.listar(filtro);
      const resultado = reservas.map(formatearReserva);
      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async function obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ error: "El ID proporcionado no tiene un formato válido." });
      }

      const reserva = await servicioReserva.obtenerPorId(id);
      if (!reserva) {
        return res.status(404).json({
          error: "No se encontró ninguna reserva con el ID especificado.",
        });
      }

      return res.status(200).json(formatearReserva(reserva));
    } catch (error) {
      next(error);
    }
  }

  async function crear(req, res, next) {
    try {
      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          error: "El cuerpo de la solicitud debe ser un objeto JSON válido.",
        });
      }

      const reservaGuardada = await servicioReserva.crear(req.body);
      const reservaFormateada = formatearReserva(reservaGuardada);

      const locationUrl = `/api/reservas/${reservaFormateada.id}`;
      res.setHeader("Location", locationUrl);

      return res.status(201).json(reservaFormateada);
    } catch (error) {
      if (error.name === "ValidationError") {
        const errores = Object.values(error.errors).map((e) => e.message);
        return res
          .status(400)
          .json({ error: "Error de validación", detalles: errores });
      }
      next(error);
    }
  }

  return {
    listar,
    obtenerPorId,
    crear,
  };
}

module.exports = crearControladorApiReservas;
