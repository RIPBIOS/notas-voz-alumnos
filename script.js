// ============================================
// CONFIGURACIÓN
// ============================================
// 1. Reemplaza con la URL de tu Google Apps Script desplegado como Web App.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzG7b-cndMSXGy7HqOpnFALix48Sl86EuOwh4jDEH-GyJWUM3eU_HIgnu3Z_KbHiCNLaQ/exec';

// 2. URL base donde alojarás escuchar.html (GitHub Pages, Netlify, Firebase Hosting, etc.)
const LISTEN_BASE_URL = 'https://ripbios.github.io/notas-voz-alumnos/escuchar.html';

// ============================================
// ESTADO
// ============================================
let mediaRecorder;
let audioChunks = [];
let recordedBlob = null;
let currentFileId = null;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const btnRecord = document.getElementById('btnRecord');
const btnSave = document.getElementById('btnSave');
const btnPlay = document.getElementById('btnPlay');
const btnReRecord = document.getElementById('btnReRecord');
const btnDownloadQr = document.getElementById('btnDownloadQr');
const preview = document.getElementById('preview');
const audioPreview = document.getElementById('audioPreview');
const qrContainer = document.getElementById('qr-container'); // CORREGIDO: coincide con el HTML
const qrCodeEl = document.getElementById('qrCode');
const status = document.getElementById('status');

function setStatus(msg, type = '') {
  if (status) status.textContent = msg;
  status.className = 'status ' + type;
}

// ============================================
// GRABACIÓN DE AUDIO (MediaRecorder API)
// ============================================
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      recordedBlob = blob;
      const url = URL.createObjectURL(blob);
      if (audioPreview) audioPreview.src = url;
      if (preview) preview.classList.remove('hidden');

      if (btnRecord) {
        btnRecord.classList.remove('recording');
        btnRecord.textContent = 'Iniciar grabación';
      }
      if (btnSave) btnSave.classList.remove('hidden');
      if (qrContainer) qrContainer.style.display = 'none';

      // Detener pistas del micrófono
      stream.getTracks().forEach((t) => t.stop());

      setStatus('Grabación lista. Puedes previsualizar o guardar.');
    };

    mediaRecorder.start();
    if (btnRecord) {
      btnRecord.textContent = 'Detener grabación';
      btnRecord.classList.add('recording');
    }
    if (btnSave) btnSave.classList.add('hidden');
    setStatus('Grabando... habla ahora');
  } catch (err) {
    console.error(err);
    setStatus('No se pudo acceder al micrófono. Permite el uso del micrófono y vuelve a intentar.', 'error');
  }
}

btnRecord.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  } else {
    startRecording();
  }
});

btnPlay.addEventListener('click', () => {
  if (audioPreview) audioPreview.play();
});

btnReRecord.addEventListener('click', () => {
  if (preview) preview.classList.add('hidden');
  recordedBlob = null;
  if (btnSave) btnSave.classList.add('hidden');
  if (qrContainer) qrContainer.style.display = 'none';
  setStatus('Listo para grabar de nuevo.');
});

// ============================================
// GUARDAR Y GENERAR QR
// ============================================
btnSave.addEventListener('click', async () => {
  const nombre = document.getElementById('nombre').value.trim();
  const nivel = document.getElementById('nivel').value;
  const grupo = document.getElementById('grupo').value.trim();

  if (!nombre || !nivel || !grupo) {
    setStatus('Completa nombre, nivel y grupo antes de guardar.', 'error');
    return;
  }
  if (!recordedBlob) {
    setStatus('Primero graba un audio.', 'error');
    return;
  }

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = 'Subiendo...';
  }
  setStatus('Subiendo audio a Google Drive...');

  const reader = new FileReader();
  reader.readAsDataURL(recordedBlob);
  reader.onloadend = async () => {
    const base64Audio = reader.result;

    const payload = {
      nombre,
      nivel,
      grupo,
      audio: base64Audio
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Error al subir');

      currentFileId = data.fileId;

      // Generar QR con la URL de escucha
      const listenUrl = `${LISTEN_BASE_URL}?id=${currentFileId}`;
      if (qrCodeEl) {
        qrCodeEl.innerHTML = ''; // limpiar canvas previo
        new QRCode(qrCodeEl, {
          text: listenUrl,
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      }

      if (qrContainer) qrContainer.style.display = 'block';
      if (btnSave) {
        btnSave.textContent = 'Guardado ✔';
        btnSave.disabled = false;
      }
      setStatus(`Audio guardado. ID: ${currentFileId}`, 'success');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message, 'error');
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar y generar QR';
      }
    }
  };
});

// ============================================
// DESCARGAR QR
// ============================================
btnDownloadQr.addEventListener('click', () => {
  if (!qrCodeEl) return;
  const canvas = qrCodeEl.querySelector('canvas');
  if (!canvas) return;

  const nombre = document.getElementById('nombre').value.trim() || 'alumno';
  const link = document.createElement('a');
  link.download = `QR_${nombre}_${currentFileId || 'audio'}.png`;
  link.href = canvas.toDataURL();
  link.click();
});
