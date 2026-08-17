// ==========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN INICIAL
// ==========================================
let rawExcelData = [];
let filteredData = [];

// Estado global de selecciones para todos los multiselects
let filtroSelecciones = {
    actividad: [],
    zona: [],
    ciudad: [],
    ano: [],
    mes: []
};

// Instancias globales para destruir y redibujar gráficos
let estadoChartInstance = null;
let actividadChartInstance = null;
let duracionChartInstance = null;
let miniEfectividadChartInstance = null;
let miniDuracionChartInstance = null;

const ordenMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const ordenMesesCompletos = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Registrar plugin de datalabels si está presente
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

document.addEventListener("DOMContentLoaded", () => {
    const excelInput = document.getElementById("excelFile");
    if (excelInput) {
        excelInput.addEventListener("change", cargarArchivoExcel);
    }

    // Inicializar interacción de todos los multiselects
    inicializarMultiselects();

    // Botón general "Limpiar filtros"
    document.getElementById("clearFilters")?.addEventListener("click", limpiarFiltros);
    // Dentro de document.addEventListener("DOMContentLoaded", () => { ... })
    document.getElementById("applyAllFilters")?.addEventListener("click", aplicarTodosLosFiltros);
    // Desplegable de la sección de filtros
    const toggleBtn = document.getElementById('toggleFiltersBtn');
    const filtersSection = document.getElementById('filters');

    if (toggleBtn && filtersSection) {
        toggleBtn.addEventListener('click', () => {
            filtersSection.classList.toggle('is-open');
            toggleBtn.classList.toggle('active');
        });
    }
});

// ==========================================
// LÓGICA DE COMPONENTES MULTISELECT
// ==========================================

function inicializarMultiselects() {
    document.querySelectorAll('.custom-multiselect').forEach(container => {
        const trigger = container.querySelector('.multiselect-trigger');
        const menu = container.querySelector('.multiselect-menu');
        const btnTodos = container.querySelector('.btn-todos');
        const btnLimpiar = container.querySelector('.btn-limpiar');
        const btnApply = container.querySelector('.btn-apply');
        const filterKey = container.dataset.filterKey;

        // Abrir/cerrar menú
        trigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.multiselect-menu').forEach(m => {
                if (m !== menu) m.classList.add('hidden');
            });
            menu?.classList.toggle('hidden');
        });

        // Marcar todos
        btnTodos?.addEventListener('click', (e) => {
            e.stopPropagation();
            container.querySelectorAll('.multiselect-options input[type="checkbox"]').forEach(chk => chk.checked = true);
        });

        // Limpiar selección actual en menú
        btnLimpiar?.addEventListener('click', (e) => {
            e.stopPropagation();
            container.querySelectorAll('.multiselect-options input[type="checkbox"]').forEach(chk => chk.checked = false);
        });

        // Aplicar selección
        btnApply?.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedInputs = Array.from(container.querySelectorAll('.multiselect-options input[type="checkbox"]:checked'));
            filtroSelecciones[filterKey] = checkedInputs.map(chk => chk.value);
            actualizarTextoTrigger(container, filterKey);
            menu?.classList.add('hidden');
            aplicarFiltros();
        });
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-multiselect')) {
            document.querySelectorAll('.multiselect-menu').forEach(m => m.classList.add('hidden'));
        }
    });
}

