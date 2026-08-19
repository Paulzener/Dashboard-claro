// ==========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ==========================================

let rawData = [];
let filteredData = [];

let filtroSelecciones = {
    actividad: [],
    zona: [],
    ciudad: [],
    ano: [],
    mes: []
};

let estadoChartInstance = null;
let actividadChartInstance = null;
let duracionChartInstance = null;

let miniEfectividadChartInstance = null;
let miniDuracionChartInstance = null;

const ordenMeses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const ordenMesesCompletos = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre"
];


// ==========================================
// CHART DATALABELS
// ==========================================

if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
}


// ==========================================
// INICIO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    cargarDatosDesdeAPI();

    inicializarMultiselects();

    document
        .getElementById("clearFilters")
        ?.addEventListener(
            "click",
            limpiarFiltros
        );

    document
        .getElementById("applyAllFilters")
        ?.addEventListener(
            "click",
            aplicarTodosLosFiltros
        );


    // ==========================
    // BOTÓN MOSTRAR/OCULTAR FILTROS
    // ==========================

    const toggleFiltersBtn =
        document.getElementById("toggleFiltersBtn");

    const filters =
        document.getElementById("filters");

    toggleFiltersBtn?.addEventListener("click", () => {

        filters?.classList.toggle("is-open");

        toggleFiltersBtn.classList.toggle("active");
    });
});


// ==========================================
// CARGAR DATOS DESDE API
// ==========================================

function cargarDatosDesdeAPI() {

    fetch("/api/actividades")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `Error HTTP ${response.status}`
                );
            }

            return response.json();
        })
        .then(data => {

            console.log("Datos recibidos:", data);

            rawData = data.map(item => {

                return {

                    ...item,

                    Fecha:
                        item.Fecha ??
                        item.FECHA ??
                        item.fecha ??
                        item.Fecha_Inicio ??
                        item.ORIGEN ??
                        item.Origen,

                    Tipo_de_Actividad:
                        item.Tipo_de_Actividad ??
                        item.TIPO_DE_ACTIVIDAD ??
                        item.TIPO_ACTIVIDAD ??
                        item.Tipo_Actividad,

                    Ciudad:
                        item.Ciudad ??
                        item.CIUDAD ??
                        item.ciudad,

                    Zona_de_trabajo:
                        item.Zona_de_trabajo ??
                        item.ZONA_DE_TRABAJO ??
                        item.ZONA_TRABAJO ??
                        item.Zona_Trabajo,

                    Estado:
                        item.Estado ??
                        item.ESTADO ??
                        item.estado,

                    Tecnico:
                        item.Tecnico ??
                        item.TECNICO ??
                        item.Técnico,

                    Supervisor:
                        item.Supervisor ??
                        item.SUPERVISOR ??
                        item.supervisor,

                    RGU:
                        item.RGU ??
                        item.rgu,

                    Inicio:
                        item.Inicio ??
                        item.INICIO ??
                        item.Hora_Inicio ??
                        item.HORA_INICIO,

                    Fin:
                        item.Fin ??
                        item.FIN ??
                        item.Hora_Fin ??
                        item.HORA_FIN,

                    Rut_o_Bucket:
                        item.Rut_o_Bucket ??
                        item.RUT ??
                        item.RUT_BUCKET ??
                        item.BUCKET,

                    Orden_de_Trabajo:
                        item.Orden_de_Trabajo ??
                        item.ORDEN_DE_TRABAJO ??
                        item.ORDEN_TRABAJO
                };
            });

            filteredData = [...rawData];

            console.log("Total registros:", rawData.length);

            poblarFiltros(rawData);

            mostrarSecciones();

            aplicarFiltros();
        })
        .catch(error => {

            console.error(
                "Error al cargar datos desde la base de datos:",
                error
            );
        });
}


// ==========================================
// MULTISELECT
// ==========================================

function inicializarMultiselects() {

    document
        .querySelectorAll(".custom-multiselect")
        .forEach(container => {

            const trigger =
                container.querySelector(".multiselect-trigger");

            const menu =
                container.querySelector(".multiselect-menu");

            const btnTodos =
                container.querySelector(".btn-todos");

            const btnLimpiar =
                container.querySelector(".btn-limpiar");

            const btnApply =
                container.querySelector(".btn-apply");

            const filterKey =
                container.dataset.filterKey;


            // Abrir / cerrar
            trigger?.addEventListener("click", e => {

                e.stopPropagation();

                document
                    .querySelectorAll(".multiselect-menu")
                    .forEach(m => {

                        if (m !== menu) {
                            m.classList.add("hidden");
                        }
                    });

                menu?.classList.toggle("hidden");
            });


            // TODOS
            btnTodos?.addEventListener('click', (e) => {

                e.stopPropagation();

                const inputs = container.querySelectorAll(
                    '.multiselect-options input[type="checkbox"]'
                );

                inputs.forEach(chk => {
                    chk.checked = true;
                });

                filtroSelecciones[filterKey] =
                    Array.from(inputs).map(chk => chk.value);

                actualizarTextoTrigger(container, filterKey);
            });


            // LIMPIAR
            btnLimpiar?.addEventListener('click', (e) => {

                e.stopPropagation();

                const inputs = container.querySelectorAll(
                    '.multiselect-options input[type="checkbox"]'
                );

                inputs.forEach(chk => {
                    chk.checked = false;
                });

                filtroSelecciones[filterKey] = [];

                actualizarTextoTrigger(container, filterKey);
            });


            // APLICAR
            btnApply?.addEventListener("click", e => {

                e.stopPropagation();

                actualizarSeleccionDesdeDOM(
                    container,
                    filterKey
                );

                actualizarTextoTrigger(
                    container,
                    filterKey
                );

                menu?.classList.add("hidden");

                aplicarFiltros();
            });
        });


    // Cerrar al hacer click afuera
    document.addEventListener("click", e => {

        if (!e.target.closest(".custom-multiselect")) {

            document
                .querySelectorAll(".multiselect-menu")
                .forEach(menu => {

                    menu.classList.add("hidden");
                });
        }
    });
}


