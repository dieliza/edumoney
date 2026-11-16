# Para el contable solo en Configuración — 2026.11.16.3

- Único enlace operativo al expediente: Configuración → Para el contable.
- Retirados botones y preguntas contables de Nueva transacción y revisión de capturas, acceso de cheques/talonarios, menú lateral y vista previa.
- Perfil, preguntas de orientación, revisión de movimientos/documentos, informativas y exportación continúan en el expediente existente.
- Conservados indicadores contables de registros existentes al editarlos. No se modifican almacenamiento, reglas de clasificación automática, cálculos financieros, autenticación, APIs ni imágenes históricas. Sin migraciones.
- Verificación de referencias: el único router.push('/tax') está en SettingsScreen; ExpenseGuideFields solo se utiliza dentro del módulo tax.
- Cinco pruebas de interfaz existentes correctas: separación ingreso/gasto, guardado, validación y protección de doble pulsación. TypeScript correcto; ESLint y compilación final registrados al publicar.
- No se hizo verificación en dispositivos físicos ni navegador visual en este entorno.
