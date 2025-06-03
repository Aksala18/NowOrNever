// Firebase is already initialized in the HTML file
// We just need to import the functions we need
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";

// Get the database instance (Firebase app is already initialized in HTML)
const db = getDatabase();

// Elementos DOM
const createBtn         = document.getElementById("createCalendarBtn");
const joinBtn           = document.getElementById("joinCalendarBtn");
const calendarNameInput = document.getElementById("calendarName");
const calendarIdInput   = document.getElementById("calendarIdInput");

const menuDiv            = document.getElementById("menu");
const calendarAppDiv     = document.getElementById("calendarApp");
const calendarTitle      = document.getElementById("calendarTitle");
const userNameInput      = document.getElementById("userNameInput");
const userColorInput     = document.getElementById("userColorInput");
const calendarContainer  = document.getElementById("calendarContainer");
const saveSelectionsBtn  = document.getElementById("saveSelectionsBtn");
const backToMenuBtn      = document.getElementById("backToMenuBtn");

// Estado atual do calendário
let currentCalendar = null; 
// Estrutura: { id, name, months: [1,2,…], selections: { "2025-6-10": [{name,color},…], … } }

function generateId(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function saveCalendar() {
  if (!currentCalendar) return;
  const calendarRef = ref(db, 'calendars/' + currentCalendar.id);
  set(calendarRef, currentCalendar)
    .then(() => {
      console.log("Calendar saved to Firebase:", currentCalendar.id);
    })
    .catch((error) => {
      console.error("Error saving calendar:", error);
      alert("Erro ao guardar o calendário. Verifica a tua ligação à internet.");
    });
}

async function loadCalendar(id) {
  const calendarRef = ref(db, 'calendars/' + id);
  try {
    const snapshot = await get(calendarRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading calendar:", error);
    alert("Erro ao carregar o calendário. Verifica a tua ligação à internet.");
    return null;
  }
}

function showMenu() {
  menuDiv.style.display        = "block";
  calendarAppDiv.style.display = "none";
  calendarTitle.textContent    = "";
  calendarContainer.innerHTML  = "";
  userNameInput.value          = "";
  calendarIdInput.value        = "";
  calendarNameInput.value      = "";
  currentCalendar = null;
}

function showCalendarApp() {
  menuDiv.style.display        = "none";
  calendarAppDiv.style.display = "block";
  calendarTitle.textContent    = currentCalendar.name;
  document.getElementById("calendarId").textContent = `ID: ${currentCalendar.id}`;
  renderCalendars();
}

// --- Renderiza cada mês selecionado (um abaixo do outro) ---
function renderCalendars() {
  calendarContainer.innerHTML = "";
  const year = new Date().getFullYear();

  const selectedMonths = currentCalendar.months; 
  if (!selectedMonths || selectedMonths.length === 0) {
    calendarContainer.textContent = "Nenhum mês selecionado.";
    return;
  }

  selectedMonths.forEach(month => {
    // Título do mês
    const monthTitle = document.createElement("h3");
    monthTitle.textContent = new Date(year, month - 1)
      .toLocaleString("pt-PT", { month: "long" });
    calendarContainer.appendChild(monthTitle);

    // Grid de dias
    const totalDays = new Date(year, month, 0).getDate();
    const monthGrid = document.createElement("div");
    monthGrid.classList.add("month-grid");

    for (let day = 1; day <= totalDays; day++) {
      const dayEl = document.createElement("div");
      dayEl.classList.add("day");
      dayEl.textContent = day;

      const key = `${year}-${month}-${day}`;

      if (currentCalendar.selections[key] && currentCalendar.selections[key].length > 0) {
        const usersHere = currentCalendar.selections[key];
        dayEl.style.background = "";
        dayEl.style.backgroundColor = "";
        if (usersHere.length === 1) {
          dayEl.style.backgroundColor = usersHere[0].color;
        } else {
          const colors = usersHere.map(u => u.color);
          dayEl.style.background = `linear-gradient(45deg, ${colors.join(', ')})`;
        }
        dayEl.title = usersHere.map(u => u.name).join(", ");
        dayEl.classList.add('selected');
      } else {
        dayEl.style.background = "";
        dayEl.style.backgroundColor = "";
        dayEl.title = "";
        dayEl.classList.remove('selected');
      }

      dayEl.addEventListener("click", () => {
        const userName  = userNameInput.value.trim();
        const userColor = userColorInput.value;

        if (!userName) {
          alert("Por favor, escreve o teu nome!");
          return;
        }

        if (!currentCalendar.selections[key]) {
          currentCalendar.selections[key] = [];
        }

        const index = currentCalendar.selections[key].findIndex(u => u.name === userName);

        if (index === -1) {
          currentCalendar.selections[key].push({ name: userName, color: userColor });
        } else {
          currentCalendar.selections[key].splice(index, 1);
          if (currentCalendar.selections[key].length === 0) {
            delete currentCalendar.selections[key];
          }
        }

        saveCalendar();
        renderCalendars();
      });

      monthGrid.appendChild(dayEl);
    }

    calendarContainer.appendChild(monthGrid);
  });
}

// --- Handlers de botões ---
createBtn.addEventListener("click", () => {
  const name = calendarNameInput.value.trim();
  if (!name) {
    alert("Escreve um nome para o calendário");
    return;
  }

  const checkedBoxes = Array.from(
    document.querySelectorAll("#monthCheckboxes input[type=checkbox]:checked")
  );
  if (checkedBoxes.length === 0) {
    alert("Seleciona pelo menos um mês");
    return;
  }

  const months = checkedBoxes.map(cb => parseInt(cb.value));
  const id = generateId();

  currentCalendar = {
    id,
    name,
    months,
    selections: {}
  };

  saveCalendar();
  showCalendarApp();
  alert(`Calendário criado! ID: ${id}\nPartilha este ID com os teus amigos.`);
});

joinBtn.addEventListener("click", async () => {
  const id = calendarIdInput.value.trim().toUpperCase();
  if (!id) {
    alert("Escreve o ID do calendário");
    return;
  }

  const cal = await loadCalendar(id);
  if (!cal) {
    alert("Calendário não encontrado");
    return;
  }

  currentCalendar = cal;
  showCalendarApp();
});

saveSelectionsBtn.addEventListener("click", () => {
  saveCalendar();
  alert("Disponibilidade guardada!");
});

backToMenuBtn.addEventListener("click", () => {
  saveCalendar();
  showMenu();
});

// Ao carregar a página, mostrar menu inicial
showMenu();