function poblarMultiselect(idContainer, filterKey, items) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    const optionsContainer = container.querySelector('.multiselect-options');
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';
    filtroSelecciones[filterKey] = [];

    items.forEach(item => {
        const val = typeof item === 'object' ? item.value : item;
        const text = typeof item === 'object' ? item.text : item;

        filtroSelecciones[filterKey].push(String(val));

        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${val}" checked class="chk-${filterKey}">
            <span>${text}</span>
        `;
        optionsContainer.appendChild(label);
    });

    actualizarTextoTrigger(container, filterKey);
}

function actualizarTextoTrigger(container, filterKey) {
    const checkboxes = container.querySelectorAll('.multiselect-options input[type="checkbox"]');
    const total = checkboxes.length;
    const marcados = filtroSelecciones[filterKey].length;
    const triggerText = container.querySelector('.selected-text');

    if (!triggerText) return;

    if (marcados === total || marcados === 0) {
        triggerText.textContent = filterKey === 'mes' ? "Todos los meses" : (filterKey === 'ciudad' || filterKey === 'zona' ? "Todas" : "Todos");
    } else if (marcados === 1) {
        const checkedInput = container.querySelector('.multiselect-options input[type="checkbox"]:checked');
        triggerText.textContent = checkedInput ? checkedInput.nextElementSibling.textContent : filtroSelecciones[filterKey][0];
    } else {
        triggerText.textContent = `${marcados} seleccionados`;
    }
}

// ==========================================
// PARSER Y UTILIDADES DE FECHA Y HORA
// ==========================================

function obtenerFechaObjeto(item) {
    if (!item) return null;

    let rawFecha = item.Fecha || item.FECHA || item.Fecha_Inicio || item.Origen || item.FIN || item.Fin || item.Inicio;
    if (!rawFecha) return null;

    if (rawFecha instanceof Date) return rawFecha;

    const num = Number(rawFecha);
    if (!isNaN(num) && num > 30000 && num < 70000) {
        const dateUTC = new Date(Math.round((num - 25569) * 86400 * 1000));
        return new Date(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth(), dateUTC.getUTCDate());
    }

    if (typeof rawFecha === 'string') {
        let str = rawFecha.trim();
        const partes = str.split(/[\/\-\s]/);
        if (partes.length >= 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const anio = parseInt(partes[2], 10);

            if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
                if (partes[2].length === 4) return new Date(anio, mes, dia);
                if (partes[0].length === 4) return new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
            }
        }
    }

    const d = new Date(rawFecha);
    return isNaN(d.getTime()) ? null : d;
}

function formatearFecha(item) {
    const f = obtenerFechaObjeto(item);
    if (!f || isNaN(f.getTime())) return '-';

    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();

    return `${dia}/${mes}/${anio}`;
}

function convertirAHoraMinutos(valor) {
    if (valor === null || valor === undefined || valor === "") return null;

    if (typeof valor === 'number') {
        const totalSegundos = Math.round(valor * 86400);
        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        return horas * 60 + minutos;
    }

    if (typeof valor === 'string' || valor instanceof String) {
        const str = valor.toString().trim();
        const partes = str.split(':');
        if (partes.length >= 2) {
            const h = parseInt(partes[0], 10);
            const m = parseInt(partes[1], 10);
            if (!isNaN(h) && !isNaN(m)) {
                return h * 60 + m;
            }
        }
    }

    return null;
}

function calcularDiferenciaMinutos(horaInicioRaw, horaFinRaw) {
    const minInicio = convertirAHoraMinutos(horaInicioRaw);
    const minFin = convertirAHoraMinutos(horaFinRaw);

    if (minInicio === null || minFin === null) return null;

    let diferencia = minFin - minInicio;
    if (diferencia < 0) diferencia += 24 * 60;

    return diferencia;
}

// ==========================================
// CARGA Y PROCESAMIENTO DE EXCEL
// ==========================================

function cargarArchivoExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function (evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        rawExcelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        filteredData = [...rawExcelData];

        poblarFiltros(rawExcelData);
        mostrarSecciones();
        aplicarFiltros();
    };

    reader.readAsArrayBuffer(file);
}

function mostrarSecciones() {
    document.getElementById("filters")?.classList.remove("hidden");
    document.getElementById("kpis")?.classList.remove("hidden");
    document.getElementById("charts")?.classList.remove("hidden");
    document.getElementById("tableSection")?.classList.remove("hidden");

    const btnDescargar = document.getElementById("btnDescargar");
    if (btnDescargar) {
        btnDescargar.classList.remove("hidden");
        btnDescargar.style.display = "inline-block";
    }
}

// ==========================================
// FILTROS Y KPIS
// ==========================================

function poblarFiltros(data) {
    const anos = new Set();
    const ciudades = new Set();
    const zonas = new Set();
    const actividades = new Set();

    data.forEach(item => {
        const fechaObj = obtenerFechaObjeto(item);
        if (fechaObj) {
            const ano = fechaObj.getFullYear();
            if (!isNaN(ano)) anos.add(ano);
        }

        const act = item.Tipo_de_Activi || item.Tipo_de_Actividad;
        if (act) actividades.add(act);

        if (item.Ciudad) ciudades.add(item.Ciudad);

        const zonaVal = item.Zona_de_traba || item.Zona;
        if (zonaVal) zonas.add(zonaVal);
    });

    const anosOrdenados = Array.from(anos).sort((a, b) => b - a);
    const ciudadesOrdenadas = Array.from(ciudades).sort();
    const zonasOrdenadas = Array.from(zonas).sort();
    const actividadesOrdenadas = Array.from(actividades).sort();

    poblarMultiselect("multiselectAno", "ano", anosOrdenados);
    poblarMultiselect("multiselectActividad", "actividad", actividadesOrdenadas);
    poblarMultiselect("multiselectZona", "zona", zonasOrdenadas);
    poblarMultiselect("multiselectCiudad", "ciudad", ciudadesOrdenadas);

    const itemsMeses = ordenMeses.map((mesCorto, idx) => ({
        value: mesCorto,
        text: ordenMesesCompletos[idx]
    }));
    poblarMultiselect("multiselectMes", "mes", itemsMeses);
}

function aplicarFiltros() {
    filteredData = rawExcelData.filter(item => {
        const fechaObj = obtenerFechaObjeto(item);
        const itemAno = fechaObj ? fechaObj.getFullYear().toString() : "";
        const itemMes = fechaObj ? ordenMeses[fechaObj.getMonth()] : "";

        const itemAct = item.Tipo_de_Activi || item.Tipo_de_Actividad || "";
        const itemCiudad = item.Ciudad || "";
        const itemZona = item.Zona_de_traba || item.Zona || "";

        const totalAno = document.querySelectorAll("#multiselectAno .chk-ano").length;
        const cumpleAno = totalAno === 0 || filtroSelecciones.ano.length === 0 || filtroSelecciones.ano.includes(itemAno);

        const totalMes = document.querySelectorAll("#multiselectMes .chk-mes").length;
        const cumpleMes = totalMes === 0 || filtroSelecciones.mes.length === 0 || filtroSelecciones.mes.includes(itemMes);

        const totalAct = document.querySelectorAll("#multiselectActividad .chk-actividad").length;
        const cumpleActividad = totalAct === 0 || filtroSelecciones.actividad.length === 0 || filtroSelecciones.actividad.includes(itemAct);

        const totalCiudad = document.querySelectorAll("#multiselectCiudad .chk-ciudad").length;
        const cumpleCiudad = totalCiudad === 0 || filtroSelecciones.ciudad.length === 0 || filtroSelecciones.ciudad.includes(itemCiudad);

        const totalZona = document.querySelectorAll("#multiselectZona .chk-zona").length;
        const cumpleZona = totalZona === 0 || filtroSelecciones.zona.length === 0 || filtroSelecciones.zona.includes(itemZona);

        return cumpleAno && cumpleMes && cumpleActividad && cumpleCiudad && cumpleZona;
    });

    actualizarDashboard();
}

function limpiarFiltros() {
    document.querySelectorAll('.custom-multiselect').forEach(container => {
        const filterKey = container.dataset.filterKey;
        const checkboxes = container.querySelectorAll('.multiselect-options input[type="checkbox"]');
        checkboxes.forEach(chk => chk.checked = true);
        filtroSelecciones[filterKey] = Array.from(checkboxes).map(chk => chk.value);
        actualizarTextoTrigger(container, filterKey);
    });

    aplicarFiltros();
}

function actualizarDashboard() {
    actualizarKPIs();
    renderizarTabla();
    actualizarGraficos();
}

function actualizarKPIs() {
    const total = filteredData.length;
    let completadas = 0;
    let noRealizadas = 0;
    let duracionTotalSum = 0;
    let duracionConteo = 0;

    const agruparTecnicosKPI = {};

    filteredData.forEach(item => {
        const est = (item.Estado || "").toString().trim().toLowerCase();
        if (est === "completado") completadas++;
        if (est === "no realizada") noRealizadas++;

        const inicioRaw = item.Inicio || item.INICIO || item.Hora_Inicio;
        const finRaw = item.Fin || item.FIN || item.Hora_Fin;
        let difMin = calcularDiferenciaMinutos(inicioRaw, finRaw);

        if (est === "completado" && difMin !== null && difMin >= 0 && difMin < 720) {
            duracionTotalSum += difMin;
            duracionConteo++;
        }

        if (est === "completado") {
            const f = obtenerFechaObjeto(item);
            const tecnico = (item.Tecnico || "").toString().trim();

            if (f && tecnico) {
                const diaKey = `${f.getFullYear()}-${(f.getMonth() + 1).toString().padStart(2, '0')}-${f.getDate().toString().padStart(2, '0')}`;

                let rguRaw = item.RGU ?? item.rgu ?? 0;
                if (typeof rguRaw === 'string') {
                    rguRaw = rguRaw.replace(',', '.').trim();
                }
                const rguNum = parseFloat(rguRaw) || 0;

                if (!agruparTecnicosKPI[tecnico]) agruparTecnicosKPI[tecnico] = {};
                if (!agruparTecnicosKPI[tecnico][diaKey]) agruparTecnicosKPI[tecnico][diaKey] = 0;

                agruparTecnicosKPI[tecnico][diaKey] += rguNum;
            }
        }
    });

    const tecsKeys = Object.keys(agruparTecnicosKPI);
    let rguPromedio = 0;

    if (tecsKeys.length > 0) {
        let sumaPromediosTecnicos = 0;

        tecsKeys.forEach(tec => {
            const diasObj = agruparTecnicosKPI[tec];
            const diasKeys = Object.keys(diasObj);

            let rguTotalTecnico = 0;
            diasKeys.forEach(dia => {
                rguTotalTecnico += diasObj[dia];
            });

            const promDiarioTecnico = rguTotalTecnico / diasKeys.length;
            sumaPromediosTecnicos += promDiarioTecnico;
        });

        rguPromedio = sumaPromediosTecnicos / tecsKeys.length;
    }

    const pctCompVal = total > 0 ? ((completadas / total) * 100).toFixed(1) + "%" : "0%";
    const pctNoRealVal = total > 0 ? ((noRealizadas / total) * 100).toFixed(1) + "%" : "0%";

    const efectividadVal = (completadas + noRealizadas) > 0
        ? ((completadas / (completadas + noRealizadas)) * 100).toFixed(1) + "%"
        : "0%";

    const duracionPromedioMin = duracionConteo > 0 ? Math.round(duracionTotalSum / duracionConteo) : 0;
    const hrs = Math.floor(duracionPromedioMin / 60);
    const mins = duracionPromedioMin % 60;
    const duracionFormateada = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    if (document.getElementById("totalOrdenes")) document.getElementById("totalOrdenes").innerText = total;
    if (document.getElementById("completadas")) document.getElementById("completadas").innerText = completadas;
    if (document.getElementById("pctCompletadas")) document.getElementById("pctCompletadas").innerText = pctCompVal;
    if (document.getElementById("noRealizadas")) document.getElementById("noRealizadas").innerText = noRealizadas;
    if (document.getElementById("pctNoRealizadas")) document.getElementById("pctNoRealizadas").innerText = pctNoRealVal;
    if (document.getElementById("efectividad")) document.getElementById("efectividad").innerText = efectividadVal;

    const rguElem = document.getElementById("rguTotal");
    if (rguElem) {
        rguElem.innerText = rguPromedio.toFixed(1).replace('.', ',');
    }

    const durElem = document.getElementById("duracionPromedio");
    if (durElem) {
        durElem.innerText = duracionFormateada;
    }

    renderizarMiniGraficoEfectividad(completadas, noRealizadas);
    renderizarMiniGraficoDuracion();
}

// ==========================================
// RENDERIZADO DE TABLA DE DETALLE
// ==========================================

function formatearHoraRedondeada(valor) {
    if (valor === null || valor === undefined || valor === "") return '-';

    if (typeof valor === 'number') {
        const totalMinutos = Math.round(valor * 24 * 60);
        const hrs = String(Math.floor(totalMinutos / 60) % 24).padStart(2, '0');
        const mins = String(totalMinutos % 60).padStart(2, '0');
        return `${hrs}:${mins}`;
    }

    if (typeof valor === 'string') {
        const str = valor.trim();
        const partes = str.split(':');
        if (partes.length >= 2) {
            let h = parseInt(partes[0].slice(-2), 10);
            let m = parseInt(partes[1], 10);
            let s = partes[2] ? parseInt(partes[2], 10) : 0;

            if (s >= 30) m++;
            if (m >= 60) {
                m = 0;
                h = (h + 1) % 24;
            }

            if (!isNaN(h) && !isNaN(m)) {
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        }
    }

    return valor;
}

function renderizarTabla() {
    const tbody = document.getElementById("dataTable");
    if (!tbody) return;
    tbody.innerHTML = "";

    const limiteData = filteredData.slice(0, 100);

    limiteData.forEach(item => {
        let tecnico = (item.Tecnico || '-').toString().trim();

        const inicioRaw = item.Inicio || item.INICIO || item.Hora_Inicio;
        const finRaw = item.Fin || item.FIN || item.Hora_Fin;

        const inicioFormateado = formatearHoraRedondeada(inicioRaw);
        const finFormateado = formatearHoraRedondeada(finRaw);
        const fechaFormateada = formatearFecha(item);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${tecnico}</td>
            <td>${item.rut || item.Rut_o_Bucket || '-'}</td>
            <td>${item.Tipo_de_Activi || item.Tipo_de_Actividad || '-'}</td>
            <td>${item.orden || item.Orden_de_Trabajo || '-'}</td>
            <td>${item.Ciudad || '-'}</td>
            <td>${item.Zona_de_traba || item.Zona_de_trabajo || '-'}</td>
            <td>${inicioFormateado}</td>
            <td>${finFormateado}</td>
            <td>${item.Estado || '-'}</td>
            <td>${fechaFormateada}</td>
            <td>${item.RGU || '0'}</td>
        `;
        tbody.appendChild(tr);
    });

    if (document.getElementById("rowCount")) {
        document.getElementById("rowCount").innerText = `Mostrando ${limiteData.length} de ${filteredData.length} registros`;
    }
}