// ==========================================
// ACTUALIZAR SELECCIÓN
// ==========================================

function actualizarSeleccionDesdeDOM(container, filterKey) {

    const checkedInputs =
        Array.from(
            container.querySelectorAll(
                ".multiselect-options input:checked"
            )
        );

    filtroSelecciones[filterKey] =
        checkedInputs.map(input =>
            String(input.value).trim()
        );
}


// ==========================================
// POBLAR MULTISELECT
// ==========================================

function poblarMultiselect(
    idContainer,
    filterKey,
    items,
    esUnico = false
) {

    const container =
        document.getElementById(idContainer);

    if (!container) return;

    const optionsContainer =
        container.querySelector(".multiselect-options");

    if (!optionsContainer) return;

    optionsContainer.innerHTML = "";

    filtroSelecciones[filterKey] = [];


    const header =
        container.querySelector(".multiselect-header");

    if (header) {

        header.style.display =
            esUnico ? "none" : "flex";
    }


    items.forEach((item, index) => {

        const val =
            typeof item === "object"
                ? item.value
                : item;

        const text =
            typeof item === "object"
                ? item.text
                : item;


        const label =
            document.createElement("label");


        if (esUnico) {

            const checked =
                index === 0;

            if (checked) {

                filtroSelecciones[filterKey] = [
                    String(val)
                ];
            }


            label.innerHTML = `
                <input
                    type="radio"
                    name="radio-${filterKey}"
                    value="${escapeHTML(val)}"
                    ${checked ? "checked" : ""}
                    class="chk-${filterKey}"
                >

                <span>${escapeHTML(text)}</span>
            `;

        } else {

            filtroSelecciones[filterKey].push(
                String(val)
            );

            label.innerHTML = `
                <input
                    type="checkbox"
                    value="${escapeHTML(val)}"
                    checked
                    class="chk-${filterKey}"
                >

                <span>${escapeHTML(text)}</span>
            `;
        }

        optionsContainer.appendChild(label);
    });


    actualizarTextoTrigger(
        container,
        filterKey
    );
}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// TEXTO DEL FILTRO
// ==========================================

function actualizarTextoTrigger(
    container,
    filterKey
) {

    const triggerText =
        container.querySelector(".selected-text");

    if (!triggerText) return;


    const checkedInput =
        container.querySelector(
            ".multiselect-options input:checked"
        );

    const total =
        container.querySelectorAll(
            ".multiselect-options input"
        ).length;

    const marcados =
        filtroSelecciones[filterKey].length;


    // RADIO
    if (
        container.querySelector(
            'input[type="radio"]'
        )
    ) {

        triggerText.textContent =
            checkedInput
                ? checkedInput.nextElementSibling.textContent
                : "Seleccionar";

        return;
    }


    // TODOS
    if (marcados === total) {

        if (filterKey === "mes") {
            triggerText.textContent =
                "Todos los meses";
        }
        else if (
            filterKey === "ciudad" ||
            filterKey === "zona"
        ) {
            triggerText.textContent =
                "Todas";
        }
        else {
            triggerText.textContent =
                "Todos";
        }

        return;
    }


    // NINGUNO
    if (marcados === 0) {

        triggerText.textContent =
            "Ninguno";

        return;
    }


    // UNO
    if (marcados === 1) {

        triggerText.textContent =
            checkedInput
                ? checkedInput.nextElementSibling.textContent
                : filtroSelecciones[filterKey][0];

        return;
    }


    // VARIOS
    triggerText.textContent =
        `${marcados} seleccionados`;
}


// ==========================================
// FECHAS
// ==========================================

function obtenerFechaObjeto(item) {
    if (!item) return null;

    // La fecha real viene desde SQL Server como "Fecha"
    const rawFecha =
        item.Fecha ??
        item.FECHA ??
        item.fecha ??
        item.Fecha_Inicio ??
        item.Origen;

    if (!rawFecha) return null;

    if (rawFecha instanceof Date) {
        return isNaN(rawFecha.getTime()) ? null : rawFecha;
    }

    const str = String(rawFecha).trim();

    if (!str) return null;

    // Si viene en formato ISO con Z:
    // 2026-06-02T00:00:00.000Z
    // usamos UTC para evitar que Chile lo convierta al día anterior.
    const matchISO = str.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{2}):(\d{2})(?::(\d{2}))?/
    );

    if (matchISO) {
        const año = Number(matchISO[1]);
        const mes = Number(matchISO[2]) - 1;
        const dia = Number(matchISO[3]);
        const hora = Number(matchISO[4] || 0);
        const minuto = Number(matchISO[5] || 0);
        const segundo = Number(matchISO[6] || 0);

        return new Date(
            año,
            mes,
            dia,
            hora,
            minuto,
            segundo
        );
    }

    const d = new Date(str);

    return isNaN(d.getTime()) ? null : d;
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(item) {
    const f = obtenerFechaObjeto(item);

    if (!f || isNaN(f.getTime())) {
        return '-';
    }

    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();

    return `${dia}/${mes}/${anio}`;
}


