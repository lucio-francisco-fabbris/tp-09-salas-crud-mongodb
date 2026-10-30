const Reserva = require("../modelos/reservas");

function crearServicioReservas() {
  async function listar(filtro = {}) {
    const criterio = {};

    if (filtro.sala) {
      criterio.sala = filtro.sala;
    }

    return await Reserva.find(criterio);
  }

  async function obtenerPorId(id) {
    return await Reserva.findById(id);
  }

  async function contar() {
    return await Reserva.countDocuments();
  }

  async function crear(datos) {
    const reservaLimpia = {
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
    };

    const nuevaReserva = new Reserva(reservaLimpia);
    return await nuevaReserva.save();
  }

  return {
    listar,
    obtenerPorId,
    contar,
    crear,
  };
}

module.exports = crearServicioReservas;
