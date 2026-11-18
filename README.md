# 🎙️ App Nota de Voz con QR

Aplicación sencilla para que alumnos de distintos niveles (Prescolar, Primaria, Secundaria y Bachillerato) graben una nota de voz, se guarde en Google Drive y se genere un código QR que, al escanearse, reproduzca **solo** el audio de ese alumno.

## Estructura del proyecto

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Formulario del alumno, grabación de audio y generación del QR. |
| `script.js` | Lógica de grabación (MediaRecorder), envío a Google Apps Script y creación del QR. |
| `Code.gs` | Google Apps Script: recibe el audio, lo guarda en Drive, lo comparte públicamente y lo registra en una hoja de cálculo. |
| `escuchar.html` | Página de reproducción que abre el QR y muestra el reproductor de audio correspondiente. |
| `README.md` | Estas instrucciones. |

---

## 1. Requisitos previos

- Una cuenta de Google (Gmail o Google Workspace for Education).
- Acceso a [Google Apps Script](https://script.google.com/).
- Un lugar para hospedar los archivos HTML (GitHub Pages, Netlify, Firebase Hosting o cualquier servidor estático con HTTPS).
- Los archivos deben servirse por **HTTPS** para que el navegador permita el uso del micrófono.

---

## 2. Configuración de Google Drive y Google Sheets

1. Crea una carpeta en **Google Drive** donde se guardarán los audios.
2. Abre la carpeta y copia su **ID** (la parte larga de la URL después de `/folders/`).
3. Crea una **Hoja de cálculo de Google** nueva.
4. Copia su **ID** (parte de la URL entre `/d/` y `/edit`).
5. En la primera fila de la hoja, agrega estos encabezados (opcional, Apps Script los usa como referencia):
   - `nombre`, `nivel`, `grupo`, `fileId`, `fileUrl`, `fecha`

---

## 3. Desplegar el backend en Google Apps Script

1. Ve a [script.google.com](https://script.google.com/) y crea un **nuevo proyecto**.
2. Borra el código predeterminado y pega todo el contenido de `Code.gs`.
3. Edita las constantes al inicio del archivo:
   ```javascript
   const DRIVE_FOLDER_ID = 'TU_CARPETA_DRIVE_ID';
   const SHEET_ID = 'TU_HOJA_CALCULO_ID';
   ```
4. Haz clic en **Implementar > Nueva implementación**.
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** (o "Dentro de tu organización" si usas Google Workspace para educación)
5. Copia la **URL de implementación** que se genera.
6. Pega esa URL en `script.js` en la constante `APPS_SCRIPT_URL`.

> ⚠️ Cada vez que modifiques `Code.gs`, debes crear una **nueva versión** de la implementación para que los cambios surtan efecto.

---

## 4. Configurar el frontend (`script.js`)

Edita `script.js` y reemplaza los marcadores:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec';
const LISTEN_BASE_URL = 'https://tu-dominio.com/escuchar.html';
```

- `APPS_SCRIPT_URL`: la URL que obtuviste al desplegar Apps Script.
- `LISTEN_BASE_URL`: la URL donde alojarás `escuchar.html` (por ejemplo tu GitHub Pages).

---

## 5. Hospedar los archivos estáticos

Sube `index.html`, `script.js` y `escuchar.html` a un hosting estático con HTTPS:

- **GitHub Pages** (gratis, recomendado)
- **Netlify** (gratis, arrastrar y soltar la carpeta)
- **Firebase Hosting**

Asegúrate de que `escuchar.html` sea accesible públicamente, ya es la página que se abre al escanear el QR.

---

## 6. Flujo de uso

### Para el alumno (grabación)
1. Abre `index.html` en el celular o computadora.
2. Escribe su nombre, selecciona su nivel y grupo.
3. Presiona **Iniciar grabación**, habla y detén la grabación.
4. Opcional: presiona **Escuchar previa** para revisarla.
5. Presiona **Guardar y generar QR**.
6. La app sube el audio a Drive, genera el QR y lo muestra en pantalla.
7. Descarga o imprime el QR y péguelo en el trabajo del alumno.

### Para el docente / padre / visitante (reproducción)
1. Escanea el QR con la cámara del celular.
2. Se abre `escuchar.html?id=ARCHIVO_ID`.
3. Se reproduce **únicamente** el audio de ese alumno.

---

## 7. Cómo funciona la privacidad de cada QR

Cada QR contiene una URL única con el `id` del archivo en Drive:

```
https://tu-dominio.com/escuchar.html?id=1AbC2dEfGhIj...
```

- El archivo en Drive se comparte como **"Cualquier persona con el enlace puede ver"**, así no hace falta iniciar sesión en Google para escucharlo.
- La página `escuchar.html` lee el `id` de la URL y carga solo ese archivo en el reproductor `<audio>`.
- Escanear el QR del alumno A solo reproduce la nota del alumno A.

---

## 8. Limitaciones conocidas

| Limitación | Detalle |
|------------|---------|
| Códecs de audio | El navegador graba en `audio/webm` (Chrome/Edge/Android). En iOS Safari puede no reproducirse directamente; si lo necesitas, se puede convertir a MP3 en el servidor. |
| Tamaño de archivo | Se envía en base64, lo que aumenta el peso ~33%. Para notas de voz cortas no es problema. Para audios largos, mejor usar subida multipart directa. |
| Drive público | Los archivos deben estar compartidos públicamente para que el `<audio>` los cargue sin autenticación. No uses este sistema para datos sensibles. |
| Límite de Drive | Las cuentas gratuitas de Google Drive tienen límites de almacenamiento compartido (15 GB). |

---

## 9. Mejoras futuras sugeridas

- Autenticación de docentes para subir/gestionar audios.
- Conversión automática a MP3 para compatibilidad total en iOS.
- Panel del docente para listar y descargar todas las grabaciones por nivel/grupo.
- Descarga masiva de QR en un solo PDF.

---

## Soporte

Si necesitas ayuda para desplegar en Google Apps Script o configurar el hosting, dime en qué paso estás y con gusto te guío.