// ==========================================
// HORAS
// ==========================================

function convertirAHoraMinutos(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }


    const str =
        String(valor).trim();


    const partes =
        str.split(":");


    if (partes.length < 2) {
        return null;
    }


    const h =
        parseInt(partes[0], 10);

    const m =
        parseInt(partes[1], 10);


    if (
        isNaN(h) ||
        isNaN(m)
    ) {
        return null;
    }


    return h * 60 + m;
}


// ==========================================
// DIFERENCIA HORAS
// ==========================================

function calcularDiferenciaMinutos(
    horaInicioRaw,
    horaFinRaw
) {

    const minInicio =
        convertirAHoraMinutos(
            horaInicioRaw
        );

    const minFin =
        convertirAHoraMinutos(
            horaFinRaw
        );


    if (
        minInicio === null ||
        minFin === null
    ) {
        return null;
    }


    let diferencia =
        minFin - minInicio;


    if (diferencia < 0) {

        diferencia += 1440;
    }


    return diferencia;
}


// ==========================================
// MOSTRAR SECCIONES
// ==========================================

function mostrarSecciones() {

    document
        .getElementById("filters")
        ?.classList.remove("hidden");

    document
        .getElementById("kpis")
        ?.classList.remove("hidden");

    document
        .getElementById("charts")
        ?.classList.remove("hidden");

    document
        .getElementById("tableSection")
        ?.classList.remove("hidden");
}


// ==========================================
// POBLAR FILTROS
// ==========================================

function poblarFiltros(data) {

    const anos = new Set();
    const ciudades = new Set();
    const zonas = new Set();
    const actividades = new Set();

    data.forEach(item => {

        // ==========================
        // FECHA
        // ==========================

        const fechaObj = obtenerFechaObjeto(item);

        if (fechaObj) {

            const ano = fechaObj.getFullYear();

            if (!isNaN(ano)) {
                anos.add(String(ano));
            }
        }


        // ==========================
        // ACTIVIDAD
        // ==========================

        const act = (item.Tipo_de_Actividad || "")
            .toString()
            .trim();

        if (act) {
            actividades.add(act);
        }


        // ==========================
        // CIUDAD
        // ==========================

        const ciudad = (item.Ciudad || "")
            .toString()
            .trim();

        if (ciudad) {
            ciudades.add(ciudad);
        }


        // ==========================
        // ZONA
        // ==========================

        const zona = (item.Zona_de_trabajo || "")
            .toString()
            .trim();

        if (zona) {
            zonas.add(zona);
        }
    });


    // ==========================
    // ORDENAR
    // ==========================

    const anosOrdenados = Array
        .from(anos)
        .sort((a, b) => Number(b) - Number(a));

    const ciudadesOrdenadas = Array
        .from(ciudades)
        .sort((a, b) => a.localeCompare(b));

    const zonasOrdenadas = Array
        .from(zonas)
        .sort((a, b) => a.localeCompare(b));

    const actividadesOrdenadas = Array
        .from(actividades)
        .sort((a, b) => a.localeCompare(b));


    // ==========================
    // CARGAR FILTROS
    // ==========================

    poblarMultiselect(
        "multiselectAno",
        "ano",
        anosOrdenados,
        true
    );

    poblarMultiselect(
        "multiselectActividad",
        "actividad",
        actividadesOrdenadas
    );

    poblarMultiselect(
        "multiselectZona",
        "zona",
        zonasOrdenadas
    );

    poblarMultiselect(
        "multiselectCiudad",
        "ciudad",
        ciudadesOrdenadas
    );


    // ==========================
    // MESES
    // ==========================

    const itemsMeses = ordenMeses.map(
        (mesCorto, index) => ({
            value: mesCorto,
            text: ordenMesesCompletos[index]
        })
    );

    poblarMultiselect(
        "multiselectMes",
        "mes",
        itemsMeses
    );
}


// ==========================================
// APLICAR FILTROS
// ==========================================