// ==========================================
// RENDERIZADO DE LOS GRÁFICOS
// ==========================================

function actualizarGraficos() {
    crearGraficoProduccion();
    crearGraficoRGU();
    crearGraficoDuracion();
}

function crearGraficoProduccion() {
    const agrupar = {};
    ordenMeses.forEach(m => agrupar[m] = { completados: 0, noRealizadas: 0 });

    filteredData.forEach(item => {
        const f = obtenerFechaObjeto(item);
        if (!f) return;
        const mNom = ordenMeses[f.getMonth()];
        const est = (item.Estado || "").toString().trim().toLowerCase();
        if (est === "completado") agrupar[mNom].completados++;
        if (est === "no realizada") agrupar[mNom].noRealizadas++;
    });

    const porcentajes = ordenMeses.map(m => {
        const tot = agrupar[m].completados + agrupar[m].noRealizadas;
        return tot > 0 ? Number(((agrupar[m].completados / tot) * 100).toFixed(1)) : null;
    });

    const canvas = document.getElementById("estadoChart");
    if (!canvas) return;
    if (estadoChartInstance) estadoChartInstance.destroy();

    estadoChartInstance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: ordenMeses,
            datasets: [{
                label: "% Efectividad",
                data: porcentajes,
                borderColor: "#1d2a57",
                backgroundColor: "#1d2a57",
                borderWidth: 2.5,
                tension: 0.2,
                spanGaps: true,
                pointRadius: 4,
                pointBackgroundColor: "#1d2a57",
                pointBorderColor: "#1d2a57",
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                datalabels: {
                    anchor: context => (context.dataIndex % 2 === 0 ? 'top' : 'bottom'),
                    align: context => (context.dataIndex % 2 === 0 ? 'end' : 'start'),
                    offset: 6,
                    color: '#1d2a57',
                    font: {
                        size: 11,
                        weight: 'bold',
                        family: 'Segoe UI, sans-serif'
                    },
                    formatter: v => v !== null ? v.toString().replace('.', ',') + '%' : ''
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            layout: {
                padding: { top: 25, bottom: 5, left: 10, right: 10 }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: '#1e293b',
                        padding: 8,
                        font: { size: 12, weight: '600', family: 'Segoe UI, sans-serif' }
                    }
                },
                y: { display: false, beginAtZero: true, grace: '20%' }
            }
        }
    });
}

