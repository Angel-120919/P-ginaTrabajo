document.addEventListener('DOMContentLoaded', () => {
  const TARIFA_HORA = 21.60; // 21,60 € la hora

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

  function obtenerRegistrosAno(ano) {
    return JSON.parse(localStorage.getItem(`horas_${ano}`)) || {};
  }

  function guardarRegistrosAno(ano, datos) {
    localStorage.setItem(`horas_${ano}`, JSON.stringify(datos));
  }

  // Función para formatear cantidades monetarias en formato de España (ej: 1.250,40 €)
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
    totalHorasAnoEl.innerText = `${totalHoras} hrs`;
    totalDineroAnoEl.innerText = formatearEuros(totalDinero);
  }

  function renderizarAno() {
    tituloAno.innerText = anoActual;
    gridAnual.innerHTML = '';
    const registrosAno = obtenerRegistrosAno(anoActual);

    // Iterar por los 12 meses
    for (let mes = 0; mes < 12; mes++) {
      const mesCard = document.createElement('div');
      mesCard.classList.add('mes-card');

      // Horas e ingresos del mes actual
      const registrosMes = registrosAno[mes] || {};
      const totalHorasMes = Object.values(registrosMes).reduce((acc, curr) => acc + Number(curr), 0);
      const totalDineroMes = totalHorasMes * TARIFA_HORA;

      // Cabecera del mes
      const mesHeader = document.createElement('div');
      mesHeader.classList.add('mes-header');

      const tituloMes = document.createElement('span');
      tituloMes.classList.add('mes-titulo');
      tituloMes.innerText = nombresMeses[mes];

      const badgesContainer = document.createElement('div');
      badgesContainer.classList.add('mes-badges');

      const badgeHoras = document.createElement('span');
      badgeHoras.classList.add('mes-total-badge');
      badgeHoras.innerText = `${totalHorasMes} hrs`;

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

      // Grid de días
      const mesGrid = document.createElement('div');
      mesGrid.classList.add('mes-grid');

      const primerDia = new Date(anoActual, mes, 1).getDay();
      const totalDias = new Date(anoActual, mes + 1, 0).getDate();
      const inicioOffset = (primerDia === 0 ? 6 : primerDia - 1);

      // Celdas vacías al inicio del mes
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
          horasSpan.innerText = `${horasGuardadas}h`;
          diaBox.appendChild(horasSpan);
        }

        // Evento al hacer clic en un día
        diaBox.addEventListener('click', () => {
          const horasIngresadas = prompt(
            `${dia} de ${nombresMeses[mes]} de ${anoActual}\nHoras trabajadas:`, 
            horasGuardadas || ''
          );

          if (horasIngresadas !== null) {
            const numHoras = parseFloat(horasIngresadas);

            if (!registrosAno[mes]) registrosAno[mes] = {};

            if (!isNaN(numHoras) && numHoras >= 0) {
              registrosAno[mes][dia] = numHoras;
            } else if (horasIngresadas.trim() === '') {
              delete registrosAno[mes][dia];
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

  btnPrev.addEventListener('click', () => {
    anoActual--;
    renderizarAno();
  });

  btnNext.addEventListener('click', () => {
    anoActual++;
    renderizarAno();
  });

  renderizarAno();
});