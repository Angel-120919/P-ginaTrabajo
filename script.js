document.addEventListener('DOMContentLoaded', () => {
  const TARIFA_HORA = 21.60;

  const gridAnual = document.getElementById('grid-anual');
  const tituloAno = document.getElementById('titulo-ano');
  const totalHorasAnoEl = document.getElementById('total-horas-ano');
  const totalDineroAnoEl = document.getElementById('total-dinero-ano');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnExportar = document.getElementById('btn-exportar');
  const inputImportar = document.getElementById('input-importar');

  let anoActual = new Date().getFullYear();

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  function obtenerRegistrosAno(ano) {
    return JSON.parse(localStorage.getItem(`horas_${ano}`)) || {};
  }

  function guardarRegistrosAno(ano, datos) {
    localStorage.setItem(`horas_${ano}`, JSON.stringify(datos));
  }

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

  function renderizarAno() {
    tituloAno.innerText = anoActual;
    gridAnual.innerHTML = '';
    const registrosAno = obtenerRegistrosAno(anoActual);

    for (let mes = 0; mes < 12; mes++) {
      const mesCard = document.createElement('div');
      mesCard.classList.add('mes-card');

      const registrosMes = registrosAno[mes] || {};
      const totalHorasMes = Object.values(registrosMes).reduce((acc, curr) => acc + Number(curr), 0);
      const totalDineroMes = totalHorasMes * TARIFA_HORA;

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

      const diasSemana = document.createElement('div');
      diasSemana.classList.add('dias-semana');
      ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(dia => {
        const d = document.createElement('div');
        d.innerText = dia;
        diasSemana.appendChild(d);
      });
      mesCard.appendChild(diasSemana);

      const mesGrid = document.createElement('div');
      mesGrid.classList.add('mes-grid');

      const primerDia = new Date(anoActual, mes, 1).getDay();
      const totalDias = new Date(anoActual, mes + 1, 0).getDate();
      const inicioOffset = (primerDia === 0 ? 6 : primerDia - 1);

      for (let i = 0; i < inicioOffset; i++) {
        const vacio = document.createElement('div');
        vacio.classList.add('dia-box', 'dia-vacio');
        mesGrid.appendChild(vacio);
      }

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
          // Formatear coma para la vista
          horasSpan.innerText = `${String(horasGuardadas).replace('.', ',')}h`;
          diaBox.appendChild(horasSpan);
        }

        diaBox.addEventListener('click', () => {
          let entrada = prompt(
            `${dia} de ${nombresMeses[mes]} de ${anoActual}\nHoras trabajadas (Ej: 2.5 o 2,5):`, 
            horasGuardadas !== undefined ? String(horasGuardadas).replace('.', ',') : ''
          );

          if (entrada !== null) {
            // Reemplazar coma por punto para poder convertir a número float
            entrada = entrada.replace(',', '.').trim();

            if (entrada === '') {
              delete registrosAno[mes][dia];
            } else {
              const numHoras = parseFloat(entrada);
              if (!isNaN(numHoras) && numHoras >= 0) {
                if (!registrosAno[mes]) registrosAno[mes] = {};
                registrosAno[mes][dia] = numHoras;
              } else {
                alert('Por favor introduce un número válido.');
                return;
              }
            }

            guardarRegistrosAno(anoActual, registrosAno);
            renderizarAno();
          }
        });

        mesGrid.appendChild(diaBox);
      }

      mesCard.appendChild(mesGrid);
      gridAnual.appendChild(mesCard);
    }

    calcularTotalAno(registrosAno);
  }

  // --- NAVEGACIÓN DE AÑOS ---
  btnPrev.addEventListener('click', () => {
    anoActual--;
    renderizarAno();
  });

  btnNext.addEventListener('click', () => {
    anoActual++;
    renderizarAno();
  });

  // --- EXPORTAR BASE DE DATOS (JSON) ---
  btnExportar.addEventListener('click', () => {
    const todoElAlmacen = {};
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave.startsWith('horas_')) {
        todoElAlmacen[clave] = JSON.parse(localStorage.getItem(clave));
      }
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(todoElAlmacen, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_horas_${anoActual}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // --- IMPORTAR BASE DE DATOS (JSON) ---
  inputImportar.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const datosCargados = JSON.parse(event.target.result);
        Object.keys(datosCargados).forEach(clave => {
          localStorage.setItem(clave, JSON.stringify(datosCargados[clave]));
        });
        alert('¡Base de datos cargada e importada correctamente!');
        renderizarAno();
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  });

  renderizarAno();
});