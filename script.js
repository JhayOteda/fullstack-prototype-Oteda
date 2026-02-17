const STORAGE_KEY = "ipt_demo_v2";
let currentUser = null;

let isEditingEmployee = false;
let isEditingDepartment = false;
let editingDepartmentId = null;

let isEditingAccount = false;
let editingAccountEmail = null;

window.db = { accounts: [], departments: [], employees: [], requests: [] };

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data) throw "seed";
        window.db = data;
        
        if(!window.db.employees) window.db.employees = [];
        if(!window.db.requests) window.db.requests = [];
        if(!window.db.departments) window.db.departments = [];
        
    } catch {
       
        window.db.accounts = [{
            first: "Admin", last: "User", email: "admin@example.com", 
            password: "Password123!", role: "admin", verified: true
        }];

        window.db.departments = [
            { id: 1, name: "Engineering", description: "Software team" },
            { id: 2, name: "HR", description: "Human Resources" }
        ];
        
        saveToStorage();
    }
}

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || "#/";

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const protectedRoutes = ["#/profile", "#/accounts", "#/employees", "#/departments", "#/requests"];
    const adminRoutes = ["#/accounts", "#/employees", "#/departments"];

    if (!currentUser && protectedRoutes.includes(hash)) {
        navigateTo("#/login");
        return;
    }

    if (currentUser && currentUser.role !== "admin" && adminRoutes.includes(hash)) {
        navigateTo("#/");
        return;
    }

    const routes = {
        "#/": "home-page",
        "#/login": "login-page",
        "#/register": "register-page",
        "#/verify-email": "verify-email-page",
        "#/profile": "profile-page",
        "#/accounts": "accounts-page",
        "#/departments": "departments-page",
        "#/employees": "employees-page",
        "#/requests": "requests-page"
    };

    const pageId = routes[hash];
    if (pageId) document.getElementById(pageId).classList.add("active");

    if (hash === "#/profile") renderProfile();
    if (hash === "#/requests") renderRequests();
    
    if (hash === "#/employees") {
        isEditingEmployee = false;
        renderEmployees();
    }
    
    if (hash === "#/departments") {
        isEditingDepartment = false;
        editingDepartmentId = null;
        renderDepartments();
    }

    if (hash === "#/accounts") {
        isEditingAccount = false;
        editingAccountEmail = null;
        renderAccounts();
    }

    if (hash === "#/verify-email") {
        const email = localStorage.getItem("unverified_email");
        if (email) document.getElementById("verifyMessage").textContent = `Verification sent to ${email}`;
    }
}

window.addEventListener("hashchange", handleRouting);

function setAuthState(isAuth, user = null) {
    document.body.classList.toggle("authenticated", isAuth);
    document.body.classList.toggle("not-authenticated", !isAuth);
    document.body.classList.toggle("is-admin", user?.role === "admin");
    currentUser = user;
    if (user) document.getElementById("nav-username").textContent = user.first;
}

function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    navigateTo("#/");
}

document.getElementById("registerForm").onsubmit = function (e) {
    e.preventDefault();
    const [first, last, email, password] = [...e.target.elements].map(el => el.value.trim());

    if (password.length < 6) { alert("Password must be at least 6 characters"); return; }
    if (window.db.accounts.find(acc => acc.email === email)) { alert("Email already exists"); return; }

    window.db.accounts.push({ first, last, email, password, role: "user", verified: false });
    localStorage.setItem("unverified_email", email);
    saveToStorage();
    e.target.reset();
    navigateTo("#/verify-email");
};

function verifyEmail() {
    const email = localStorage.getItem("unverified_email");
    if (!email) return;
    const user = window.db.accounts.find(acc => acc.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem("unverified_email");
        alert("Email successfully verified!");
        navigateTo("#/login");
    }
}

