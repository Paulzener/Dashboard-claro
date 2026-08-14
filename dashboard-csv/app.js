// ==========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN INICIAL
// ==========================================
let rawExcelData = [];
let filteredData = [];

// Instancias globales para destruir y redibujar gráficos
let estadoChartInstance = null;
let actividadChartInstance = null;
let duracionChartInstance = null;
let miniEfectividadChartInstance = null; // <-- RECUPERADO

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

    // Eventos para filtros
    document.getElementById("filterAno")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filterEstado")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filterZona")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filterActividad")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filterCiudad")?.addEventListener("change", aplicarFiltros);
    document.getElementById("filterMes")?.addEventListener("change", aplicarFiltros);
    document.getElementById("clearFilters")?.addEventListener("click", limpiarFiltros);
});

// ==========================================
// PARSER Y UTILIDADES DE FECHA Y HORA
// ==========================================

function obtenerFechaObjeto(item) {
    if (!item) return null;

    let rawFecha = item.Origen || item.Fecha || item.FIN || item.Fin || item.Inicio;
    if (!rawFecha) return null;

    if (rawFecha instanceof Date) return rawFecha;

    if (typeof rawFecha === 'number') {
        return new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
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
}

// ==========================================
// FILTROS Y KPIS
// ==========================================

function poblarFiltros(data) {
    const anos = new Set();
    const estados = new Set();
    const actividades = new Set();
    const ciudades = new Set();
    const zonas = new Set();

    data.forEach(item => {
        const fechaObj = obtenerFechaObjeto(item);
        if (fechaObj) {
            const ano = fechaObj.getFullYear();
            if (!isNaN(ano)) anos.add(ano);
        }

        if (item.Estado) estados.add(item.Estado);
        if (item.Tipo_de_Activi || item.Tipo_de_Actividad) actividades.add(item.Tipo_de_Activi || item.Tipo_de_Actividad);
        if (item.Ciudad) ciudades.add(item.Ciudad);
        const zonaVal = item.Zona_de_traba || item.Zona;
        if (zonaVal) zonas.add(zonaVal);
    });

    const anosOrdenados = Array.from(anos).sort((a, b) => b - a);

    llenarSelect("filterAno", anosOrdenados);
    llenarSelect("filterEstado", estados);
    llenarSelect("filterActividad", actividades);
    llenarSelect("filterCiudad", ciudades);
    llenarSelect("filterZona", zonas);
    llenarSelect("filterMes", ordenMeses);

    const selectAno = document.getElementById("filterAno");
    if (selectAno && anosOrdenados.length > 0) {
        selectAno.value = anosOrdenados[0];
    }
}

function llenarSelect(id, setValores) {
    const select = document.getElementById(id);
    if (!select) return;

    const optionDefault = select.options[0] ? select.options[0].cloneNode(true) : document.createElement("option");
    if (!select.options[0]) {
        optionDefault.value = "";
        optionDefault.textContent = "Todos";
    }

    select.innerHTML = "";
    select.appendChild(optionDefault);

    Array.from(setValores).forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
}

function aplicarFiltros() {
    const anoSel = document.getElementById("filterAno")?.value || "";
    const mesSel = document.getElementById("filterMes")?.value || "";
    const estadoSel = document.getElementById("filterEstado")?.value || "";
    const actividadSel = document.getElementById("filterActividad")?.value || "";
    const ciudadSel = document.getElementById("filterCiudad")?.value || "";
    const zonaSel = document.getElementById("filterZona")?.value || "";

    filteredData = rawExcelData.filter(item => {
        const fechaObj = obtenerFechaObjeto(item);
        const itemAno = fechaObj ? fechaObj.getFullYear().toString() : "";
        const itemMes = fechaObj ? ordenMeses[fechaObj.getMonth()] : "";

        const cumpleAno = anoSel === "" || itemAno === anoSel;
        const cumpleMes = mesSel === "" || itemMes === mesSel;
        const cumpleEstado = estadoSel === "" || item.Estado === estadoSel;

        const act = item.Tipo_de_Activi || item.Tipo_de_Actividad;
        const cumpleActividad = actividadSel === "" || act === actividadSel;

        const cumpleCiudad = ciudadSel === "" || item.Ciudad === ciudadSel;

        const itemZona = item.Zona_de_traba || item.Zona || "";
        const cumpleZona = zonaSel === "" || itemZona === zonaSel;

        return cumpleAno && cumpleMes && cumpleEstado && cumpleActividad && cumpleCiudad && cumpleZona;
    });

    actualizarDashboard();
}

function limpiarFiltros() {
    if (document.getElementById("filterAno")) document.getElementById("filterAno").value = "";
    if (document.getElementById("filterEstado")) document.getElementById("filterEstado").value = "";
    if (document.getElementById("filterActividad")) document.getElementById("filterActividad").value = "";
    if (document.getElementById("filterCiudad")) document.getElementById("filterCiudad").value = "";
    if (document.getElementById("filterMes")) document.getElementById("filterMes").value = "";
    if (document.getElementById("filterZona")) document.getElementById("filterZona").value = "";

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
    let rguTotalSum = 0;

    filteredData.forEach(item => {
        const est = (item.Estado || "").toString().trim().toLowerCase();
        if (est === "completado") completadas++;
        if (est === "no realizada") noRealizadas++;

        let rguRaw = item.RGU ?? item.rgu ?? 0;
        if (typeof rguRaw === 'string') {
            rguRaw = rguRaw.replace(',', '.').trim();
        }

        const rguNum = parseFloat(rguRaw);
        if (!isNaN(rguNum)) {
            rguTotalSum += rguNum;
        }
    });

    const efectividadVal = (completadas + noRealizadas) > 0
        ? ((completadas / (completadas + noRealizadas)) * 100).toFixed(1) + "%"
        : "0%";

    const rguPromedio = completadas > 0 ? (rguTotalSum / completadas) : 0;

    if (document.getElementById("totalOrdenes")) document.getElementById("totalOrdenes").innerText = total;
    if (document.getElementById("completadas")) document.getElementById("completadas").innerText = completadas;
    if (document.getElementById("noRealizadas")) document.getElementById("noRealizadas").innerText = noRealizadas;
    if (document.getElementById("efectividad")) document.getElementById("efectividad").innerText = efectividadVal;

    const rguElem = document.getElementById("rguTotal");
    if (rguElem) {
        rguElem.innerText = rguPromedio.toFixed(1).replace('.', ',');
    }

    // <-- DIBUJAR MINI GRÁFICO DE KPI
    renderizarMiniGraficoEfectividad(completadas, noRealizadas);
}

// ==========================================
// RENDERIZADO DE TABLA DE DETALLE
// ==========================================

function renderizarTabla() {
    const tbody = document.getElementById("dataTable");
    if (!tbody) return;
    tbody.innerHTML = "";

    const limiteData = filteredData.slice(0, 100);

    limiteData.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.Orden_de_Tra || item.Nro_Orden || '-'}</td>
            <td>${item.Tecnico || '-'}</td>
            <td>${item.Tipo_de_Activi || item.Tipo_de_Actividad || '-'}</td>
            <td>${item.Ciudad || '-'}</td>
            <td>${item.Zona_de_traba || item.Zona || '-'}</td>
            <td>${item.Inicio || '-'}</td>
            <td>${item.Fin || item.FIN || '-'}</td>
            <td>${item.Estado || '-'}</td>
            <td>${item.Tipo_Red || '-'}</td>
            <td>${item.RGU || '0'}</td>
        `;
        tbody.appendChild(tr);
    });

    if (document.getElementById("rowCount")) {
        document.getElementById("rowCount").innerText = `Mostrando ${limiteData.length} de ${filteredData.length} registros`;
    }
}

// ==========================================
// RENDERIZADO DE LOS 3 GRÁFICOS
// ==========================================

function actualizarGraficos() {
    crearGraficoProduccion();
    crearGraficoRGU();
    crearGraficoDuracion();
}

/////////////////////////////////////////
// GRAFICO N° 1
/////////////////////////////////////////

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
                pointBackgroundColor: "#ffffff",
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
                        font: {
                            size: 12,
                            weight: '600',
                            family: 'Segoe UI, sans-serif'
                        }
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true,
                    grace: '20%'
                }
            }
        }
    });
}

/////////////////////////////////////////
// GRAFICO N° 2
/////////////////////////////////////////

function crearGraficoRGU() {
    const agrupar = {};
    ordenMeses.forEach(m => agrupar[m] = { sumaRGU: 0, completados: 0 });

    filteredData.forEach(item => {
        const f = obtenerFechaObjeto(item);
        if (!f) return;
        const mNom = ordenMeses[f.getMonth()];
        const est = (item.Estado || "").toString().trim().toLowerCase();

        if (agrupar[mNom] && est === "completado") {
            let rguRaw = item.RGU ?? item.rgu ?? 0;
            if (typeof rguRaw === 'string') rguRaw = rguRaw.replace(',', '.').trim();
            agrupar[mNom].sumaRGU += Number(rguRaw) || 0;
            agrupar[mNom].completados++;
        }
    });

    const promedios = ordenMeses.map(m => {
        return agrupar[m].completados > 0
            ? Number((agrupar[m].sumaRGU / agrupar[m].completados).toFixed(1))
            : null;
    });

    const VALOR_META = 2.0;
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
                    borderColor: "#1d2a57",
                    backgroundColor: "#1d2a57",
                    borderWidth: 2,
                    tension: 0,
                    spanGaps: true,
                    pointRadius: 3,
                    clip: false,
                    datalabels: {
                        anchor: 'start',
                        align: 'bottom',
                        offset: 4,
                        color: '#1d2a57',
                        font: { weight: 'bold', size: 11 },
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
                        font: {
                            size: 12,
                            weight: '600',
                            family: 'Segoe UI, sans-serif'
                        }
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true,
                    grace: '20%'
                }
            }
        }
    });
}

/////////////////////////////////////////
// GRAFICO N° 3
/////////////////////////////////////////

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
                    color: '#1d2a57',
                    font: { weight: 'bold', size: 10 },
                    formatter: v => (v !== null && v !== undefined) ? v + ' min' : ''
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
                        font: {
                            size: 12,
                            weight: '600',
                            family: 'Segoe UI, sans-serif'
                        }
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true,
                    max: 160
                }
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