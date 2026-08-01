document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. CONFIGURACIÓN
  // =========================================================================
  const TARIFA_HORA = 21.60; // 21,60 € por hora

  // CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
  // IMPORTANTE: Reemplaza estos datos por los tuyos reales.
  const GITHUB_USUARIO = 'TU_USUARIO_GITHUB';
  const GITHUB_REPO = 'NOMBRE_DE_TU_REPOSITORIO';
  const GITHUB_TOKEN = 'ghp_TU_TOKEN_PERSONAL_AQUI'; // Token generado en GitHub

  // Elementos del DOM
  const gridAnual = document.getElementById('grid-anual');
  const tituloAno = document.getElementById('titulo-ano');
  const totalHorasAnoEl = document.getElementById('total-horas-ano');
  const totalDineroAnoEl = document.getElementById('total-dinero-ano');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  let anoActual = new Date().getFullYear();

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // =========================================================================
  // 2. FUNCIONES DE ALMACENAMIENTO Y API DE GITHUB
  // =========================================================================
  function obtenerRegistrosAno(ano) {
    return JSON.parse(localStorage.getItem(`horas_${ano}`)) || {};
  }

  function guardarRegistrosAnoLocal(ano, datos) {
    localStorage.setItem(`horas_${ano}`, JSON.stringify(datos));
  }

  // Función para subir directamente el archivo JSON del mes a GitHub
  async function subirMesAGitHub(ano, mes, datosMes) {
    // Si no has configurado tu token, evitamos hacer la petición
    if (GITHUB_TOKEN === 'ghp_TU_TOKEN_PERSONAL_AQUI' || !GITHUB_TOKEN) {
      console.warn('Sincronización con GitHub omitida: Token no configurado.');
      return;
    }

    const nombreMes = nombresMeses[mes];
    const numMesFormateado = String(mes + 1).padStart(2, '0');
    const rutaArchivo = `registros/${ano}/${numMesFormateado}_${nombreMes}.json`;
    const url = `https://api.github.com/repos/${GITHUB_USUARIO}/${GITHUB_REPO}/contents/${rutaArchivo}`;

    // Convertir datos a cadena JSON y luego a Base64 (requerido por GitHub API)
    const contenidoJSON = JSON.stringify(datosMes, null, 2);
    const contenidoBase64 = btoa(unescape(encodeURIComponent(contenidoJSON)));

    try {
      // 1. Consultar si el archivo ya existe para obtener su 'sha'
      let sha = null;
      const resConsulta = await fetch(url, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      });

      if (resConsulta.status === 200) {
        const archivoExiste = await resConsulta.json();
        sha = archivoExiste.sha;
      }

      // 2. Guardar o actualizar el archivo en la nube
      const resSubida = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Actualización de horas: ${nombreMes} ${ano}`,
          content: contenidoBase64,
          sha: sha || undefined
        })
      });

      if (resSubida.ok) {
        console.log(`✅ ¡Datos de ${nombreMes} ${ano} guardados con éxito en GitHub!`);
      } else {
        const errorData = await resSubida.json();
        console.error('❌ Error al subir a GitHub:', errorData);
      }
    } catch (error) {
      console.error('❌ Error de conexión al intentar sincronizar con GitHub:', error);
    }
  }

  // =========================================================================
  // 3. FUNCIONES DE FORMATO Y CÁLCULOS
  // =========================================================================
  function formatearEuros(cantidad) {
    return cantidad.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  function calcularTotalAno(registros) {
    let totalHoras = 0;
    Object.values(registros).forEach(mes => {
      Object.values(mes).forEach(horas => {
        totalHoras += Number(horas);
      });
    });

    const totalDinero = totalHoras * TARIFA_HORA;
    totalHorasAnoEl.innerText = `${totalHoras.toFixed(2).replace('.', ',')} hrs`;
    totalDineroAnoEl.innerText = formatearEuros(totalDinero);
  }

  // =========================================================================
  // 4. RENDERIZADO DEL CALENDARIO
  // =========================================================================
  function renderizarAno() {
    tituloAno.innerText = anoActual;
    gridAnual.innerHTML = '';
    const registrosAno = obtenerRegistrosAno(anoActual);

    // Bucle para construir los 12 meses
    for (let mes = 0; mes < 12; mes++) {
      const mesCard = document.createElement('div');
      mesCard.classList.add('mes-card');

      const registrosMes = registrosAno[mes] || {};
      const totalHorasMes = Object.values(registrosMes).reduce((acc, curr) => acc + Number(curr), 0);
      const totalDineroMes = totalHorasMes * TARIFA_HORA;

      // Encabezado del mes
      const mesHeader = document.createElement('div');
      mesHeader.classList.add('mes-header');

      const tituloMes = document.createElement('span');
      tituloMes.classList.add('mes-titulo');
      tituloMes.innerText = nombresMeses[mes];

      const badgesContainer = document.createElement('div');
      badgesContainer.classList.add('mes-badges');

      const badgeHoras = document.createElement('span');
      badgeHoras.classList.add('mes-total-badge');
      badgeHoras.innerText = `${totalHorasMes.toFixed(1).replace('.', ',')} hrs`;

      const badgeDinero = document.createElement('span');
      badgeDinero.classList.add('mes-total-badge', 'dinero-badge');
      badgeDinero.innerText = formatearEuros(totalDineroMes);

      badgesContainer.appendChild(badgeHoras);
      badgesContainer.appendChild(badgeDinero);

      mesHeader.appendChild(tituloMes);
      mesHeader.appendChild(badgesContainer);
      mesCard.appendChild(mesHeader);

      // Cabecera de días de la semana
      const diasSemana = document.createElement('div');
      diasSemana.classList.add('dias-semana');
      ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(dia => {
        const d = document.createElement('div');
        d.innerText = dia;
        diasSemana.appendChild(d);
      });
      mesCard.appendChild(diasSemana);

      // Celdas del calendario
      const mesGrid = document.createElement('div');
      mesGrid.classList.add('mes-grid');

      const primerDia = new Date(anoActual, mes, 1).getDay();
      const totalDias = new Date(anoActual, mes + 1, 0).getDate();
      const inicioOffset = (primerDia === 0 ? 6 : primerDia - 1);

      // Espacios vacíos de inicio de mes
      for (let i = 0; i < inicioOffset; i++) {
        const vacio = document.createElement('div');
        vacio.classList.add('dia-box', 'dia-vacio');
        mesGrid.appendChild(vacio);
      }

      // Días del mes
      for (let dia = 1; dia <= totalDias; dia++) {
        const diaBox = document.createElement('div');
        diaBox.classList.add('dia-box');

        const numSpan = document.createElement('span');
        numSpan.classList.add('dia-numero');
        numSpan.innerText = dia;
        diaBox.appendChild(numSpan);

        const horasGuardadas = registrosMes[dia];
        if (horasGuardadas !== undefined) {
          const horasSpan = document.createElement('span');
          horasSpan.classList.add('dia-horas');
          horasSpan.innerText = `${String(horasGuardadas).replace('.', ',')}h`;
          diaBox.appendChild(horasSpan);
        }

        // Clic para agregar/modificar horas
        diaBox.addEventListener('click', () => {
          let entrada = prompt(
            `${dia} de ${nombresMeses[mes]} de ${anoActual}\nHoras trabajadas (Ej: 2.5 o 2,5):`, 
            horasGuardadas !== undefined ? String(horasGuardadas).replace('.', ',') : ''
          );

          if (entrada !== null) {
            // Reemplazar coma por punto para trabajar decimales en JS
            entrada = entrada.replace(',', '.').trim();

            if (!registrosAno[mes]) registrosAno[mes] = {};

            if (entrada === '') {
              delete registrosAno[mes][dia];
            } else {
              const numHoras = parseFloat(entrada);
              if (!isNaN(numHoras) && numHoras >= 0) {
                registrosAno[mes][dia] = numHoras;
              } else {
                alert('Por favor, introduce un número de horas válido.');
                return;
              }
            }

            // 1. Guardar copia local en el navegador
            guardarRegistrosAnoLocal(anoActual, registrosAno);

            // 2. Renderizar interfaz inmediatamente
            renderizarAno();

            // 3. Subir automáticamente el archivo del mes a GitHub
            subirMesAGitHub(anoActual, mes, registrosAno[mes]);
          }
        });

        mesGrid.appendChild(diaBox);
      }

      mesCard.appendChild(mesGrid);
      gridAnual.appendChild(mesCard);
    }

    calcularTotalAno(registrosAno);
  }

  // =========================================================================
  // 5. NAVEGACIÓN Y EVENTOS
  // =========================================================================
  btnPrev.addEventListener('click', () => {
    anoActual--;
    renderizarAno();
  });

  btnNext.addEventListener('click', () => {
    anoActual++;
    renderizarAno();
  });

  // Inicializar al cargar la página
  renderizarAno();
});