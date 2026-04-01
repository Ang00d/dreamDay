/* ============================================
   DREAM DAY — Paso 3: Datos del Cliente
   
   Formulario con:
   - Nombre, Email, Telefono
   - Ubicacion del evento, Codigo Postal
   - Notas adicionales (opcional)
   
   ★ Demuestra: validacion en tiempo real
   ============================================ */

function PasoDatos({ nombre, email, telefono, ubicacion, codigoPostal, notas, onUpdate }) {
  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.3rem',
        color: 'var(--texto-oscuro)',
        marginBottom: '1.5rem'
      }}>
        Tus datos de contacto
      </h3>

      <div className="paso-datos-grid">
        {/* Nombre */}
        <div className="form-field">
          <label>Nombre completo *</label>
          <input
            type="text"
            placeholder="Ej: María García López"
            value={nombre}
            onChange={function (e) { onUpdate('nombre', e.target.value); }}
          />
          {nombre.length > 0 && nombre.length < 3 && (
            <span className="field-error">Mínimo 3 caracteres</span>
          )}
        </div>

        {/* Email */}
        <div className="form-field">
          <label>Email *</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={function (e) { onUpdate('email', e.target.value); }}
          />
          {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
            <span className="field-error">Email inválido</span>
          )}
        </div>

        {/* Telefono */}
        <div className="form-field">
          <label>Teléfono (10 dígitos) *</label>
          <input
            type="tel"
            placeholder="4491234567"
            maxLength="10"
            value={telefono}
            onChange={function (e) {
              // Solo permitir numeros
              var val = e.target.value.replace(/\D/g, '');
              onUpdate('telefono', val);
            }}
          />
          {telefono.length > 0 && telefono.length !== 10 && (
            <span className="field-error">Debe tener 10 dígitos</span>
          )}
        </div>

        {/* Codigo Postal */}
        <div className="form-field">
          <label>Código postal *</label>
          <input
            type="text"
            placeholder="20000"
            maxLength="5"
            value={codigoPostal}
            onChange={function (e) {
              var val = e.target.value.replace(/\D/g, '');
              onUpdate('codigoPostal', val);
            }}
          />
          {codigoPostal.length > 0 && codigoPostal.length !== 5 && (
            <span className="field-error">Debe tener 5 dígitos</span>
          )}
        </div>

        {/* Ubicacion */}
        <div className="form-field full-width">
          <label>Ubicación del evento *</label>
          <input
            type="text"
            placeholder="Ej: Salón Las Palmas, Av. Universidad 300, Ags."
            value={ubicacion}
            onChange={function (e) { onUpdate('ubicacion', e.target.value); }}
          />
          {ubicacion.length > 0 && ubicacion.length < 5 && (
            <span className="field-error">Mínimo 5 caracteres</span>
          )}
        </div>

        {/* Notas */}
        <div className="form-field full-width">
          <label>Notas adicionales (opcional)</label>
          <textarea
            placeholder="¿Algo que debamos saber? Temática, alergias, requisitos especiales..."
            value={notas}
            onChange={function (e) { onUpdate('notas', e.target.value); }}
          ></textarea>
        </div>
      </div>

      <div style={{
        background: 'var(--cafe-muy-claro)',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        marginTop: '1.5rem',
        fontSize: '0.9rem',
        color: 'var(--texto-medio)'
      }}>
        <strong style={{ color: 'var(--texto-oscuro)' }}>🔒 Privacidad:</strong> Tus datos solo
        se usan para contactarte sobre esta cotización. No compartimos tu información.
      </div>
    </div>
  );
}

export default PasoDatos;
