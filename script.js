const SUPABASE_URL = "https://glovvrsctvjwjtxiaaihu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb3Z2c2N0dmp3anR4aWFpahuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzAxNTUsImV4cCI6MjEwNjQ0NjE1NX0.CcPT-QFfF3mQrH9KxnOpU9Adu4ltCV5FrH4lWULR3Vk";

// Navigation onglets
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const clickedTab = e.currentTarget;
        clickedTab.classList.add('active');
        const targetId = 'tab-' + clickedTab.id.replace('btn-', '');
        const targetEl = document.getElementById(targetId);
        if(targetEl) targetEl.classList.add('active');
        
        if(targetId === 'tab-setups') chargerSetupsPublics();
    });
});

// Profil
let pseudoActif = localStorage.getItem('vmv_pseudo') || '';
const btnToggleProfil = document.getElementById('btnToggleProfil');
const statutSession = document.getElementById('statutSession');
const auteurInput = document.getElementById('auteurInput');

function refreshProfilUI() {
    const pInput = document.getElementById('pseudoActifInput');
    if(!pInput || !btnToggleProfil || !statutSession) return;
    if(pseudoActif) {
        pInput.value = pseudoActif;
        if(auteurInput) auteurInput.value = pseudoActif;
        statutSession.innerText = "Statut : Connecté en tant que " + pseudoActif;
        btnToggleProfil.innerText = "Se déconnecter";
    } else {
        statutSession.innerText = "Statut : Déconnecté";
        btnToggleProfil.innerText = "Se connecter";
    }
}
refreshProfilUI();

if(btnToggleProfil) {
    btnToggleProfil.addEventListener('click', () => {
        if(pseudoActif) {
            if(confirm("Se déconnecter ?")) {
                pseudoActif = '';
                localStorage.removeItem('vmv_pseudo');
                refreshProfilUI();
            }
        } else {
            const val = document.getElementById('pseudoActifInput').value.trim();
            if(val) {
                pseudoActif = val;
                localStorage.setItem('vmv_pseudo', pseudoActif);
                refreshProfilUI();
                alert("Connecté !");
            } else {
                alert("Entre un pseudo valide.");
            }
        }
    });
}

// Publication Setup (Anti-crash Safari)
const formSetup = document.getElementById('formSetup');
if(formSetup) {
    formSetup.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!pseudoActif) {
            alert("Connecte-toi avec un pseudo dans l'onglet Profil avant de publier !");
            return;
        }

        const payload = {
            auteur: auteurInput.value,
            moto: document.getElementById('motoInput').value,
            circuit: document.getElementById('circuitNomInput').value,
            pneu_avant: document.getElementById('pneuAvant').value,
            pneu_arriere: document.getElementById('pneuArriere').value,
            susp_av_pre: parseInt(document.getElementById('suspAvPre').value) || 4,
            susp_av_hui: parseInt(document.getElementById('suspAvHui').value) || 4,
            susp_av_res: parseInt(document.getElementById('suspAvRes').value) || 4,
            susp_av_com: parseInt(document.getElementById('suspAvCom').value) || 4,
            susp_av_ext: parseInt(document.getElementById('suspAvExt').value) || 4,
            susp_ar_pre: parseInt(document.getElementById('suspArPre').value) || 4,
            susp_ar_res: parseInt(document.getElementById('suspArRes').value) || 4,
            susp_ar_cl: parseInt(document.getElementById('suspArCL').value) || 4,
            susp_ar_cr: parseInt(document.getElementById('suspArCR').value) || 4,
            susp_ar_ext: parseInt(document.getElementById('suspArExt').value) || 4,
            bv_1: parseInt(document.getElementById('bv1').value) || 4,
            bv_2: parseInt(document.getElementById('bv2').value) || 4,
            bv_3: parseInt(document.getElementById('bv3').value) || 4,
            bv_4: parseInt(document.getElementById('bv4').value) || 4,
            bv_5: parseInt(document.getElementById('bv5').value) || 4,
            bv_6: parseInt(document.getElementById('bv6').value) || 4,
            bv_final: parseInt(document.getElementById('bvFinal').value) || 4,
            anti_dribble: parseInt(document.getElementById('antiDribble').value) || 4,
            frein_avant: document.getElementById('freinAvant').value,
            frein_arriere: document.getElementById('freinArriere').value,
            ecu_tcs: parseInt(document.getElementById('ecuTcs').value) || 3,
            ecu_aw: parseInt(document.getElementById('ecuAw').value) || 3,
            ecu_ebs: parseInt(document.getElementById('ecuEbs').value) || 3,
            geo_cha: parseInt(document.getElementById('geoCha').value) || 4,
            geo_dep: parseInt(document.getElementById('geoDep').value) || 4,
            geo_pla: parseInt(document.getElementById('geoPla').value) || 4,
            geo_bra: parseInt(document.getElementById('geoBra').value) || 4
        };

        // Sauvegarde locale de secours immédiate
        let localSetups = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
        localSetups.unshift(payload);
        localStorage.setItem('vmv_local_setups', JSON.stringify(localSetups));

        // Tentative cloud sécurisée (ne bloque plus jamais l'app si Safari refuse)
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn("Réseau mobile restreint, mode local activé.");
        }

        alert("Setup validé et enregistré avec succès !");
        document.getElementById('btn-setups').click();
    });
}

