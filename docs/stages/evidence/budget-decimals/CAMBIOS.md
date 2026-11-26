# Decimales automáticos en Presupuesto mensual

Se conserva la versión 132 y se cambia únicamente el control compartido de importes del presupuesto (`BudgetControls.web.tsx`).

- Reutiliza `moneyKeystroke` y `moneyDisplay`, los mismos de ingresos y gastos. Escribir 1 → 0.01; continuar con 0 → 0.10; otro 0 → 1.00.
- Admite retroceso, reemplazo, borrado y pegado de cantidades. Mantiene las validaciones de importes no negativos y rango.
- Usa `inputAmount` para representar importes existentes con precisión de centavos.
- La cantidad editada actualiza inmediatamente la distribución y la gráfica; guardar conserva el mecanismo existente.
- Se aplica a las cantidades de categorías y al formulario de gastos anuales, que comparten el control. El ingreso/balance permanece en solo lectura.
- Se conservan transferencias activadas, contraste, disposición compacta y ubicación de Gastos anuales dentro de Distribuye tu dinero.

No hay cambios en tablas, autenticación, cálculos financieros, motores de transferencias ni otras pantallas. Rama: `fix/budget-auto-decimals` en `dieliza/edumoney`.

Validación: seis casos nuevos del control y once casos existentes de interfaz del presupuesto. TypeScript y ESLint pasan. La comprobación del paquete exige modificar solo el módulo 33004 y reutilizar el formateador publicado 1128; los demás módulos permanecen idénticos. No se utilizaron datos financieros reales. No se dispone de Safari/dispositivos físicos para revisión visual.

Estado final y pruebas en `source-result.json`, `validation.json`, `artifact-check.json` y `public-delivery.json`.

## Resultado final

Publicado: **versión 133**, build `budget-decimals-28dbbbeb45a4`, commit Sites `330a3d307b0686120cab58cff2594c37ebbab089`. Despliegue `appgdep_6b08a90ab9c88191a0526434ca958241`: `succeeded`, configuración de servicios en revisión 4.

URL: https://edumoney-web.diegoluissantospabon.chatgpt.site

19 casos ejecutados y correctos: 17 de código/interfaz, uno de paquete y uno de entrega pública. TypeScript y ESLint correctos. Se verificó desde la URL pública el código del control que llama al formateador existente y el actualizador. No se realizó revisión física en Safari.
