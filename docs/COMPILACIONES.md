# Compilaciones de EduMoney

## Perfiles preparados

`eas.json` usa configuración documentada en https://docs.expo.dev/eas/json/ (consultada 2026-11-12):

| Perfil | Android | iOS |
| --- | --- | --- |
| simulator | APK interno | Simulador, no instalable en un iPhone/iPad |
| preview | APK interno | Dispositivo con firma y aprovisionamiento de Apple |
| production | Android App Bundle | Compilación para distribución con firma de Apple |

No se ha solicitado publicación ni envío a tiendas. Preparar el perfil no significa que exista una compilación firmada. No se añaden secretos, identificadores de cuenta ni datos personales ficticios a la configuración.

Para generar paquetes físicos mediante EAS, el responsable deberá conectar su proyecto EAS y las credenciales de firma correspondientes. La documentación oficial de compilación es https://docs.expo.dev/build/introduction/. No compartas contraseñas o claves privadas en un chat.

Las acciones de GitHub de este proyecto generan APK x86_64 y aplicación iOS de simulador con datos ficticios de prueba. Sus artefactos tienen retención limitada. No son una entrega de App Store, TestFlight o Google Play ni reemplazan pruebas en teléfonos.

## Antes de distribuir

Revisar `QUALITY_RELEASE.md`, completar los datos de contacto de privacidad, comprobar permisos/cámara/voz/calendario/avisos locales en dispositivos y validar recuperación en otra instalación. Las emisiones contributivas oficiales y los casos no soportados permanecen identificados; no hay radicación automática. La aplicación solo registra pagos externos.

## APK interno Android disponible

[Descargar ZIP de prueba](https://github.com/dieliza/edumoney/actions/runs/43157032505/artifacts/13917325324) (retención hasta 2026-11-19). Dentro está `EduMoney-android-arm64-prueba.apk`. Se instala desde un teléfono Android arm64 compatible; no se abre como aplicación de iPhone/iPad. Usa primero datos ficticios. No requiere Metro, cuenta en EduMoney ni Google Play para una instalación interna.

La compilación directa de CI usa el proyecto nativo generado, firma de prueba y `EXPO_PUBLIC_PLANILLA_TESTS=0`. Se verificaron ABI, manifest, JavaScript y huella del archivo. No se afirma ejecución física, estabilidad de la firma para futuras actualizaciones ni preparación para tienda. Las pruebas iOS se realizaron con una aplicación de simulador; la firma física requiere su aprovisionamiento de Apple.