// Chargement des setups
let allSetupsCache = [];
async function chargerSetupsPublics() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    container.innerHTML = "Chargement...";
    
    let cloudData = [];
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if(response.ok) cloudData = await response.json();
    } catch(e) {
        console.warn("Cloud injoignable");
    }

    let localData = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
    allSetupsCache = [...localData, ...cloudData];
    afficherSetupsFiltres();
}

function afficherSetupsFiltres() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    const filtreTexte = document.getElementById('filtreInput').value.toLowerCase();
    const filtreCircuit = document.getElementById('filtreCircuitSelect').value;

    const filtres = allSetupsCache.filter(item => {
        const matchTexte = (item.moto && item.moto.toLowerCase().includes(filtreTexte)) || 
                           (item.auteur && item.auteur.toLowerCase().includes(filtreTexte));
        const matchCircuit = !filtreCircuit || item.circuit === filtreCircuit;
        return matchTexte && matchCircuit;
    });

    if(filtres.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:11px; text-align:center;'>Aucun setup trouvé.</p>";
        return;
    }

    container.innerHTML = '';
    filtres.forEach(item => {
        const div = document.createElement('div');
        div.className = 'setup-item';
        div.innerHTML = `<strong>${item.moto}</strong> sur <strong>${item.circuit}</strong><br><span style="font-size:10px; color:#888;">Par ${item.auteur}</span>`;
        div.addEventListener('click', () => ouvrirModalSetup(item));
        container.appendChild(div);
    });
}

const filtreInput = document.getElementById('filtreInput');
const filtreCircuitSelect = document.getElementById('filtreCircuitSelect');
if(filtreInput) filtreInput.addEventListener('input', afficherSetupsFiltres);
if(filtreCircuitSelect) filtreCircuitSelect.addEventListener('change', afficherSetupsFiltres);

// Modale & Coach IA
const modal = document.getElementById('modalDetails');
const btnCloseModal = document.getElementById('btnCloseModal');
if(btnCloseModal && modal) btnCloseModal.addEventListener('click', () => modal.style.display = 'none');

function ouvrirModalSetup(item) {
    document.getElementById('modalTitre').innerText = `${item.moto} (${item.circuit})`;
    document.getElementById('modalCorps').innerHTML = `
        <p><strong>Auteur :</strong> ${item.auteur}</p>
        <div class="section-title">Pneumatiques</div> Avant : ${item.pneu_avant} | Arrière : ${item.pneu_arriere}
        <div class="section-title">Suspensions</div> Av: P${item.susp_av_pre}/H${item.susp_av_hui} | Ar: P${item.susp_ar_pre}/R${item.susp_ar_res}
    `;
    modal.style.display = 'flex';
}

// Gestionnaires coach IA basiques
document.getElementById('btnCoachRapide')?.addEventListener('click', () => {
    document.getElementById('btnCoachRapide').classList.add('active');
    document.getElementById('btnCoachComplet').classList.remove('active');
    document.getElementById('viewCoachRapide').style.display = 'block';
    document.getElementById('viewCoachComplet').style.display = 'none';
});
document.getElementById('btnCoachComplet')?.addEventListener('click', () => {
    document.getElementById('btnCoachComplet').classList.add('active');
    document.getElementById('btnCoachRapide').classList.remove('active');
    document.getElementById('viewCoachComplet').style.display = 'block';
    document.getElementById('viewCoachRapide').style.display = 'none';
});
