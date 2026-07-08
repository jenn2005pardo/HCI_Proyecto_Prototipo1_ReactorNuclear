// Variables de Estado del Reactor
let temperaturaActual = 385;
let nivelRefrigerante = 65;
let pasoActualSecuencia = 1; // Rango del 1 al 5
let tiempoRestante = 30;
let simulacionActiva = true;
let proteccionScramLevantada = false;
let reactorApagadoCompletamente = false;

// Instancias de Intervalos Globales
let intervaloTiempo = null;
let intervaloFluctuacion = null;

// Inicialización del simulador al arrancar
function iniciarSimulador() {
  tiempoRestante = 30;
  pasoActualSecuencia = 1;
  temperaturaActual = 385;
  nivelRefrigerante = 65;
  simulacionActiva = true;
  proteccionScramLevantada = false;
  reactorApagadoCompletamente = false;

  // Resetear componentes visuales de los pasos de la secuencia
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    stepEl.className =
      "shutdown-step border-2 border-outline-variant bg-surface-container-lowest p-4 relative transition-all duration-300";
    const badge = stepEl.querySelector(".step-badge");
    badge.className =
      "step-badge bg-outline-variant text-on-surface-variant px-2 py-1 font-label-caps text-[10px]";
    const btn = stepEl.querySelector("button");
    btn.className =
      "w-full py-2 bg-surface-variant text-on-surface border border-outline font-bold font-label-caps text-[12px] hover:bg-surface-container-high transition-all";
    btn.textContent = obtenerNombreBotonOriginal(i);
    const icon = stepEl.querySelector(".step-icon");
    icon.textContent = obtenerIconoOriginal(i);
    icon.className =
      "step-icon material-symbols-outlined text-on-surface-variant";
  }

  // Activar visualmente el primer paso obligatorio
  actualizarEstiloPasoActivo(1);

  // Resetear Compuerta SCRAM
  const guard = document.getElementById("scram-guard");
  guard.style.transform = "none";
  guard.style.opacity = "1";
  guard.classList.remove("hidden");
  document.getElementById("icono-candado-scram").textContent = "lock";
  document.getElementById("texto-guard-scram").textContent =
    "COMPUERTA DE SEGURIDAD";

  // Ocultar modales flotantes de fin de partida
  document.getElementById("modal-fin").classList.add("hidden");

  // Inicializar Cuenta Regresiva (Test A/B - Regla de 30 segundos)
  if (intervaloTiempo) clearInterval(intervaloTiempo);
  if (intervaloFluctuacion) clearInterval(intervaloFluctuacion);

  intervaloTiempo = setInterval(() => {
    if (!simulacionActiva) return;
    tiempoRestante--;
    document.getElementById("texto-tiempo").textContent = tiempoRestante + "s";
    document.getElementById("barra-tiempo").style.width =
      (tiempoRestante / 30) * 100 + "%";

    if (tiempoRestante <= 0) {
      finalizarSimulacion(
        false,
        "¡EXPLOSIÓN NUCLEAR! El tiempo límite de 30 segundos expiró. El núcleo colapsó catastróficamente y la horda zombie mutó en criaturas radiactivas gigantes.",
      );
    }
  }, 1000);

  // Fluctuación térmica basada en el nivel hidráulico
  intervaloFluctuacion = setInterval(() => {
    if (!simulacionActiva) return;

    if (nivelRefrigerante < 40) {
      temperaturaActual += 4;
    } else if (nivelRefrigerante > 80) {
      temperaturaActual -= 3;
    } else {
      temperaturaActual += Math.random() > 0.5 ? 2 : -1;
    }

    temperaturaActual = Math.round(temperaturaActual);
    actualizarInterfazTermica();
  }, 1500);

  notificarGuia(
    "¡SISTEMA EN RIESGO! Inicie deteniendo las turbinas (Paso 1). Monitoree que el agua no se evapore.",
    "normal",
  );
}

function obtenerNombreBotonOriginal(paso) {
  if (paso === 1) return "FINALIZAR TURBINAS";
  if (paso === 2) return "VENTILAR RADIACIÓN";
  if (paso === 3) return "EQUILIBRAR REFRIGERANTE";
  return "APAGAR REACTOR";
}

function obtenerIconoOriginal(paso) {
  if (paso === 1) return "mode_fan";
  if (paso === 2) return "air";
  if (paso === 3) return "water_damage";
  return "power_off";
}