function aplicarFiltros() {

    filteredData = rawData.filter(item => {

        const fechaObj = obtenerFechaObjeto(item);

        const itemAno = fechaObj
            ? fechaObj.getFullYear().toString()
            : "";

        const itemMes = fechaObj
            ? ordenMeses[fechaObj.getMonth()]
            : "";

        const itemAct = (item.Tipo_de_Actividad || "")
            .toString()
            .trim();

        const itemCiudad = (item.Ciudad || "")
            .toString()
            .trim();

        const itemZona = (item.Zona_de_trabajo || "")
            .toString()
            .trim();

        // ==========================================
        // AÑO
        // ==========================================

        const totalAno =
            document.querySelectorAll(
                "#multiselectAno .multiselect-options input"
            ).length;

        const cumpleAno =
            totalAno === 0 ||
            filtroSelecciones.ano.length === 0 ||
            filtroSelecciones.ano.includes(itemAno);


        // ==========================================
        // MES
        // ==========================================

        const totalMes =
            document.querySelectorAll(
                "#multiselectMes .multiselect-options input"
            ).length;

        const cumpleMes =
            totalMes === 0 ||
            filtroSelecciones.mes.length === 0 ||
            filtroSelecciones.mes.includes(itemMes);


        // ==========================================
        // ACTIVIDAD
        // ==========================================

        const totalAct =
            document.querySelectorAll(
                "#multiselectActividad .multiselect-options input"
            ).length;

        const cumpleActividad =
            totalAct === 0 ||
            filtroSelecciones.actividad.length === 0 ||
            filtroSelecciones.actividad.includes(itemAct);


        // ==========================================
        // CIUDAD
        // ==========================================

        const totalCiudad =
            document.querySelectorAll(
                "#multiselectCiudad .multiselect-options input"
            ).length;

        const cumpleCiudad =
            totalCiudad === 0 ||
            filtroSelecciones.ciudad.length === 0 ||
            filtroSelecciones.ciudad.includes(itemCiudad);


        // ==========================================
        // ZONA
        // ==========================================

        const totalZona =
            document.querySelectorAll(
                "#multiselectZona .multiselect-options input"
            ).length;

        const cumpleZona =
            totalZona === 0 ||
            filtroSelecciones.zona.length === 0 ||
            filtroSelecciones.zona.includes(itemZona);


        return (
            cumpleAno &&
            cumpleMes &&
            cumpleActividad &&
            cumpleCiudad &&
            cumpleZona
        );
    });

    console.log("Filtros aplicados:", filtroSelecciones);
    console.log("Registros originales:", rawData.length);
    console.log("Registros filtrados:", filteredData.length);

    actualizarDashboard();
}


// ==========================================
// APLICAR TODOS
// ==========================================

function aplicarTodosLosFiltros() {

    document.querySelectorAll('.custom-multiselect').forEach(container => {

        const filterKey = container.dataset.filterKey;

        const checkedInputs = Array.from(
            container.querySelectorAll(
                '.multiselect-options input:checked'
            )
        );

        filtroSelecciones[filterKey] =
            checkedInputs.map(chk => chk.value);

        actualizarTextoTrigger(
            container,
            filterKey
        );
    });


    document
        .getElementById('filters')
        ?.classList.remove('is-open');

    document
        .getElementById('toggleFiltersBtn')
        ?.classList.remove('active');


    aplicarFiltros();
}


// ==========================================
// LIMPIAR FILTROS
// ==========================================

function limpiarFiltros() {

    document
        .querySelectorAll(".custom-multiselect")
        .forEach(container => {

            const filterKey =
                container.dataset.filterKey;

            const radio =
                container.querySelector(
                    'input[type="radio"]'
                );


            // AÑO
            if (radio) {

                const primerRadio =
                    container.querySelector(
                        'input[type="radio"]'
                    );

                if (primerRadio) {

                    primerRadio.checked = true;

                    filtroSelecciones[filterKey] = [
                        String(primerRadio.value)
                    ];
                }

            }

            // CHECKBOX
            else {

                const checkboxes =
                    container.querySelectorAll(
                        'input[type="checkbox"]'
                    );


                checkboxes.forEach(chk => {

                    chk.checked = true;
                });


                filtroSelecciones[filterKey] =
                    Array.from(checkboxes)
                        .map(chk =>
                            String(chk.value)
                        );
            }


            actualizarTextoTrigger(
                container,
                filterKey
            );
        });


    aplicarFiltros();
}


// ==========================================
// DASHBOARD
// ==========================================

function actualizarDashboard() {

    actualizarKPIs();

    renderizarTabla();

    actualizarGraficos();

    renderizarMiniGraficoEfectividad(
        obtenerCompletadas(),
        obtenerNoRealizadas()
    );

    renderizarMiniGraficoDuracion();
}


// ==========================================
// OBTENER ESTADOS
// ==========================================

function obtenerCompletadas() {

    return filteredData.filter(item => {

        return String(
            item.Estado ?? ""
        )
            .trim()
            .toLowerCase() === "completado";

    }).length;
}


function obtenerNoRealizadas() {

    return filteredData.filter(item => {

        return String(
            item.Estado ?? ""
        )
            .trim()
            .toLowerCase() === "no realizada";

    }).length;
}


// ==========================================
// KPIS
// ==========================================

