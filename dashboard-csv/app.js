let allData = [];
let filteredData = [];

let estadoChart;
let actividadChart;
let redChart;
let ciudadChart;

// REGISTRAR EL PLUGIN DE ETIQUETAS (Obligatorio para Chart.js)
if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
}

// ==========================================
// CARGAR ARCHIVO EXCEL O CSV
// ==========================================
document.getElementById("excelFile").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("fileName").textContent = file.name;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            // cellDates: true permite parsear fechas nativas de Excel automáticamente
            const workbook = XLSX.read(data, { type: "array", cellDates: true });

            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];

            allData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            prepararDatos();
            mostrarDashboard();
        } catch (error) {
            console.error("Error al procesar el archivo:", error);
            alert("Ocurrió un error al leer la planilla. Asegúrate de que sea un archivo Excel (.xlsx) o CSV válido.");
        }
    };
    reader.readAsArrayBuffer(file);
});

// ==========================================
// PREPARAR DATOS
// ==========================================
function prepararDatos() {
    allData = allData.map(row => ({
        ...row,
        Cantidad_Exte: Number(row.Cantidad_Exte || row.Cantidad_Extensores) || 0,
        Cantidad_Planes: Number(row.Cantidad_Planes || row.Cantidad_Plan) || 0,
        Cantidad_DBox: Number(row.Cantidad_DBox || row.Cantidad_DBc) || 0,
        RGU: Number(row.RGU) || 0
    }));

    filteredData = [...allData];
    cargarFiltros();
}

// ==========================================
// MOSTRAR DASHBOARD
// ==========================================
function mostrarDashboard() {
    document.getElementById("filters").classList.remove("hidden");
    document.getElementById("kpis").classList.remove("hidden");
    document.getElementById("charts").classList.remove("hidden");
    document.getElementById("tableSection").classList.remove("hidden");

    actualizarDashboard();
}

// ==========================================
// FILTROS
// ==========================================
function cargarFiltros() {
    llenarSelect("filterEstado", "Estado");
    llenarSelect("filterActividad", "Tipo_de_Activi");
    llenarSelect("filterCiudad", "Ciudad");
}