function crearGraficoRGU() {
    const agrupar = {};
    ordenMeses.forEach(m => agrupar[m] = {});

    filteredData.forEach(item => {
        const f = obtenerFechaObjeto(item);
        if (!f) return;

        const est = (item.Estado || "").toString().trim().toLowerCase();
        if (est !== "completado") return;

        const mNom = ordenMeses[f.getMonth()];
        const diaKey = `${f.getFullYear()}-${(f.getMonth() + 1).toString().padStart(2, '0')}-${f.getDate().toString().padStart(2, '0')}`;
        const tecnico = (item.Tecnico || "").toString().trim();

        if (!tecnico) return;

        let rguRaw = item.RGU ?? item.rgu ?? 0;
        if (typeof rguRaw === 'string') rguRaw = rguRaw.replace(',', '.').trim();
        const rguNum = Number(rguRaw) || 0;

        if (!agrupar[mNom][tecnico]) agrupar[mNom][tecnico] = {};
        if (!agrupar[mNom][tecnico][diaKey]) agrupar[mNom][tecnico][diaKey] = 0;

        agrupar[mNom][tecnico][diaKey] += rguNum;
    });

    const promedios = ordenMeses.map(m => {
        const tecsObj = agrupar[m];
        const tecsKeys = Object.keys(tecsObj);

        if (tecsKeys.length === 0) return null;

        let sumaPromediosTecnicos = 0;

        tecsKeys.forEach(tec => {
            const diasObj = tecsObj[tec];
            const diasKeys = Object.keys(diasObj);

            let rguTotalTecnico = 0;
            diasKeys.forEach(dia => {
                rguTotalTecnico += diasObj[dia];
            });

            const promDiarioTecnico = rguTotalTecnico / diasKeys.length;
            sumaPromediosTecnicos += promDiarioTecnico;
        });

        return Number((sumaPromediosTecnicos / tecsKeys.length).toFixed(1));
    });

    const VALOR_META = 3.0;
    const metaArray = ordenMeses.map(() => VALOR_META);

    const canvas = document.getElementById("actividadChart");
    if (!canvas) return;
    if (actividadChartInstance) actividadChartInstance.destroy();

    actividadChartInstance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: ordenMeses,
            datasets: [
                {
                    label: 'Promedio General',
                    data: promedios,
                    borderColor: "#172554",
                    backgroundColor: "#172554",
                    borderWidth: 2,
                    tension: 0,
                    spanGaps: true,
                    pointRadius: 3,
                    clip: false,
                    datalabels: {
                        anchor: 'start',
                        align: 'bottom',
                        offset: 4,
                        color: '#172554',
                        font: { weight: 'bold', size: 11, family: 'Segoe UI, sans-serif' },
                        formatter: v => v !== null ? v.toString().replace('.', ',') : ''
                    }
                },
                {
                    label: 'Meta',
                    data: metaArray,
                    borderColor: "#facc15",
                    backgroundColor: "#facc15",
                    borderWidth: 1.5,
                    tension: 0,
                    spanGaps: true,
                    pointRadius: 2.5,
                    clip: false,
                    datalabels: { display: false }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            layout: { padding: { top: 25, bottom: 5, left: 10, right: 10 } },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: '#1e293b',
                        padding: 8,
                        font: { size: 12, weight: '600', family: 'Segoe UI, sans-serif' }
                    }
                },
                y: { display: false, beginAtZero: true, grace: '20%' }
            }
        }
    });
}