function actualizarKPIs() {

    const total =
        filteredData.length;

    let completadas = 0;
    let noRealizadas = 0;

    let duracionTotalSum = 0;
    let duracionConteo = 0;

    const agruparTecnicosKPI = {};


    filteredData.forEach(item => {

        const estado =
            String(
                item.Estado ?? ""
            )
                .trim()
                .toLowerCase();


        if (estado === "completado") {
            completadas++;
        }


        if (estado === "no realizada") {
            noRealizadas++;
        }


        const inicio =
            item.Inicio ??
            item.Hora_Inicio;

        const fin =
            item.Fin ??
            item.Hora_Fin;


        const diferencia =
            calcularDiferenciaMinutos(
                inicio,
                fin
            );


        if (
            estado === "completado" &&
            diferencia !== null &&
            diferencia >= 0 &&
            diferencia < 720
        ) {

            duracionTotalSum += diferencia;

            duracionConteo++;
        }


        // RGU
        if (estado === "completado") {

            const fecha =
                obtenerFechaObjeto(item);

            const tecnico =
                String(
                    item.Tecnico ?? ""
                ).trim();


            if (fecha && tecnico) {

                const diaKey =
                    `${fecha.getFullYear()}-` +
                    `${String(
                        fecha.getMonth() + 1
                    ).padStart(2, "0")}-` +
                    `${String(
                        fecha.getDate()
                    ).padStart(2, "0")}`;


                let rgu =
                    item.RGU ?? 0;


                if (typeof rgu === "string") {

                    rgu =
                        rgu
                            .replace(",", ".")
                            .trim();
                }


                const rguNum =
                    parseFloat(rgu) || 0;


                if (!agruparTecnicosKPI[tecnico]) {

                    agruparTecnicosKPI[tecnico] = {};
                }


                if (
                    !agruparTecnicosKPI[
                    tecnico
                    ][diaKey]
                ) {

                    agruparTecnicosKPI[
                        tecnico
                    ][diaKey] = 0;
                }


                agruparTecnicosKPI[
                    tecnico
                ][diaKey] += rguNum;
            }
        }
    });


    // ------------------------------
    // RGU PROMEDIO
    // ------------------------------

    const tecnicos =
        Object.keys(
            agruparTecnicosKPI
        );


    let rguPromedio = 0;


    if (tecnicos.length > 0) {

        let suma =
            0;


        tecnicos.forEach(tecnico => {

            const dias =
                Object.keys(
                    agruparTecnicosKPI[
                    tecnico
                    ]
                );


            let totalTecnico =
                0;


            dias.forEach(dia => {

                totalTecnico +=
                    agruparTecnicosKPI[
                    tecnico
                    ][dia];
            });


            if (dias.length > 0) {

                suma +=
                    totalTecnico /
                    dias.length;
            }
        });


        rguPromedio =
            suma /
            tecnicos.length;
    }


    // ------------------------------
    // PORCENTAJES
    // ------------------------------

    const efectividad =
        (
            completadas +
            noRealizadas
        ) > 0
            ? (
                completadas /
                (
                    completadas +
                    noRealizadas
                )
            ) * 100
            : 0;


    // ------------------------------
    // DURACIÓN
    // ------------------------------

    const duracionPromedio =
        duracionConteo > 0
            ? Math.round(
                duracionTotalSum /
                duracionConteo
            )
            : 0;


    const horas =
        Math.floor(
            duracionPromedio / 60
        );

    const minutos =
        duracionPromedio % 60;


    const duracionFormateada =
        `${String(horas).padStart(2, "0")}:` +
        `${String(minutos).padStart(2, "0")}`;


    // ------------------------------
    // MOSTRAR
    // ------------------------------

    const totalElem =
        document.getElementById(
            "totalOrdenes"
        );

    if (totalElem) {
        totalElem.innerText = total;
    }


    const completadasElem =
        document.getElementById(
            "completadas"
        );

    if (completadasElem) {
        completadasElem.innerText =
            completadas;
    }


    const pctCompElem =
        document.getElementById(
            "pctCompletadas"
        );

    if (pctCompElem) {

        pctCompElem.innerText =
            total > 0
                ? (
                    completadas /
                    total *
                    100
                ).toFixed(1) + "%"
                : "0%";
    }


    const noRealizadasElem =
        document.getElementById(
            "noRealizadas"
        );

    if (noRealizadasElem) {

        noRealizadasElem.innerText =
            noRealizadas;
    }


    const efectividadElem =
        document.getElementById(
            "efectividad"
        );

    if (efectividadElem) {

        efectividadElem.innerText =
            efectividad.toFixed(1) + "%";
    }


    const rguElem =
        document.getElementById(
            "rguTotal"
        );

    if (rguElem) {

        rguElem.innerText =
            rguPromedio
                .toFixed(1)
                .replace(".", ",");
    }


    const durElem =
        document.getElementById(
            "duracionPromedio"
        );

    if (durElem) {

        durElem.innerText =
            duracionFormateada;
    }
}


// ==========================================
// TABLA
// ==========================================

function formatearHoraRedondeada(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "-";
    }


    const partes =
        String(valor)
            .trim()
            .split(":");


    if (partes.length >= 2) {

        let h =
            parseInt(
                partes[0].slice(-2),
                10
            );

        let m =
            parseInt(
                partes[1],
                10
            );

        const s =
            partes[2]
                ? parseInt(
                    partes[2],
                    10
                )
                : 0;


        if (s >= 30) {
            m++;
        }


        if (m >= 60) {

            m = 0;

            h =
                (h + 1) % 24;
        }


        if (
            !isNaN(h) &&
            !isNaN(m)
        ) {

            return (
                String(h).padStart(2, "0") +
                ":" +
                String(m).padStart(2, "0")
            );
        }
    }


    return valor;
}


