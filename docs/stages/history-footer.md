# Corrección de edición de historiales y zafacón

Solicitud: mover el acceso de fondos al final, como enlace azul pequeño; corregir la edición en Ahorros, Emergencia y Presupuesto mensual; disponer del zafacón en ingresos y gastos. El propietario autorizó publicar al terminar sin otra confirmación.

La foto mostraba dos transferencias eliminadas/revertidas. La versión anterior ocultaba todos sus controles y el botón grande solo cambiaba un estado sin abrir una ventana; por eso no había un cambio visible con esos registros.

- Se reutiliza TransactionLink, el mismo enlace azul del formulario Nueva transacción, al final del historial.
- Abre una ventana con los registros y acciones Editar/Eliminar para los vigentes. Los eliminados permiten corregir fecha, importe y descripción, manteniendo origen, destino, estado de eliminación y motivo original.
- La corrección de un eliminado queda auditada, comprueba la versión y no reactiva dinero ni modifica balances, metas o ingresos/gastos. No se añadió restauración automática.
- Guardar la corrección de una transferencia ya confirmada no vuelve a exigir confirmar una distribución nueva. Las nuevas transferencias sí conservan esa confirmación.
- La edición identifica el registro por su ID y reinicia el editor al cambiar de registro.
- El zafacón se conserva en gastos y se habilita igualmente en ingresos; reutiliza los controles de vínculos, versiones, documentos y eliminación reversible existentes.

Archivos principales: FundTransfers.tsx, TransferEditor.tsx, funds/store.ts, money/TransactionHistory.tsx y money/store.ts. No hay cambios de esquema, autenticación, servicios ni servidor. La integración web cambia seis módulos y conserva los otros 1,411.

Verificación: 39 casos de código aprobados (3 interfaz de historial de fondos, 3 edición de eliminados con SQLite, 21 fondos existentes, 8 edición/eliminación de gastos/ingresos, 2 zafacones y 2 editor de transferencias); una comprobación de paquete repetida tras corregir la creación de su carpeta temporal de evidencia; 9 casos sobre el paquete exacto. Total conservador: 50 de 100 ejecuciones. TypeScript y ESLint sin errores; queda la advertencia anterior de req sin usar. Compilación aprobada. No se usaron registros reales ni se hizo una prueba visual con Safari.

Commit candidato: 37b070df8f2a3216f007e7a98ffe0c51e838d9c3, sobre producción 110. Publicación en curso según autorización expresa del usuario.