document.getElementById("loginForm").onsubmit = function (e) {
    e.preventDefault();
    const [email, password] = [...e.target.elements].map(el => el.value.trim());
    const user = window.db.accounts.find(acc => acc.email === email && acc.password === password && acc.verified);

    if (!user) { alert("Invalid login credentials or email not verified"); return; }

    localStorage.setItem("auth_token", email);
    setAuthState(true, user);
    e.target.reset();
    navigateTo("#/profile");
};

let isEditingProfile = false;

function renderProfile() {
    const profileContainer = document.getElementById("profile-page");

    if (!currentUser) return;

    if (isEditingProfile) {

        profileContainer.innerHTML = `
            <h2>Edit Profile</h2>
            <div class="card p-4 shadow-sm">
                <form onsubmit="saveProfile(event)">
                    <div class="mb-3">
                        <label class="form-label"><strong>First Name</strong></label>
                        <input type="text" id="profileFirst" class="form-control" value="${currentUser.first}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><strong>Last Name</strong></label>
                        <input type="text" id="profileLast" class="form-control" value="${currentUser.last}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><strong>Email</strong></label>
                        <input type="email" id="profileEmail" class="form-control" value="${currentUser.email}" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary ms-2" onclick="cancelEditProfile()">Cancel</button>
                </form>
            </div>
        `;
    } else {
        
        profileContainer.innerHTML = `
    <h2>Profile</h2>
    <div class="card p-4 shadow-sm">
        <p><strong>Name:</strong> ${currentUser.first} ${currentUser.last}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> <span class="badge bg-secondary text-capitalize">${currentUser.role}</span></p>
        
        <button type="button" 
                class="btn btn-outline-primary btn-sm mt-2" 
                style="width: fit-content;" 
                onclick="editProfile()">
            <strong>Edit Profile</strong>
        </button>
    </div>
`;
    }
}

function editProfile() {
    isEditingProfile = true;
    renderProfile();
}

function cancelEditProfile() {
    isEditingProfile = false;
    renderProfile();
}

function saveProfile(e) {
    e.preventDefault();
    const first = document.getElementById("profileFirst").value.trim();
    const last = document.getElementById("profileLast").value.trim();
    const email = document.getElementById("profileEmail").value.trim();

    if (!first || !last || !email) {
        alert("All fields are required.");
        return;
    }

    
    const existing = window.db.accounts.find(acc => acc.email === email && acc.email !== currentUser.email);
    if (existing) {
        alert("Email already exists.");
        return;
    }

    currentUser.first = first;
    currentUser.last = last;
    currentUser.email = email;

    
    localStorage.setItem("auth_token", email);

    saveToStorage();
    isEditingProfile = false;
    renderProfile();
    setAuthState(true, currentUser);
}


let requestItems = [];

