/* ============================================
   DREAM DAY — Componente: Modal
   
   Modal/Dialog reutilizable que bloquea la pantalla
   con un overlay y muestra contenido centrado.
   
   Props:
     abierto    — boolean: si el modal está visible
     onCerrar   — function: al cerrar el modal
     titulo     — string: título del modal
     tipo       — 'alerta' | 'exito' | 'info' | 'confirmar' (cambia color)
     children   — contenido del modal
     cerrable   — boolean: si se puede cerrar (default true)
   ============================================ */

import { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import './Modal.css';

var iconos = {
  alerta: <AlertTriangle size={32} />,
  exito: <CheckCircle size={32} />,
  info: <Info size={32} />,
  confirmar: <HelpCircle size={32} />
};

export default function Modal({ abierto, onCerrar, titulo, tipo, children, cerrable }) {
  if (cerrable === undefined) cerrable = true;

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(function () {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return function () {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  // Cerrar con Escape
  useEffect(function () {
    if (!abierto || !cerrable) return;
    function handleKey(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', handleKey);
    return function () { window.removeEventListener('keydown', handleKey); };
  }, [abierto, cerrable, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={cerrable ? onCerrar : undefined}>
      <div className={'modal-contenido modal-' + (tipo || 'info')} onClick={function (e) { e.stopPropagation(); }}>
        {cerrable && (
          <button className="modal-cerrar" onClick={onCerrar}>
            <X size={20} />
          </button>
        )}
        {(titulo || tipo) && (
          <div className="modal-header">
            {tipo && iconos[tipo] && (
              <span className={'modal-icono modal-icono-' + tipo}>
                {iconos[tipo]}
              </span>
            )}
            {titulo && <h2 className="modal-titulo">{titulo}</h2>}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