function crearGraficoDuracion() {
    const agrupar = {};
    ordenMeses.forEach(m => agrupar[m] = { sumaMinutos: 0, conteo: 0 });

    filteredData.forEach(item => {
        const f = obtenerFechaObjeto(item);
        if (!f) return;
        const mNom = ordenMeses[f.getMonth()];

        const inicioRaw = item.Inicio || item.INICIO || item.Hora_Inicio;
        const finRaw = item.Fin || item.FIN || item.Hora_Fin;

        let difMin = calcularDiferenciaMinutos(inicioRaw, finRaw);
        if (difMin === null || difMin < 0) difMin = 0;

        const est = (item.Estado || "").toString().trim().toLowerCase();

        if (agrupar[mNom] && est === "completado" && difMin < 720) {
            agrupar[mNom].sumaMinutos += difMin;
            agrupar[mNom].conteo++;
        }
    });

    const promediosMin = ordenMeses.map(m => {
        return agrupar[m].conteo > 0 ? Math.round(agrupar[m].sumaMinutos / agrupar[m].conteo) : null;
    });

    const canvas = document.getElementById("duracionChart");
    if (!canvas) return;

    if (duracionChartInstance) duracionChartInstance.destroy();

    duracionChartInstance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: ordenMeses,
            datasets: [{
                label: "Minutos Promedio",
                data: promediosMin,
                borderColor: "#1d2a57",
                backgroundColor: "#1d2a57",
                borderWidth: 2.5,
                tension: 0,
                spanGaps: true,
                pointRadius: 3,
                clip: false,
                datalabels: {
                    anchor: context => (context.dataIndex % 2 === 0 ? 'top' : 'bottom'),
                    align: context => (context.dataIndex % 2 === 0 ? 'end' : 'start'),
                    offset: 4,
                    color: '#172554',
                    font: { weight: 'bold', size: 10, family: 'Segoe UI, sans-serif' },
                    formatter: function (value) {
                        if (value === null || value === undefined) return '';
                        const hrs = Math.floor(value / 60);
                        const mins = Math.round(value % 60);
                        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 25, bottom: 5, left: 10, right: 10 }
            },
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: '#1e293b',
                        padding: 8,
                        font: { size: 12, weight: '600', family: 'Segoe UI, sans-serif' }
                    }
                },
                y: { display: false, beginAtZero: true, max: 160 }
            }
        }
    });
}