// Envío y desfogue de agua refrigerante
function actualizarRefrigerante(cambio) {
  if (!simulacionActiva) return;
  nivelRefrigerante = Math.max(0, Math.min(100, nivelRefrigerante + cambio));
  document.getElementById("coolant-fill").style.height =
    nivelRefrigerante + "%";
  document.getElementById("coolant-val").textContent = nivelRefrigerante + "%";

  if (cambio > 0) {
    notificarGuia(
      "Ingresando agua fría al sistema. La temperatura debería descender pronto.",
      "normal",
    );
  } else {
    notificarGuia("Desfogando agua caliente radiactiva al exterior.", "normal");
  }
}

// Monitoreo térmico y reducción a 0 MWe condicionado al apagado (Heurística de Consistencia)
function actualizarInterfazTermica() {
  const tempDisplay = document.getElementById("temp-display");
  const tempBar = document.getElementById("temp-bar");
  const mweDisplay = document.getElementById("mwe-display");

  tempDisplay.textContent = temperaturaActual + "°C";
  const porcentajeBarra = Math.min(100, (temperaturaActual / 500) * 100);
  tempBar.style.width = porcentajeBarra + "%";

  if (reactorApagadoCompletamente) {
    mweDisplay.textContent = "0";
    document.getElementById("mwe-bars").innerHTML = `
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
        `;
  } else {
    let mweCalculados = Math.max(0, Math.round(temperaturaActual * 3.1));
    mweDisplay.textContent = mweCalculados.toLocaleString("es-ES");
  }

  // Heurística de Alerta Dinámica ante picos superiores a 400°C
  if (temperaturaActual > 400 && !reactorApagadoCompletamente) {
    tempDisplay.className =
      "text-error font-data-lg text-display-xl tracking-tighter leading-none animate-pulse";
    tempBar.className =
      "absolute left-0 top-0 h-full bg-error transition-all duration-1000";
    notificarGuia(
      `¡ALERTA CRÍTICA! Temperatura superior a 400°C (${temperaturaActual}°C). Inyecte agua fría o avance la secuencia.`,
      "critico",
    );
  } else {
    tempDisplay.className =
      "text-secondary font-data-lg text-display-xl tracking-tighter leading-none";
    tempBar.className =
      "absolute left-0 top-0 h-full bg-secondary transition-all duration-1000";
  }
}

// Control centralizado de retroalimentación informativa (Heurísticas de Ayuda y Diagnóstico)
function notificarGuia(mensaje, tipo) {
  const contenedor = document.getElementById("contenedor-alerta");
  const texto = document.getElementById("texto-alerta");
  const sugerencia = document.getElementById("sugerencia-alerta");

  texto.textContent = mensaje.toUpperCase();

  if (tipo === "critico") {
    contenedor.className =
      "flex-1 bg-error-container border border-error p-3 rounded overflow-y-auto strobe-critical";
    sugerencia.className =
      "mt-2 pt-2 border-t border-on-error/20 font-body-md text-[11px] text-white font-bold";
    sugerencia.textContent =
      "SOLUCIÓN INMEDIATA: Ejecute el paso iluminado en naranja o inyecte agua fría urgentemente.";
  } else if (tipo === "error-secuencia") {
    contenedor.className =
      "flex-1 bg-yellow-950 border-2 border-yellow-500 p-3 rounded overflow-y-auto";
    sugerencia.className =
      "mt-2 pt-2 border-t border-yellow-500/30 font-body-md text-[11px] text-yellow-400 font-bold";
    sugerencia.textContent = `ACCIÓN REQUERIDA: Concéntrese en solucionar el Paso ${pasoActualSecuencia} antes de avanzar.`;
  } else {
    contenedor.className =
      "flex-1 bg-surface-container-high border border-outline-variant p-3 rounded overflow-y-auto";
    sugerencia.className =
      "mt-2 pt-2 border-t border-outline-variant font-body-md text-[11px] text-secondary";
    sugerencia.textContent = `Progreso actual: Paso ${pasoActualSecuencia} de 5 en ejecución.`;
  }
}

