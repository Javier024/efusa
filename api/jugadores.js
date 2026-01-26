const tabla = document.getElementById("tabla-jugadores");

async function cargarJugadores() {
  const res = await fetch("/api/jugadores");
  const jugadores = await res.json();

  tabla.innerHTML = "";

  jugadores.forEach(j => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${j.nombre}</td>
      <td>${j.categoria}</td>
      <td>$${j.mensualidad}</td>
      <td>${j.nombre_acudiente}</td>
      <td>${j.telefono}</td>
      <td>
        <button onclick="eliminarJugador(${j.id})">❌</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
}

cargarJugadores();