function renderRequests() {
    const container = document.getElementById("requests-page");

    const myRequests = window.db.requests.filter(
        r => r.userEmail === currentUser.email
    );

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>My Requests</h2>
            <button class="btn btn-success" onclick="openRequestModal()">+ New Request</button>
        </div>

        ${myRequests.length === 0 ? `
            <p class="text-muted">You have no requests yet.</p>
            <button class="btn btn-success" onclick="openRequestModal()">Create One</button>
        ` : `
            <div class="list-group mt-3">
                ${myRequests.map(req => `
                    <div class="list-group-item">
                        <div class="fw-bold">${req.type}</div>
                        <ul>
                            ${req.items.map(it => `
                                <li>${it.name} (Qty: ${it.qty})</li>
                            `).join("")}
                        </ul>
                        <span class="badge bg-info">${req.status}</span>
                    </div>
                `).join("")}
            </div>
        `}

        ${renderRequestModal()}
    `;
}

function renderRequestModal() {
    requestItems = [{ name: "", qty: 1 }];

    return `
        <div class="modal fade" id="requestModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-header">
                        <h5 class="modal-title">New Request</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Type</label>
                            <input id="reqType" class="form-control" placeholder="Equipment">
                        </div>

                        <label class="form-label">Items</label>
                        <div id="itemsContainer"></div>

                        <button class="btn btn-outline-success btn-sm mt-2"
                            onclick="addRequestItem()">+ Add Item</button>
                    </div>

                    <div class="modal-footer">
                        <button type="button"
                            class="btn btn-primary"
                            onclick="submitRequest()">Submit Request</button>
                    </div>

                </div>
            </div>
        </div>
    `;
}


function openRequestModal() {
    renderRequestItems();
    const modal = new bootstrap.Modal(
        document.getElementById("requestModal")
    );
    modal.show();
}

function addRequestItem() {
    requestItems.push({ name: "", qty: 1 });
    renderRequestItems();
}

function removeRequestItem(index) {
    requestItems.splice(index, 1);
    renderRequestItems();
}

function renderRequestItems() {
    const container = document.getElementById("itemsContainer");
    if (!container) return;

    container.innerHTML = requestItems.map((item, i) => `
        <div class="input-group mb-2">
            <input class="form-control"
                placeholder="Item name"
                value="${item.name}"
                oninput="requestItems[${i}].name = this.value">

            <input type="number"
                class="form-control"
                style="max-width:80px"
                min="1"
                value="${item.qty}"
                oninput="requestItems[${i}].qty = this.value">

            <button class="btn btn-outline-danger"
                onclick="removeRequestItem(${i})">×</button>
        </div>
    `).join("");
}


function submitRequest() {
    const type = document.getElementById("reqType")?.value.trim();

    if (!type) {
        alert("Request type is required.");
        return;
    }

    if (requestItems.length === 0) {
        alert("Please add at least one item.");
        return;
    }

    for (let item of requestItems) {
        if (!item.name.trim()) {
            alert("Item name cannot be empty.");
            return;
        }
    }

    window.db.requests.push({
        userEmail: currentUser.email,
        type: type,
        items: requestItems,
        status: "Pending"
    });

    saveToStorage();

    const modalEl = document.getElementById("requestModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    renderRequests();
}

function renderAccounts() {
    const container = document.getElementById("accounts-page");
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Accounts</h2>
            ${!isEditingAccount ? `<button class="btn btn-success" onclick="showAddAccountForm()">+ Add Account</button>` : ''}
        </div>

        <div style="display: ${isEditingAccount ? 'none' : 'block'}">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${window.db.accounts.map(acc => `
                        <tr>
                            <td>${acc.first} ${acc.last}</td>
                            <td>${acc.email}</td>
                            <td>${acc.role === 'admin' ? 'Admin' : 'User'}</td>
                            <td>${acc.verified ? '<span class="verified-check">✓</span>' : '<span class="text-muted">No</span>'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="editAccount('${acc.email}')"><strong>Edit</strong></button>
                                <button class="btn btn-sm btn-outline-warning me-1" onclick="alert('Reset Password logic here')"><strong>Reset Password</strong></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${acc.email}')"><strong>Delete</strong</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="card shadow-sm" style="display: ${isEditingAccount ? 'block' : 'none'}">
            <div class="card-header bg-white fw-bold">Add/Edit Account</div>
            <div class="card-body">
                <form onsubmit="saveAccount(event)">
                    <div class="mb-3">
                        <label class="form-label">First Name</label>
                        <input type="text" id="accFirst" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Last Name</label>
                        <input type="text" id="accLast" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" id="accEmail" class="form-control" required ${editingAccountEmail ? 'disabled' : ''}>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Password</label>
                        <input type="password" id="accPass" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Role</label>
                        <select id="accRole" class="form-select">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="accVerified">
                        <label class="form-check-label" for="accVerified">Verified</label>
                    </div>
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary ms-2" onclick="cancelEditAccount()">Cancel</button>
                </form>
            </div>
        </div>
    `;
}

function showAddAccountForm() {
    isEditingAccount = true;
    editingAccountEmail = null;
    renderAccounts();
}

function editAccount(email) {
    isEditingAccount = true;
    editingAccountEmail = email;
    renderAccounts();
    
    const acc = window.db.accounts.find(a => a.email === email);
    if(acc) {
        document.getElementById("accFirst").value = acc.first;
        document.getElementById("accLast").value = acc.last;
        document.getElementById("accEmail").value = acc.email;
        document.getElementById("accPass").value = acc.password;
        document.getElementById("accRole").value = acc.role;
        document.getElementById("accVerified").checked = acc.verified;
    }
}

function cancelEditAccount() {
    isEditingAccount = false;
    editingAccountEmail = null;
    renderAccounts();
}

function saveAccount(e) {
    e.preventDefault();
    const first = document.getElementById("accFirst").value;
    const last = document.getElementById("accLast").value;
    const email = document.getElementById("accEmail").value;
    const password = document.getElementById("accPass").value;
    const role = document.getElementById("accRole").value;
    const verified = document.getElementById("accVerified").checked;

    if (editingAccountEmail) {
        
        const acc = window.db.accounts.find(a => a.email === editingAccountEmail);
        if(acc) {
            acc.first = first; acc.last = last; acc.password = password;
            acc.role = role; acc.verified = verified;
        }
    } else {
        
        if(window.db.accounts.find(a => a.email === email)) {
            alert("Email already exists!");
            return;
        }
        window.db.accounts.push({ first, last, email, password, role, verified });
    }
    
    saveToStorage();
    cancelEditAccount();
}

function deleteAccount(email) {
    if(confirm(`Are you sure you want to delete account ${email}?`)) {
        window.db.accounts = window.db.accounts.filter(a => a.email !== email);
        saveToStorage();
        renderAccounts();
    }
}


function renderDepartments() {
    const container = document.getElementById("departments-page");
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Departments</h2>
            ${!isEditingDepartment ? `<button class="btn btn-success" onclick="showAddDepartmentForm()">+ Add Department</button>` : ''}
        </div>
        <div style="display: ${isEditingDepartment ? 'none' : 'block'}">
             <table class="table table-striped align-middle">
                <thead><tr><th style="width: 30%">Name</th><th style="width: 40%">Description</th><th style="width: 30%">Actions</th></tr></thead>
                <tbody>
                    ${window.db.departments.map(dept => `
                    <tr>
                        <td class="fw-bold">${dept.name}</td>
                        <td>${dept.description || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editDepartment(${dept.id})"><strong>Edit</strong></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${dept.id})"><strong>Delete</strong></button>
                        </td>
                    </tr>`).join("")}
                </tbody>
            </table>
        </div>
        <div class="card shadow-sm" style="display: ${isEditingDepartment ? 'block' : 'none'}">
            <div class="card-header bg-white fw-bold">${editingDepartmentId ? 'Edit Department' : 'Add Department'}</div>
            <div class="card-body">
                <form onsubmit="saveDepartment(event)">
                    <div class="mb-3"><label class="form-label">Name</label><input type="text" id="deptName" class="form-control" required></div>
                    <div class="mb-3"><label class="form-label">Description</label><input type="text" id="deptDesc" class="form-control" required></div>
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary ms-2" onclick="cancelEditDepartment()">Cancel</button>
                </form>
            </div>
        </div>`;
}

function showAddDepartmentForm() { isEditingDepartment = true; editingDepartmentId = null; renderDepartments(); }

function editDepartment(id) {
    isEditingDepartment = true; editingDepartmentId = id; renderDepartments();
    const dept = window.db.departments.find(d => d.id === id);
    if (dept) { document.getElementById("deptName").value = dept.name; document.getElementById("deptDesc").value = dept.description || ""; }
}

function cancelEditDepartment() { isEditingDepartment = false; editingDepartmentId = null; renderDepartments(); }

function saveDepartment(e) {
    e.preventDefault();
    const name = document.getElementById("deptName").value.trim();
    const desc = document.getElementById("deptDesc").value.trim();
    if (editingDepartmentId) {
        const dept = window.db.departments.find(d => d.id === editingDepartmentId);
        if (dept) { dept.name = name; dept.description = desc; }
    } else {
        window.db.departments.push({ id: Date.now(), name: name, description: desc });
    }
    saveToStorage();
    cancelEditDepartment();
}

function deleteDepartment(id) {
    if (confirm("Are you sure?")) {
        window.db.departments = window.db.departments.filter(d => d.id !== id);
        saveToStorage(); renderDepartments();
    }
}


function renderEmployees() {
    const container = document.getElementById("employees-page");
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Employees</h2>
            ${!isEditingEmployee ? `<button class="btn btn-success" onclick="showAddEmployeeForm()">+ Add Employee</button>` : ''}
        </div>
        <div style="display: ${isEditingEmployee ? 'none' : 'block'}">
            <table class="table table-striped align-middle">
                <thead class="table-light"><tr><th>ID</th><th>Name</th><th>Position</th><th>Dept</th><th>Actions</th></tr></thead>
                <tbody>
                    ${window.db.employees.length > 0 ? window.db.employees.map((emp, index) => `
                        <tr>
                            <td>${emp.employeeId}</td>
                            <td><div class="fw-bold">${emp.name}</div><div class="text-muted small">${emp.email}</div></td>
                            <td>${emp.position}</td>
                            <td><span class="badge bg-secondary">${emp.department}</span></td>
                            <td><button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${index})">Delete</button></td>
                        </tr>`).join("") : '<tr><td colspan="5" class="text-center p-4 text-muted">No employees found.</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="card shadow-sm" style="display: ${isEditingEmployee ? 'block' : 'none'}">
            <div class="card-header bg-white fw-bold">Add/Edit Employee</div>
            <div class="card-body">
                <form onsubmit="saveEmployee(event)">
                    <div class="mb-3"><label class="form-label">Employee ID</label><input type="text" id="empID" class="form-control" required></div>
                    <div class="mb-3"><label class="form-label">User Email</label><input type="email" id="empEmail" class="form-control" required></div>
                    <div class="mb-3"><label class="form-label">Position</label><input type="text" id="empPos" class="form-control" required></div>
                    <div class="mb-3"><label class="form-label">Department</label>
                        <select id="empDept" class="form-select" required>
                            ${window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join("")}
                        </select>
                    </div>
                    <div class="mb-3"><label class="form-label">Hire Date</label><input type="date" id="empDate" class="form-control" required></div>
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary ms-2" onclick="cancelEditEmployee()">Cancel</button>
                </form>
            </div>
        </div>`;
}

function showAddEmployeeForm() { isEditingEmployee = true; renderEmployees(); }
function cancelEditEmployee() { isEditingEmployee = false; renderEmployees(); }

function saveEmployee(e) {
    e.preventDefault();
    const email = document.getElementById("empEmail").value.trim();
    const account = window.db.accounts.find(acc => acc.email === email);
    if (!account) { alert("Error: Email does not match any registered user."); return; }
    
    window.db.employees.push({
        employeeId: document.getElementById("empID").value,
        email: email,
        name: `${account.first} ${account.last}`,
        position: document.getElementById("empPos").value,
        department: document.getElementById("empDept").value,
        hireDate: document.getElementById("empDate").value
    });
    saveToStorage(); cancelEditEmployee();
}

function deleteEmployee(index) {
    if(confirm("Remove employee?")) { window.db.employees.splice(index, 1); saveToStorage(); renderEmployees(); }
}

loadFromStorage();
const savedAuth = localStorage.getItem("auth_token");
if (savedAuth) {
    const user = window.db.accounts.find(acc => acc.email === savedAuth);
    if (user) setAuthState(true, user);
}
handleRouting();