// Ejecución secuencial controlada (Heurística de Prevención de Erreores)
function ejecutarPaso(numeroPaso) {
  if (!simulacionActiva) return;

  if (numeroPaso !== pasoActualSecuencia) {
    explicarErrorDeSecuencia(numeroPaso);
    return;
  }

  const pasoEl = document.getElementById(`step-${numeroPaso}`);
  pasoEl.className =
    "shutdown-step border-2 border-green-500 bg-green-500/10 p-4 relative transition-all duration-300";

  const badge = pasoEl.querySelector(".step-badge");
  badge.className =
    "step-badge bg-green-500 text-black px-2 py-1 font-label-caps text-[10px] font-bold";

  const btn = pasoEl.querySelector("button");
  btn.className =
    "w-full py-2 bg-green-500/20 text-green-400 font-bold font-label-caps text-[12px] cursor-default border border-green-500/40";
  btn.textContent = "COMPLETADO ✓";

  const icon = pasoEl.querySelector(".step-icon");
  icon.textContent = "check_circle";
  icon.className = "step-icon material-symbols-outlined text-green-500";

  if (numeroPaso === 1) {
    notificarGuia(
      "Paso 1 Completado: Turbinas eléctricas desacopladas con éxito. Proceda al Paso 2.",
      "normal",
    );
    pasoActualSecuencia = 2;
    actualizarEstiloPasoActivo(2);
  } else if (numeroPaso === 2) {
    notificarGuia(
      "Paso 2 Completado: Válvulas de ventilación abiertas. Contenido radiactivo siberiano disipado. Proceda al Paso 3.",
      "normal",
    );
    pasoActualSecuencia = 3;
    actualizarEstiloPasoActivo(3);
  } else if (numeroPaso === 3) {
    nivelRefrigerante = 50;
    document.getElementById("coolant-fill").style.height = "50%";
    document.getElementById("coolant-val").textContent = "50%";
    notificarGuia(
      "Paso 3 Completado: Evacuación e ingreso de agua fría realizada a niveles óptimos (50%). Proceda al Paso 4.",
      "normal",
    );
    pasoActualSecuencia = 4;
    actualizarEstiloPasoActivo(4);
  } else if (numeroPaso === 4) {
    reactorApagadoCompletamente = true;
    temperaturaActual = 45;
    actualizarInterfazTermica();
    document.getElementById("estado-secuencia").textContent =
      "ESTADO: REACTOR APAGADO - LISTO PARA SCRAM";
    document.getElementById("estado-secuencia").className =
      "font-label-caps text-[10px] text-green-400 font-bold";

    notificarGuia(
      "Paso 4 Completado: Reacción nuclear en cadena neutralizada. ¡RÁPIDO! Remueva la compuerta de seguridad física abajo a la derecha y presione el botón rojo SCRAM final.",
      "normal",
    );
    pasoActualSecuencia = 5;

    document.getElementById("icono-candado-scram").textContent = "lock_open";
    document.getElementById("texto-guard-scram").innerHTML =
      "<span class='text-green-400'>COMPUERTA LIBERADA</span>";
  }
}

function actualizarEstiloPasoActivo(paso) {
  document.getElementById("estado-secuencia").textContent =
    `ESTADO: EJECUTANDO PASO ${paso}`;
  const pasoEl = document.getElementById(`step-${paso}`);
  pasoEl.className =
    "shutdown-step border-2 border-secondary bg-surface-container-highest p-4 relative transition-all duration-300 shadow-[0_0_15px_rgba(238,152,0,0.2)]";
  const badge = pasoEl.querySelector(".step-badge");
  badge.className =
    "step-badge bg-secondary text-on-secondary px-2 py-1 font-label-caps text-[10px] font-bold";
}

// Explicación de errores contextual solicitada (Heurística 9)
function explicarErrorDeSecuencia(pasoIntentado) {
  let mensajeExplicativo = "";

  if (pasoIntentado === 4) {
    switch (pasoActualSecuencia) {
      case 1:
        mensajeExplicativo =
          "No puede apagar el reactor todavía porque las turbinas siguen girando a alta velocidad. Peligro de retroalimentación destructiva. Primero debe finalizar el 'PASO 1: DETENER TURBINAS'.";
        break;
      case 2:
        mensajeExplicativo =
          "Acción denegada: La presión de gases radiactivos acumulados es demasiado alta para apagar el reactor de golpe. Debe aliviar el sistema completando primero el 'PASO 2: VENTILAR CONTENIDO'.";
        break;
      case 3:
        mensajeExplicativo =
          "Imposible apagar el reactor: El agua interna está en un punto crítico de ebullición sin renovación térmica. Debe completar el 'PASO 3: EVACUAR E INGRESAR AGUA' para enfriar las barras estabilizadoras primero.";
        break;
    }
  } else {
    if (pasoIntentado > pasoActualSecuencia) {
      mensajeExplicativo = `Intento de ejecución inválido. Está tratando de realizar el Paso ${pasoIntentado}, pero el orden de ingeniería exige completar primero el Paso ${pasoActualSecuencia}.`;
    } else {
      mensajeExplicativo = `El Paso ${pasoIntentado} ya fue completado con anterioridad y se encuentra sellado. Su enfoque actual debe ser el Paso ${pasoActualSecuencia}.`;
    }
  }

  notificarGuia(mensajeExplicativo, "error-secuencia");

  const contenedorErroneo = document.getElementById(`step-${pasoIntentado}`);
  contenedorErroneo.classList.add("border-red-500", "bg-red-950/30");
  setTimeout(() => {
    contenedorErroneo.classList.remove("border-red-500", "bg-red-950/30");
  }, 800);
}