function llenarSelect(selectId, column) {
    const select = document.getElementById(selectId);

    const valores = [
        ...new Set(
            allData
                .map(row => row[column] || row[column + "dad"] || row[column + "dad_de_Actividad"])
                .filter(value => value !== undefined && value !== null && value !== "")
        )
    ].sort();

    select.innerHTML = `<option value="">Todos</option>`;

    valores.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

// Escuchadores de eventos para filtros
document.getElementById("filterEstado").addEventListener("change", aplicarFiltros);
document.getElementById("filterActividad").addEventListener("change", aplicarFiltros);
document.getElementById("filterCiudad").addEventListener("change", aplicarFiltros);

// Escuchador dinámico por si agregaste el <select id="filterMes"> en tu HTML
const selectMes = document.getElementById("filterMes");
if (selectMes) {
    selectMes.addEventListener("change", aplicarFiltros);
}

function aplicarFiltros() {
    const estado = document.getElementById("filterEstado").value;
    const actividad = document.getElementById("filterActividad").value;
    const ciudad = document.getElementById("filterCiudad").value;

    const elMes = document.getElementById("filterMes");
    const mesSeleccionado = elMes ? elMes.value : "";

    filteredData = allData.filter(row => {
        const valActividad = row.Tipo_de_Activi || row.Tipo_de_Actividad;

        // Filtro por mes si está seleccionado
        const fechaObj = obtenerFechaObjeto(row.Inicio || row.Fecha || row.FIN || row.Fin);
        const coincidenMes = mesSeleccionado === "" || (fechaObj && fechaObj.getMonth() === parseInt(mesSeleccionado));

        return (
            (!estado || row.Estado === estado) &&
            (!actividad || valActividad === actividad) &&
            (!ciudad || row.Ciudad === ciudad) &&
            coincidenMes
        );
    });

    actualizarDashboard();
}

// Limpiar Filtros
document.getElementById("clearFilters").addEventListener("click", function () {
    document.getElementById("filterEstado").value = "";
    document.getElementById("filterActividad").value = "";
    document.getElementById("filterCiudad").value = "";

    const elMes = document.getElementById("filterMes");
    if (elMes) elMes.value = "";

    filteredData = [...allData];
    actualizarDashboard();
});

// ==========================================
// ACTUALIZAR DASHBOARD
// ==========================================
function actualizarDashboard() {
    actualizarKPIs();
    actualizarTabla();
    actualizarGraficos();
}

// ==========================================
// KPIs
// ==========================================
function actualizarKPIs() {
    const total = filteredData.length;
    const completadas = filteredData.filter(row => row.Estado === "Completado").length;
    const noRealizadas = filteredData.filter(row => row.Estado === "No Realizada" || row.Estado === "No realizada").length;
    const efectividad = total > 0 ? ((completadas / total) * 100).toFixed(1) : 0;

    const rgu = filteredData.reduce((acc, row) => acc + row.RGU, 0);
    const extensores = filteredData.reduce((acc, row) => acc + row.Cantidad_Exte, 0);

    document.getElementById("totalOrdenes").textContent = total.toLocaleString();
    document.getElementById("completadas").textContent = completadas.toLocaleString();
    document.getElementById("noRealizadas").textContent = noRealizadas.toLocaleString();
    document.getElementById("efectividad").textContent = efectividad + "%";
    document.getElementById("rguTotal").textContent = rgu.toFixed(2);
    document.getElementById("extensores").textContent = extensores.toLocaleString();
}

// ==========================================
// TABLA (Limitada a 100 registros)
// ==========================================
function actualizarTabla() {
    const tbody = document.getElementById("dataTable");
    tbody.innerHTML = "";

    const filasAMostrar = filteredData.slice(0, 100);

    filasAMostrar.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Orden_de_Tra || row.Orden_de_Trabajo || ""}</td>
            <td>${row.Tecnico || ""}</td>
            <td>${row.Tipo_de_Activi || row.Tipo_de_Actividad || ""}</td>
            <td>${row.Ciudad || ""}</td>
            <td>${row.Zona_de_traba || row.Zona_de_trabajo || ""}</td>
            <td>${row.Inicio || ""}</td>
            <td>${row.Fin || ""}</td>
            <td>${row.Estado || ""}</td>
            <td>${row.Tipo_Red || ""}</td>
            <td>${row.RGU || 0}</td>
        `;
        tbody.appendChild(tr);
    });

    const infoTexto = filteredData.length > 100
        ? `Mostrando los primeros 100 registros de un total de ${filteredData.length}`
        : `Mostrando ${filteredData.length} registros`;

    document.getElementById("rowCount").textContent = infoTexto;
}

// ==========================================
// AUXILIARES
// ==========================================
function contarPorColumna(data, column, colAlt) {
    const resultado = {};
    data.forEach(row => {
        const valor = row[column] || row[colAlt] || "Sin información";
        resultado[valor] = (resultado[valor] || 0) + 1;
    });
    return resultado;
}

// Convertidor de Fechas ajustado a la estructura de tu planilla
function obtenerFechaObjeto(item) {
    if (!item) return null;

    // 1. Priorizar la columna 'Origen' (que tiene la fecha DD-MM-YYYY)
    // Si no existe, intenta con Fecha, Inicio, etc.
    let rawFecha = item.Origen || item.Fecha || item.FIN || item.Fin || item.Inicio;
    if (!rawFecha) return null;

    if (rawFecha instanceof Date) return rawFecha;

    // 2. Si viene como número serial de Excel
    if (typeof rawFecha === 'number') {
        return new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
    }

    if (typeof rawFecha === 'string') {
        let str = rawFecha.trim();

        // 3. Manejar formato "DD-MM-YYYY" o "DD/MM/YYYY" (Ej: "02-01-2026")
        const partes = str.split(/[\/\-\s]/);
        if (partes.length >= 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1; // En JS los meses van de 0 (Enero) a 11 (Diciembre)
            const anio = parseInt(partes[2], 10);

            // Validar que sean números válidos
            if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
                // Si el año viene de 4 dígitos al final (Ej: 02-01-2026)
                if (partes[2].length === 4) {
                    return new Date(anio, mes, dia);
                }
                // Si el año viene al principio YYYY-MM-DD
                if (partes[0].length === 4) {
                    return new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
                }
            }
        }
    }

    const d = new Date(rawFecha);
    return isNaN(d.getTime()) ? null : d;
}

function calcularPorcentajeMensual(data) {
    const ordenMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    // 1. Inicializar los 12 meses
    const agruparPorMes = {};
    ordenMeses.forEach(mes => {
        agruparPorMes[mes] = { total: 0, completados: 0 };
    });

    // 2. Agrupar enviando todo el objeto 'item' a obtenerFechaObjeto
    data.forEach(item => {
        const fechaObj = obtenerFechaObjeto(item); // <-- Le pasamos el objeto completo
        if (!fechaObj) return;

        const nombreMes = ordenMeses[fechaObj.getMonth()];

        if (agruparPorMes[nombreMes]) {
            agruparPorMes[nombreMes].total++;
            if (item.Estado === "Completado") {
                agruparPorMes[nombreMes].completados++;
            }
        }
    });

    // 3. Generar array con los 12 meses
    const porcentajesArr = ordenMeses.map(mes => {
        const datosMes = agruparPorMes[mes];
        return datosMes.total > 0 ? (datosMes.completados / datosMes.total) * 100 : null;
    });

    return {
        meses: ordenMeses,
        porcentajes: porcentajesArr
    };
}

// ==========================================
// GRÁFICOS
// ==========================================
function actualizarGraficos() {
    crearGraficoEstado();
    crearGraficoActividad();
    crearGraficoCiudad();
}

// ------------------------------------------
// 1 - GRÁFICO DE LÍNEAS (PRODUCCIÓN GENERAL MENSUAL)
// ------------------------------------------
function crearGraficoEstado() {
    const produccionPorMes = calcularPorcentajeMensual(filteredData);

    const ctx = document.getElementById("estadoChart").getContext('2d');

    if (estadoChart) estadoChart.destroy();

    // Obtener valores válidos para calcular la escala
    const valoresValidos = produccionPorMes.porcentajes.filter(v => v !== null);
    const minVal = valoresValidos.length > 0 ? Math.min(...valoresValidos) : 0;

    estadoChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: produccionPorMes.meses,
            datasets: [{
                label: 'Producción General',
                data: produccionPorMes.porcentajes,
                borderColor: "#1d2a57",
                backgroundColor: "transparent",
                borderWidth: 3,
                tension: 0.4,
                spanGaps: true, // Conecta los puntos ignorando los null entre meses
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: "#1d2a57"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 25, right: 15, left: 15, bottom: 10 }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: function (context) {
                        return context.dataset.data[context.dataIndex] !== null;
                    },
                    align: 'top',
                    anchor: 'end',
                    offset: 6,
                    color: '#1d2a57',
                    font: { size: 12, weight: 'bold' },
                    formatter: function (value) {
                        return value !== null ? value.toFixed(1) + ' %' : '';
                    }
                },
                title: {
                    display: true,
                    text: 'Producción General por Mes',
                    color: 'white',
                    backgroundColor: '#1d2a57',
                    font: { size: 16, weight: 'bold' },
                    padding: { top: 10, bottom: 10 },
                    borderRadius: 10
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#1d2a57', font: { size: 12, weight: '500' } }
                },
                y: {
                    display: false,
                    min: Math.max(0, minVal - 15),
                    max: 110
                }
            }
        }
    });

    const container = document.getElementById("estadoChart").parentElement;
    container.style.borderRadius = "15px";
    container.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    container.style.padding = "15px";
    container.style.backgroundColor = "white";
}
// ------------------------------------------
// 2 - GRÁFICO DE PROMEDIO GENERAL HISTORICO (RGU)
// ------------------------------------------}

function calcularPromedioMensual(data) {
    const ordenMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    const agruparPorMes = {};
    ordenMeses.forEach(mes => {
        agruparPorMes[mes] = { sumaRGU: 0, ordenesCompletadas: 0 };
    });

    data.forEach(item => {
        const fechaObj = obtenerFechaObjeto(item);
        if (!fechaObj) return;

        const nombreMes = ordenMeses[fechaObj.getMonth()];

        // FILTRO CLAVE: Solo tomar en cuenta órdenes COMPLETADAS
        if (agruparPorMes[nombreMes] && item.Estado === "Completado") {
            agruparPorMes[nombreMes].sumaRGU += Number(item.RGU) || 0;
            agruparPorMes[nombreMes].ordenesCompletadas++;
        }
    });

    // RGU Promedio Real = Suma de RGU / Órdenes Completadas
    const promediosArr = ordenMeses.map(mes => {
        const datosMes = agruparPorMes[mes];
        if (datosMes.ordenesCompletadas > 0) {
            return Number((datosMes.sumaRGU / datosMes.ordenesCompletadas).toFixed(1));
        }
        return null;
    });

    return {
        meses: ordenMeses,
        promedios: promediosArr
    };
}

function crearGraficoActividad() {
    const datosPromedio = calcularPromedioMensual(filteredData);

    // Meta fija (Ajusta el 2.3 por el valor meta que desees)
    const VALOR_META = 2.0;
    const metaArray = datosPromedio.promedios.map(val => val !== null ? VALOR_META : null);

    const canvas = document.getElementById("actividadChart");
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (actividadChart) actividadChart.destroy();

    actividadChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: datosPromedio.meses,
            datasets: [
                {
                    label: 'Promedio General',
                    data: datosPromedio.promedios,
                    borderColor: "#1d2a57",
                    backgroundColor: "#1d2a57",
                    borderWidth: 2.5,
                    tension: 0.2,
                    spanGaps: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    // Muestra el número formateado con coma debajo del punto (ej: 2,1)
                    datalabels: {
                        align: 'bottom',
                        anchor: 'start',
                        offset: 4,
                        color: '#555555',
                        font: { size: 11, weight: 'bold' },
                        formatter: function (value) {
                            return value !== null ? value.toString().replace('.', ',') : '';
                        }
                    }
                },
                {
                    label: 'Meta',
                    data: metaArray,
                    borderColor: "#facc15",
                    backgroundColor: "#facc15",
                    borderWidth: 2.5,
                    tension: 0,
                    spanGaps: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    datalabels: { display: false }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 15, right: 15, left: 15, bottom: 15 }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        color: '#333333',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                title: {
                    display: true,
                    text: 'Promedio general histórico',
                    color: 'white',
                    backgroundColor: '#1d2a57',
                    font: { size: 15, weight: 'bold' },
                    padding: { top: 8, bottom: 8 },
                    borderRadius: 8
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#666666', font: { size: 11 } }
                },
                y: {
                    display: false,
                    min: 0
                }
            }
        }
    });

    const container = canvas.parentElement;
    container.style.borderRadius = "15px";
    container.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    container.style.padding = "15px";
    container.style.backgroundColor = "white";
}

// ------------------------------------------
// RESTO DE GRÁFICOS
// ------------------------------------------


function crearGraficoCiudad() {
    const datos = contarPorColumna(filteredData, "Ciudad");
    if (ciudadChart) ciudadChart.destroy();

    ciudadChart = new Chart(document.getElementById("ciudadChart"), {
        type: "bar",
        data: {
            labels: Object.keys(datos),
            datasets: [{ label: "Órdenes", data: Object.values(datos), backgroundColor: "#14b8a6" }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            }
        }
    });
}