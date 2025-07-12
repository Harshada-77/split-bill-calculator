let participants = [];
let expenses = [];

function addParticipant() {
  const name = prompt("Enter participant name:");
  if (name && !participants.includes(name)) {
    participants.push(name.trim());
    renderParticipants();
  } else if (participants.includes(name)) {
    alert("Participant already added.");
  }
}

function renderParticipants() {
  const container = document.getElementById("participants");
  container.innerHTML = "";
  participants.forEach(p => {
    const div = document.createElement("div");
    div.textContent = "👤 " + p;
    container.appendChild(div);
  });
}

function addExpense(event) {
  event.preventDefault();
  const payer = document.getElementById("payer").value.trim();
  const amount = parseFloat(document.getElementById("amount").value.trim());
  const description = document.getElementById("description").value.trim();
  const sharedWithRaw = document.getElementById("sharedWith").value.trim();

  if (!participants.includes(payer)) {
    alert("Payer must be a participant!");
    return;
  }

  let sharedWith = sharedWithRaw.split(",").map(p => p.trim()).filter(p => participants.includes(p));

  if (!sharedWith.includes(payer)) {
    sharedWith.push(payer); // auto-include payer
  }

  if (sharedWith.length === 0) {
    alert("No valid participants found in sharedWith.");
    return;
  }

  expenses.push({ payer, amount, description, sharedWith });
  renderExpenses();
  calculateBalances();

  document.getElementById("expenseForm").reset();
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  expenses.forEach(e => {
    const li = document.createElement("li");
    li.textContent = `${e.payer} paid ₹${e.amount} for "${e.description}", shared with: ${e.sharedWith.join(", ")}`;
    list.appendChild(li);
  });
}

function calculateBalances() {
  let balanceMap = {};

  participants.forEach(p => balanceMap[p] = 0);

  expenses.forEach(({ payer, amount, sharedWith }) => {
    const share = amount / sharedWith.length;

    sharedWith.forEach(person => {
      if (person === payer) {
        balanceMap[payer] += amount - share; // payer paid full, owes only their share
      } else {
        balanceMap[person] -= share; // others owe their share
      }
    });
  });

  const result = settleDebts(balanceMap);
  renderBalanceSheet(result);
}

function settleDebts(balanceMap) {
  const creditors = [];
  const debtors = [];

  for (const person in balanceMap) {
    const amt = balanceMap[person];
    if (amt > 0.01) creditors.push({ person, amt });
    else if (amt < -0.01) debtors.push({ person, amt: -amt });
  }

  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const transactions = [];

  while (creditors.length && debtors.length) {
    const cred = creditors[0];
    const debt = debtors[0];
    const settled = Math.min(cred.amt, debt.amt);

    transactions.push(`${debt.person} owes ${cred.person} ₹${settled.toFixed(2)}`);

    cred.amt -= settled;
    debt.amt -= settled;

    if (cred.amt < 0.01) creditors.shift();
    if (debt.amt < 0.01) debtors.shift();
  }

  return transactions;
}

function renderBalanceSheet(transactions) {
  const div = document.getElementById("balanceSheet");
  div.innerHTML = transactions.length
    ? transactions.map(t => `<p>🔁 ${t}</p>`).join("")
    : `<p>✅ All Settled!</p>`;
}

function exportSummary() {
  const summary = document.getElementById("balanceSheet").innerText;
  const blob = new Blob([summary], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "split-bill-summary.txt";
  a.click();
}