// Apertura controlada de la compuerta SCRAM
function levantarProteccionGuard() {
  if (pasoActualSecuencia < 5) {
    notificarGuia(
      "ERROR DE SEGURIDAD INTERNA: La compuerta mecánica del SCRAM está bloqueada por electroimanes. No se puede levantar hasta que apague el reactor en el Paso 4.",
      "error-secuencia",
    );
    return;
  }

  const guard = document.getElementById("scram-guard");
  guard.style.transform = "translateY(-120%) rotateX(90deg)";
  guard.style.opacity = "0";
  proteccionScramLevantada = true;
  setTimeout(() => {
    guard.classList.add("hidden");
  }, 500);
  notificarGuia(
    "Compuerta de protección física levantada. El botón de parada de emergencia SCRAM está totalmente expuesto. ¡PRESIONELO!",
    "normal",
  );
}

function intentarScramDirecto() {
  if (pasoActualSecuencia < 5) {
    notificarGuia(
      "SISTEMA BLOQUEADO: El protocolo SCRAM requiere mitigación secuencial previa. Si apaga todo sin ventilar ni detener turbinas, la acumulación térmica estallará el Sector 7.",
      "error-secuencia",
    );
  } else if (!proteccionScramLevantada) {
    levantarProteccionGuard();
  } else {
    ejecutarScramFinal();
  }
}

function ejecutarScramFinal() {
  if (!simulacionActiva) return;

  if (pasoActualSecuencia < 5) {
    notificarGuia(
      "ACCIÓN CANCELADA: El botón SCRAM está desactivado hasta que complete los 4 pasos previos de la secuencia de apagado en orden.",
      "error-secuencia",
    );
    return;
  }

  if (!proteccionScramLevantada) {
    notificarGuia(
      "Debe hacer clic primero en la compuerta de seguridad física para poder pulsar el botón SCRAM.",
      "error-secuencia",
    );
    return;
  }

  finalizarSimulacion(
    true,
    `¡SISTEMA SALVADO CON ÉXITO! El operador completó la secuencia en ${30 - tiempoRestante} segundos. El núcleo nuclear está en parada segura a 0 MWe, previniendo la catástrofe de criaturas radiactivas zombies. ¡Excelente trabajo de usabilidad bajo presión!`,
  );
}

function finalizarSimulacion(exito, descripcion) {
  simulacionActiva = false;
  clearInterval(intervaloTiempo);
  clearInterval(intervaloFluctuacion);

  const modal = document.getElementById("modal-fin");
  const contenido = document.getElementById("modal-contenido");
  const titulo = document.getElementById("modal-titulo");
  const desc = document.getElementById("modal-descripcion");

  modal.classList.remove("hidden");
  desc.textContent = descripcion;

  if (exito) {
    titulo.textContent = "✔ SECUENCIA COMPLETA";
    titulo.className =
      "font-headline-lg text-2xl uppercase tracking-tighter mb-4 text-green-500 font-bold";
    contenido.className =
      "bg-surface-container-high border-4 border-green-500 p-8 max-w-md w-full text-center rounded shadow-2xl";

    document.getElementById("estado-ping").className =
      "w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]";
    document.getElementById("estado-texto").textContent =
      "REACTOR APAGADO SEGURO";
    reactorApagadoCompletamente = true;
    actualizarInterfazTermica();
  } else {
    titulo.textContent = "☠ ACCIDENTE NUCLEAR";
    titulo.className =
      "font-headline-lg text-2xl uppercase tracking-tighter mb-4 text-error font-bold";
    contenido.className =
      "bg-surface-container-high border-4 border-error p-8 max-w-md w-full text-center rounded shadow-2xl animate-bounce";

    document.getElementById("estado-ping").className =
      "w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]";
    document.getElementById("estado-texto").textContent = "NÚCLEO DESTRUIDO";
  }
}

function reiniciarSimulacion() {
  iniciarSimulador();
}

// Enlace de arranque del script con la ventana
window.onload = iniciarSimulador;
