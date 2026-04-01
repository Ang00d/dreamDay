var mongoose = require('mongoose');
require('dotenv').config();
var Cotizacion = require('./src/models/Cotizacion');
var Disponibilidad = require('./src/models/Disponibilidad');

mongoose.connect(process.env.MONGODB_URI).then(async function() {
  var confirmadas = await Cotizacion.find({ estado: 'confirmada' });
  console.log('Cotizaciones confirmadas:', confirmadas.length);
  var creados = 0, conflictos = 0;
  for (var c of confirmadas) {
    if (!(c.evento && c.evento.fecha)) continue;
    for (var s of c.servicios) {
      try {
        await Disponibilidad.findOneAndUpdate(
          { servicioId: s.servicioId, fecha: c.evento.fecha },
          { estado: 'ocupado', citaId: c._id },
          { upsert: true }
        );
        creados++;
      } catch(e) {
        conflictos++;
        console.log('CONFLICTO:', s.nombre, 'en', c.evento.fecha);
      }
    }
  }
  console.log('Registros creados:', creados, '| Conflictos:', conflictos);
  process.exit(0);
});
