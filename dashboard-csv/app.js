let allData = [];
let filteredData = [];

let estadoChart;
let actividadChart;
let redChart;
let ciudadChart;

// ==========================================
// CARGAR ARCHIVO EXCEL O CSV
// ==========================================
document.getElementById("excelFile").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("fileName").textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            
            // Extraer datos de la primera hoja
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
// PREPARAR DATOS (Ajustado a tus columnas reales)
// ==========================================
function prepararDatos() {
    allData = allData.map(row => ({
        ...row,
        // Limpieza de números considerando el corte exacto de los nombres en tu cabecera
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
    llenarSelect("filterActividad", "Tipo_de_Activi"); // Ajustado al nombre real
    llenarSelect("filterCiudad", "Ciudad");
    llenarSelect("filterRed", "Tipo_Red");
}

function llenarSelect(selectId, column) {
    const select = document.getElementById(selectId);
    
    // Si la columna corta no existe, intenta buscar el nombre alternativo
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
document.getElementById("filterRed").addEventListener("change", aplicarFiltros);

function aplicarFiltros() {
    const estado = document.getElementById("filterEstado").value;
    const actividad = document.getElementById("filterActividad").value;
    const ciudad = document.getElementById("filterCiudad").value;
    const red = document.getElementById("filterRed").value;

    filteredData = allData.filter(row => {
        const valActividad = row.Tipo_de_Activi || row.Tipo_de_Actividad;
        return (
            (!estado || row.Estado === estado) &&
            (!actividad || valActividad === actividad) &&
            (!ciudad || row.Ciudad === ciudad) &&
            (!red || row.Tipo_Red === red)
        );
    });

    actualizarDashboard();
}

// Limpiar Filtros
document.getElementById("clearFilters").addEventListener("click", function() {
    document.getElementById("filterEstado").value = "";
    document.getElementById("filterActividad").value = "";
    document.getElementById("filterCiudad").value = "";
    document.getElementById("filterRed").value = "";

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
    const noRealizadas = filteredData.filter(row => row.Estado === "No Realizada").length;
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
// TABLA (Limitada a 100 registros para evitar freeze)
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
// AUXILIAR
// ==========================================
function contarPorColumna(data, column, colAlt) {
    const resultado = {};
    data.forEach(row => {
        const valor = row[column] || row[colAlt] || "Sin información";
        resultado[valor] = (resultado[valor] || 0) + 1;
    });
    return resultado;
}

// ==========================================
// GRÁFICOS
// ==========================================
function actualizarGraficos() {
    crearGraficoEstado();
    crearGraficoActividad();
    crearGraficoRed();
    crearGraficoCiudad();
}

function crearGraficoEstado() {
    const datos = contarPorColumna(filteredData, "Estado");
    if (estadoChart) estadoChart.destroy();

    estadoChart = new Chart(document.getElementById("estadoChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(datos),
            datasets: [{
                data: Object.values(datos),
                backgroundColor: ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function crearGraficoActividad() {
    const datos = contarPorColumna(filteredData, "Tipo_de_Activi", "Tipo_de_Actividad");
    if (actividadChart) actividadChart.destroy();

    actividadChart = new Chart(document.getElementById("actividadChart"), {
        type: "bar",
        data: {
            labels: Object.keys(datos),
            datasets: [{ label: "Órdenes", data: Object.values(datos), backgroundColor: "#2563eb" }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function crearGraficoRed() {
    const datos = contarPorColumna(filteredData, "Tipo_Red");
    if (redChart) redChart.destroy();

    redChart = new Chart(document.getElementById("redChart"), {
        type: "pie",
        data: {
            labels: Object.keys(datos),
            datasets: [{
                data: Object.values(datos),
                backgroundColor: ["#8b5cf6", "#06b6d4", "#f97316"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

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
            plugins: { legend: { display: false } }
        }
    });
}