function renderizarMiniGraficoEfectividad(completadas, noRealizadas) {
    const canvas = document.getElementById("efectividadMiniChart");
    if (!canvas) return;

    if (miniEfectividadChartInstance) {
        miniEfectividadChartInstance.destroy();
    }

    miniEfectividadChartInstance = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Completadas", "No Realizadas"],
            datasets: [{
                data: [completadas, noRealizadas],
                backgroundColor: ["#1d2a57", "#ef4444"],
                borderWidth: 0,
                hoverOffset: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
                datalabels: { display: false }
            }
        }
    });
}

function renderizarMiniGraficoDuracion() {
    const agrupar = {};
    ordenMeses.forEach(m => agrupar[m] = { sumaMinutos: 0, conteo: 0 });

    filteredData.forEach(item => {
        const f = obtenerFechaObjeto(item);
        if (!f) return;
        const mNom = ordenMeses[f.getMonth()];
        const inicioRaw = item.Inicio || item.INICIO || item.Hora_Inicio;
        const finRaw = item.Fin || item.FIN || item.Hora_Fin;
        let difMin = calcularDiferenciaMinutos(inicioRaw, finRaw);
        const est = (item.Estado || "").toString().trim().toLowerCase();

        if (agrupar[mNom] && est === "completado" && difMin !== null && difMin >= 0 && difMin < 720) {
            agrupar[mNom].sumaMinutos += difMin;
            agrupar[mNom].conteo++;
        }
    });

    const dataMensual = ordenMeses.map(m => agrupar[m].conteo > 0 ? Math.round(agrupar[m].sumaMinutos / agrupar[m].conteo) : 0);

    const canvas = document.getElementById("duracionMiniChart");
    if (!canvas) return;

    if (miniDuracionChartInstance) {
        miniDuracionChartInstance.destroy();
    }

    miniDuracionChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ordenMeses,
            datasets: [{
                data: dataMensual,
                backgroundColor: "#1d2a57",
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
                datalabels: { display: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

async function descargarDashboard() {
    const contenedor = document.getElementById("dashboardCapture");

    if (!contenedor) {
        alert("No se encontró el contenedor del dashboard para capturar.");
        return;
    }

    try {
        const canvas = await html2canvas(contenedor, {
            scale: 2,
            backgroundColor: "#f8fafc",
            useCORS: true,
            logging: false
        });

        const link = document.createElement("a");
        link.download = `Dashboard_RGU_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (error) {
        console.error("Error al exportar la imagen:", error);
    }
}

function aplicarTodosLosFiltros() {
    // 1. Recorrer cada desplegable y sincronizar las casillas marcadas con el estado global
    document.querySelectorAll('.custom-multiselect').forEach(container => {
        const filterKey = container.dataset.filterKey;
        const checkedInputs = Array.from(container.querySelectorAll('.multiselect-options input[type="checkbox"]:checked'));
        
        filtroSelecciones[filterKey] = checkedInputs.map(chk => chk.value);
        actualizarTextoTrigger(container, filterKey);
    });

    // 2. Cerrar cualquier menú flotante abierto
    document.querySelectorAll('.multiselect-menu').forEach(m => m.classList.add('hidden'));

    // 3. Ejecutar el filtrado global de datos y actualizar KPIs/Gráficos
    aplicarFiltros();
}