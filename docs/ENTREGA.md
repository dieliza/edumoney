# Estado de entrega de EduMoney

El proyecto reúne los módulos personales y comerciales en la misma aplicación nativa. No se ha publicado ni fusionado con main. La rama de cierre es `cierre-edumoney`.

## Funciones implementadas

| Área | Función disponible |
| --- | --- |
| Diseño y navegación | Bienvenida, temas claro/oscuro/automático persistentes, pestañas Mi dinero, Mis metas, Aprende, Mi progreso y Negocio |
| Mi dinero | Ingresos, gastos, categorías, presupuesto, historial y relaciones para evitar duplicados; balance estimado |
| Facturas y deudas | Recurrencias, pagos parciales registrados, recordatorios locales, historial, comparaciones y simulación de deuda |
| Metas y aprendizaje | Objetivos, aportaciones, progreso, lecciones y simuladores con supuestos explícitos |
| Documentos | Revisión de OCR/voz locales cuando hay capacidad, alternativa manual y copias locales cifradas elegidas por el usuario |
| Para mi contable | Clasificación, pendientes, conciliación y exportación seleccionada para revisión |
| Planilla | Motor determinístico limitado a año/casos soportados, cálculo sin requisito de CPA, borradores y exportación; sin radicación |
| Negocio | Titulares, DBA, proyectos, movimientos repartidos, uso mixto, comprobantes, exportación y reservas manuales |
| IVU y contratistas | Simuladores y registros separados de cobrado/retenido, remitido/depositado y formularios, con fuentes y datos pendientes |
| Panel comercial | Ganancia, efectivo, reservas, proyecciones documentadas, estimadas registradas, escenarios y calendario |
| Nómina | Empleados y políticas, cálculo, retenciones/depósitos declarados, acumulados y borradores de revisión |
| Recuperación | Base SQLCipher y respaldo portátil cifrado con contraseña, validación y reemplazo confirmado |

Los módulos no ejecutan cobros, transferencias, pagos a empleados/proveedores ni pagos contributivos. No requieren cuenta de usuario en línea ni almacenamiento financiero automático en servidores. No incorporan IA en la aplicación ni notificaciones push.

## Documentación de uso e instalación

- [Guía de uso y recuperación](GUIA_USO.md).
- [Compilaciones y firma](COMPILACIONES.md): perfiles preparados en `eas.json`; no se iniciaron envíos a tiendas.
- [Privacidad](PRIVACY.md): pendiente completar identidad/contacto reales del responsable.
- [Calidad y alcance de pruebas](QUALITY_RELEASE.md): conserva evidencias históricas y pendientes físicos.

## Límites de la entrega

Hay compilaciones de emulador Android y simulador iOS, más un APK interno arm64 para probar en un teléfono Android. Para una instalación física iOS se necesitan firma y aprovisionamiento de Apple; Google Play necesita su preparación de cuenta/firma. No hay credenciales de distribución configuradas en este entorno. Preparar perfiles no equivale a generar paquetes físicos firmados.

El logo oficial fue recibido como archivo PNG e integrado en bienvenida e icono. Se conserva el archivo original completo, sin recortes, filtros ni regeneración. Ver [actualización del logo](stages/LOGO-OFICIAL.md).

Faltan comprobaciones en dispositivos: cámara/modelos de voz, permisos, avisos/calendario, lectores de pantalla, tamaño máximo de letra, batería y respaldo/recuperación entre instalaciones mediante Archivos. No se sustituyen con resultados del simulador o navegador.

La planilla 2026 no reutiliza fórmulas 2025. Los componentes no soportados o desconocidos permanecen pendientes. Los borradores no son emisión oficial ni radicación; no se afirma certificación de Hacienda. Las validaciones de formato y trámites oficiales siguen siendo independientes del uso autónomo de cálculos.

El panel completo y el escenario parcial aprobaron los recorridos seleccionados Android/iOS. La regresión Android cerró el retorno de exportación CSV. Resultados, capturas y conteo conservador de 95 casos/intentos se conservan en [CIERRE-APP.md](stages/CIERRE-APP.md). El [APK interno Android arm64](https://github.com/dieliza/edumoney/actions/runs/43191749565/artifacts/13931512804) compiló correctamente; contiene JavaScript y no requiere Metro. Usar datos ficticios: no se ha ejecutado en un teléfono físico y no es una firma de distribución oficial.

Actualización del logo oficial: [integración, comprobación y APK](stages/LOGO-OFICIAL.md).
