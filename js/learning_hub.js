import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, push, set, get, remove, update } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';
import { app, database } from './firebase-config.js';

let isAdmin = false;
let currentUser = null;

function showMessage(message, type = 'info') {
    const msg = document.createElement('div');
    msg.className = `lh-message ${type}`;
    msg.textContent = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function renderLearningMaterials(materials) {
    const container = document.getElementById('materials-list');
    container.innerHTML = '';
    if (!materials || Object.keys(materials).length === 0) {
        container.innerHTML = '<p><em>No learning materials uploaded yet.</em></p>';
        return;
    }
    Object.entries(materials).forEach(([id, mat]) => {
        const div = document.createElement('div');
        div.className = 'material-item';
        div.innerHTML = `
            <h3>${mat.header}</h3>
            <p>${mat.description}</p>
            ${mat.fileUrl ? `<a href="${mat.fileUrl}" target="_blank">Download/View File</a>` : ''}
            ${isAdmin ? `<button class="edit-btn" data-id="${id}">Edit</button> <button class="delete-btn" data-id="${id}">Delete</button>` : ''}
        `;
        container.appendChild(div);
    });
}

function loadMaterials() {
    get(ref(database, 'learning_materials')).then(snap => {
        renderLearningMaterials(snap.exists() ? snap.val() : {});
    });
}

function handleUpload(e) {
    e.preventDefault();
    const header = document.getElementById('material-header').value.trim();
    const description = document.getElementById('material-description').value.trim();
    const fileInput = document.getElementById('material-file');
    if (!header || !description) {
        showMessage('Header and description are required', 'error');
        return;
    }
    let fileUrl = '';
    // File upload logic placeholder (Firebase Storage integration needed)
    // For now, just store header/description
    const newRef = push(ref(database, 'learning_materials'));
    set(newRef, { header, description, fileUrl }).then(() => {
        showMessage('Material uploaded', 'success');
        loadMaterials();
        document.getElementById('upload-form').reset();
    });
}

function handleDelete(id) {
    if (!confirm('Delete this material?')) return;
    remove(ref(database, `learning_materials/${id}`)).then(() => {
        showMessage('Material deleted', 'success');
        loadMaterials();
    });
}

function handleEdit(id, mat) {
    document.getElementById('material-header').value = mat.header;
    document.getElementById('material-description').value = mat.description;
    // No file edit for now
    document.getElementById('upload-form').onsubmit = function(e) {
        e.preventDefault();
        const header = document.getElementById('material-header').value.trim();
        const description = document.getElementById('material-description').value.trim();
        update(ref(database, `learning_materials/${id}`), { header, description }).then(() => {
            showMessage('Material updated', 'success');
            loadMaterials();
            this.reset();
            this.onsubmit = handleUpload;
        });
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    onAuthStateChanged(auth, user => {
        currentUser = user;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // Check admin (simple: email check or add admin flag in DB)
        // For now, hardcoded admin email
        isAdmin = user.email === 'admin@btg.com';
        if (isAdmin) {
            document.getElementById('upload-section').style.display = '';
        }
        loadMaterials();
    });

    document.getElementById('upload-form')?.addEventListener('submit', handleUpload);
    document.getElementById('materials-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            handleDelete(e.target.dataset.id);
        } else if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            get(ref(database, `learning_materials/${id}`)).then(snap => {
                if (snap.exists()) handleEdit(id, snap.val());
            });
        }
    });
});