function renderizarTabla() {

    const tbody =
        document.getElementById(
            "dataTable"
        );

    if (!tbody) return;


    tbody.innerHTML = "";


    const limiteData =
        filteredData.slice(0, 100);


    limiteData.forEach(item => {

        const tecnico =
            String(
                item.Tecnico ?? "-"
            ).trim();

        const supervisor =
            String(
                item.Supervisor ?? "-"
            ).trim();


        const inicio =
            item.Inicio ??
            item.Hora_Inicio;

        const fin =
            item.Fin ??
            item.Hora_Fin;


        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>${escapeHTML(tecnico)}</td>

            <td>${escapeHTML(supervisor)}</td>

            <td>${escapeHTML(item.Rut_o_Bucket ?? "-")}</td>

            <td>${escapeHTML(item.Tipo_de_Actividad ?? "-")}</td>

            <td>${escapeHTML(item.Orden_de_Trabajo ?? "-")}</td>
            
            <td>${escapeHTML(item.Ciudad ?? "-")}</td>

            <td>${escapeHTML(item.Zona_de_trabajo ?? "-")}</td>

            <td>${formatearHoraRedondeada(inicio)}</td>

            <td>${formatearHoraRedondeada(fin)}</td>

            <td>${escapeHTML(item.Estado ?? "-")}</td>

            <td>${formatearFecha(item)}</td>

            <td>${escapeHTML(item.RGU ?? "0")}</td>
        `;


        tbody.appendChild(tr);
    });


    const rowCount =
        document.getElementById(
            "rowCount"
        );


    if (rowCount) {

        rowCount.innerText =
            `Mostrando ${limiteData.length} de ${filteredData.length} registros`;
    }
}


// ==========================================
// GRÁFICOS
// ==========================================

function actualizarGraficos() {

    crearGraficoProduccion();

    crearGraficoRGU();

    crearGraficoDuracion();
}


// ==========================================
// PRODUCCIÓN
// ==========================================

function crearGraficoProduccion() {

    const agrupar = {};


    ordenMeses.forEach(mes => {

        agrupar[mes] = {
            completados: 0,
            noRealizadas: 0
        };
    });


    filteredData.forEach(item => {

        const fecha =
            obtenerFechaObjeto(item);

        if (!fecha) return;


        const mes =
            ordenMeses[
            fecha.getMonth()
            ];


        const estado =
            String(
                item.Estado ?? ""
            )
                .trim()
                .toLowerCase();


        if (estado === "completado") {

            agrupar[mes].completados++;
        }


        if (estado === "no realizada") {

            agrupar[mes].noRealizadas++;
        }
    });


    const porcentajes =
        ordenMeses.map(mes => {

            const total =
                agrupar[mes].completados +
                agrupar[mes].noRealizadas;


            return total > 0
                ? Number(
                    (
                        agrupar[mes].completados /
                        total *
                        100
                    ).toFixed(1)
                )
                : null;
        });


    const canvas =
        document.getElementById(
            "estadoChart"
        );

    if (!canvas) return;


    if (estadoChartInstance) {

        estadoChartInstance.destroy();
    }


    estadoChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

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

                        pointBackgroundColor:
                            "#1d2a57",

                        pointBorderColor:
                            "#1d2a57",

                        datalabels: {

                            anchor:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "top"
                                        : "bottom",

                            align:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "end"
                                        : "start",

                            offset: 6,

                            color:
                                "#1d2a57",

                            font: {
                                size: 11,
                                weight: "bold",
                                family:
                                    "Segoe UI, sans-serif"
                            },

                            formatter:
                                value =>
                                    value !== null
                                        ? value
                                            .toString()
                                            .replace(
                                                ".",
                                                ","
                                            ) + "%"
                                        : ""
                        }
                    }]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    layout: {
                        padding: {
                            top: 25,
                            bottom: 5,
                            left: 10,
                            right: 10
                        }
                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color: "#1e293b",
                                padding: 8,

                                font: {
                                    size: 12,
                                    weight: "600",
                                    family:
                                        "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {
                            display: false,
                            beginAtZero: true,
                            grace: "20%"
                        }
                    }
                }
            }
        );
}


// ==========================================
// RGU
// ==========================================

function crearGraficoRGU() {

    const agrupar = {};


    ordenMeses.forEach(mes => {

        agrupar[mes] = {};
    });


    filteredData.forEach(item => {

        const fecha =
            obtenerFechaObjeto(item);

        if (!fecha) return;


        const estado =
            String(
                item.Estado ?? ""
            )
                .trim()
                .toLowerCase();


        if (estado !== "completado") {
            return;
        }


        const mes =
            ordenMeses[
            fecha.getMonth()
            ];


        const tecnico =
            String(
                item.Tecnico ?? ""
            ).trim();


        if (!tecnico) return;


        const diaKey =
            `${fecha.getFullYear()}-` +
            `${String(
                fecha.getMonth() + 1
            ).padStart(2, "0")}-` +
            `${String(
                fecha.getDate()
            ).padStart(2, "0")}`;


        let rgu =
            item.RGU ?? 0;


        if (typeof rgu === "string") {

            rgu =
                rgu
                    .replace(",", ".")
                    .trim();
        }


        const rguNum =
            Number(rgu) || 0;


        if (!agrupar[mes][tecnico]) {

            agrupar[mes][tecnico] = {};
        }


        if (
            !agrupar[mes][tecnico][diaKey]
        ) {

            agrupar[mes][tecnico][diaKey] = 0;
        }


        agrupar[mes][tecnico][diaKey] +=
            rguNum;
    });


    const promedios =
        ordenMeses.map(mes => {

            const tecnicos =
                Object.keys(
                    agrupar[mes]
                );


            if (!tecnicos.length) {
                return null;
            }


            let suma =
                0;


            tecnicos.forEach(tecnico => {

                const dias =
                    Object.keys(
                        agrupar[mes][tecnico]
                    );


                let total =
                    0;


                dias.forEach(dia => {

                    total +=
                        agrupar[mes][tecnico][dia];
                });


                if (dias.length > 0) {

                    suma +=
                        total /
                        dias.length;
                }
            });


            return Number(
                (
                    suma /
                    tecnicos.length
                ).toFixed(1)
            );
        });


    const meta =
        ordenMeses.map(() => 3);


    const canvas =
        document.getElementById(
            "actividadChart"
        );

    if (!canvas) return;


    if (actividadChartInstance) {

        actividadChartInstance.destroy();
    }


    actividadChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: ordenMeses,

                    datasets: [

                        {
                            label:
                                "Promedio General",

                            data:
                                promedios,

                            borderColor:
                                "#172554",

                            backgroundColor:
                                "#172554",

                            borderWidth: 2,

                            tension: 0,

                            spanGaps: true,

                            pointRadius: 3,

                            datalabels: {

                                anchor:
                                    "start",

                                align:
                                    "bottom",

                                offset: 4,

                                color:
                                    "#172554",

                                font: {
                                    weight: "bold",
                                    size: 11,
                                    family:
                                        "Segoe UI, sans-serif"
                                },

                                formatter:
                                    value =>
                                        value !== null
                                            ? value
                                                .toString()
                                                .replace(
                                                    ".",
                                                    ","
                                                )
                                            : ""
                            }
                        },

                        {
                            label: "Meta",

                            data: meta,

                            borderColor:
                                "#facc15",

                            backgroundColor:
                                "#facc15",

                            borderWidth: 1.5,

                            tension: 0,

                            pointRadius: 2.5,

                            datalabels: {
                                display: false
                            }
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color: "#1e293b",
                                padding: 8,

                                font: {
                                    size: 12,
                                    weight: "600",
                                    family:
                                        "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {
                            display: false,
                            beginAtZero: true,
                            grace: "20%"
                        }
                    }
                }
            }
        );
}


// ==========================================
// DURACIÓN
// ==========================================

function crearGraficoDuracion() {

    const agrupar = {};


    ordenMeses.forEach(mes => {

        agrupar[mes] = {
            sumaMinutos: 0,
            conteo: 0
        };
    });


    filteredData.forEach(item => {

        const fecha =
            obtenerFechaObjeto(item);

        if (!fecha) return;


        const mes =
            ordenMeses[
            fecha.getMonth()
            ];


        const estado =
            String(
                item.Estado ?? ""
            )
                .trim()
                .toLowerCase();


        if (estado !== "completado") {
            return;
        }


        const inicio =
            item.Inicio ??
            item.Hora_Inicio;

        const fin =
            item.Fin ??
            item.Hora_Fin;


        const diferencia =
            calcularDiferenciaMinutos(
                inicio,
                fin
            );


        if (
            diferencia !== null &&
            diferencia >= 0 &&
            diferencia < 720
        ) {

            agrupar[mes].sumaMinutos +=
                diferencia;

            agrupar[mes].conteo++;
        }
    });


    const promedios =
        ordenMeses.map(mes => {

            return agrupar[mes].conteo > 0
                ? Math.round(
                    agrupar[mes].sumaMinutos /
                    agrupar[mes].conteo
                )
                : null;
        });


    const canvas =
        document.getElementById(
            "duracionChart"
        );

    if (!canvas) return;


    if (duracionChartInstance) {

        duracionChartInstance.destroy();
    }


    duracionChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: ordenMeses,

                    datasets: [{

                        label:
                            "Minutos Promedio",

                        data:
                            promedios,

                        borderColor:
                            "#1d2a57",

                        backgroundColor:
                            "#1d2a57",

                        borderWidth: 2.5,

                        tension: 0,

                        spanGaps: true,

                        pointRadius: 3,

                        datalabels: {

                            anchor:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "top"
                                        : "bottom",

                            align:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "end"
                                        : "start",

                            offset: 4,

                            color:
                                "#172554",

                            font: {
                                weight: "bold",
                                size: 10,
                                family:
                                    "Segoe UI, sans-serif"
                            },

                            formatter:
                                value => {

                                    if (
                                        value === null ||
                                        value === undefined
                                    ) {
                                        return "";
                                    }


                                    const horas =
                                        Math.floor(
                                            value / 60
                                        );

                                    const minutos =
                                        value % 60;


                                    return (
                                        String(
                                            horas
                                        ).padStart(
                                            2,
                                            "0"
                                        ) +
                                        ":" +
                                        String(
                                            minutos
                                        ).padStart(
                                            2,
                                            "0"
                                        )
                                    );
                                }
                        }
                    }]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color:
                                    "#1e293b",

                                padding: 8,

                                font: {
                                    size: 12,
                                    weight: "600",
                                    family:
                                        "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {
                            display: false,
                            beginAtZero: true,
                            grace: "20%"
                        }
                    }
                }
            }
        );
}


// ==========================================
// MINI GRÁFICO EFECTIVIDAD
// ==========================================

function renderizarMiniGraficoEfectividad(
    completadas,
    noRealizadas
) {

    const canvas =
        document.getElementById(
            "miniEfectividadChart"
        );

    if (!canvas) return;


    if (miniEfectividadChartInstance) {

        miniEfectividadChartInstance.destroy();
    }


    const total =
        completadas +
        noRealizadas;


    const data =
        total > 0
            ? [completadas, noRealizadas]
            : [0, 1];


    const colors =
        total > 0
            ? ["#10b981", "#ef4444"]
            : ["#cbd5e1", "#e2e8f0"];


    miniEfectividadChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "doughnut",

                data: {

                    labels: [
                        "Completadas",
                        "No Realizadas"
                    ],

                    datasets: [{

                        data,

                        backgroundColor:
                            colors,

                        borderWidth: 0
                    }]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "75%",

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {
                            enabled:
                                total > 0
                        },

                        datalabels: {
                            display: false
                        }
                    }
                }
            }
        );
}


// ==========================================
// MINI DURACIÓN
// ==========================================

function renderizarMiniGraficoDuracion() {

    const canvas =
        document.getElementById(
            "miniDuracionChart"
        );

    if (!canvas) return;


    if (miniDuracionChartInstance) {

        miniDuracionChartInstance.destroy();
    }


    const agrupar = {};


    ordenMeses.forEach(mes => {

        agrupar[mes] = {
            sumaMinutos: 0,
            conteo: 0
        };
    });


    filteredData.forEach(item => {

        const fecha =
            obtenerFechaObjeto(item);

        if (!fecha) return;


        const mes =
            ordenMeses[
            fecha.getMonth()
            ];


        const estado =
            String(
                item.Estado ?? ""
            )
                .trim()
                .toLowerCase();


        if (estado !== "completado") {
            return;
        }


        const inicio =
            item.Inicio ??
            item.Hora_Inicio;

        const fin =
            item.Fin ??
            item.Hora_Fin;


        const diferencia =
            calcularDiferenciaMinutos(
                inicio,
                fin
            );


        if (
            diferencia !== null &&
            diferencia >= 0 &&
            diferencia < 720
        ) {

            agrupar[mes].sumaMinutos +=
                diferencia;

            agrupar[mes].conteo++;
        }
    });


    const data =
        ordenMeses.map(mes => {

            return agrupar[mes].conteo > 0
                ? Math.round(
                    agrupar[mes].sumaMinutos /
                    agrupar[mes].conteo
                )
                : 0;
        });


    miniDuracionChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: ordenMeses,

                    datasets: [{

                        data,

                        borderColor:
                            "#3b82f6",

                        borderWidth: 2,

                        pointRadius: 0,

                        tension: 0.3,

                        fill: false
                    }]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {
                            enabled: false
                        },

                        datalabels: {
                            display: false
                        }
                    },

                    scales: {

                        x: {
                            display: false
                        },

                        y: {
                            display: false
                        }
                    }
                }
            }
        );
}


// ==========================================
// EXPORTAR EXCEL
// ==========================================

function descargarExcel() {

    if (
        !filteredData ||
        filteredData.length === 0
    ) {
        return;
    }


    const ws =
        XLSX.utils.json_to_sheet(
            filteredData
        );


    const wb =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Datos_Filtrados"
    );


    XLSX.writeFile(
        wb,
        "Reporte_Actividades_Filtrado.xlsx"
    );
}


// ==========================================
// CAMBIO DE VISTA
// ==========================================

function cambiarVista(
    vista,
    btnElement
) {

    document
        .querySelectorAll(".tab-btn")
        .forEach(btn =>
            btn.classList.remove("active")
        );


    if (btnElement) {

        btnElement.classList.add(
            "active"
        );
    }


    document
        .querySelectorAll(".tab-view")
        .forEach(view =>
            view.classList.add("hidden")
        );


    if (vista === "hoy") {

        document
            .getElementById("viewHoy")
            ?.classList.remove("hidden");

        cargarGraficosHoy();

    }
    else if (vista === "historico") {

        document
            .getElementById("viewHistorico")
            ?.classList.remove("hidden");

    }
    else if (vista === "detalles") {

        document
            .getElementById("viewDetalles")
            ?.classList.remove("hidden");
    }
}


// ==========================================
// DATOS DE HOY
// ==========================================

function cargarGraficosHoy() {

    if (
        !rawData ||
        rawData.length === 0
    ) {
        return;
    }


    const hoy =
        new Date();


    const hoyString =
        `${hoy.getFullYear()}-` +
        `${String(
            hoy.getMonth() + 1
        ).padStart(2, "0")}-` +
        `${String(
            hoy.getDate()
        ).padStart(2, "0")}`;


    const datosHoy =
        rawData.filter(item => {

            const fecha =
                obtenerFechaObjeto(item);

            if (!fecha) {
                return false;
            }


            const fechaString =
                `${fecha.getFullYear()}-` +
                `${String(
                    fecha.getMonth() + 1
                ).padStart(2, "0")}-` +
                `${String(
                    fecha.getDate()
                ).padStart(2, "0")}`;


            return fechaString === hoyString;
        });


    const dataAProcesar =
        datosHoy.length > 0
            ? datosHoy
            : rawData;


    console.log(
        "Datos de hoy:",
        datosHoy.length
    );

    console.log(
        "Datos procesados:",
        dataAProcesar.length
    );
}