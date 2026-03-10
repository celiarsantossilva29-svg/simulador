// ========================================
// SIMULADOR DE CONSÓRCIO - CR INVEST
// ========================================

let currentMode = 'integral'; // 'integral' | 'reduzida'
let modoLancePagar = 'pct'; // 'pct' | 'valor'

// ========================================
// ADMIN DATA & LOGOS
// ========================================

const adminData = {
    porto_seguro: { name: 'Porto Seguro', color: '#003399', logo: 'logo-porto.png', logoH: 70 },
    embracon: { name: 'Embracon', color: '#E30613', logo: 'logo-embracon.png', logoH: 32 },
    rodobens: { name: 'Rodobens', color: '#1B4D3E', logo: 'logo-rodobens.png', logoH: 50 },
    canopus: { name: 'Canopus', color: '#1B3A6B', logo: 'logo-canopus.png', logoH: 70 },
    magalu: { name: 'Magalu Consórcio', color: '#0086FF', logo: '', logoH: 50 }
};

// STATE PERSISTENCE
let currentAdmin = 'porto_seguro'; // Initial default
const savedRates = {
    porto_seguro: { taxa: '15', fundo: '2', seguro: '0.04' },
    embracon: { taxa: '24.8', fundo: '2', seguro: '0' },
    rodobens: { taxa: '15', fundo: '2', seguro: '0' },
    canopus: { taxa: '18', fundo: '2', seguro: '0' },
    magalu: { taxa: '16', fundo: '2', seguro: '0' }
};

function trocarAdministradora() {
    // 1. Save current state
    const taxaInput = document.getElementById('taxaAdm');
    const fundoInput = document.getElementById('fundoReserva');
    const seguroInput = document.getElementById('seguroPrestamista');

    if (currentAdmin) {
        if (!savedRates[currentAdmin]) savedRates[currentAdmin] = {};
        savedRates[currentAdmin] = {
            taxa: taxaInput.value,
            fundo: fundoInput.value,
            seguro: seguroInput.value
        };
    }

    const sel = document.getElementById('administradora');
    const key = sel.value;

    // 2. Load new state (if exists, else defaults or keep input?)
    // Using defined defaults ensures clean switching.
    if (savedRates[key]) {
        taxaInput.value = savedRates[key].taxa;
        fundoInput.value = savedRates[key].fundo;
        seguroInput.value = savedRates[key].seguro;
    }

    currentAdmin = key;

    // 3. Update Logo
    const d = adminData[key];
    const container = document.getElementById('adminLogoContainer');
    if (d && d.logo) {
        container.innerHTML = `<img src="${d.logo}" alt="${d.name}" class="admin-logo-img" style="height:${d.logoH}px">`;
    } else if (d) {
        const initials = d.name.split(' ').map(w => w[0]).join('').substring(0, 2);
        container.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" style="vertical-align:middle">
            <rect width="28" height="28" rx="4" fill="${d.color}"/>
            <text x="14" y="15" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="10" font-weight="700" font-family="Inter,sans-serif">${initials}</text>
        </svg> <span class="admin-name" style="color:${d.color}">${d.name}</span>`;
    } else {
        container.innerHTML = '';
    }
    atualizarSeletorReducao();
    calcular();
}

let taxasVisible = false;

function toggleTaxas() {
    taxasVisible = !taxasVisible;
    const row = document.getElementById('taxasRow');
    row.style.display = taxasVisible ? 'flex' : 'none';
}

// ========================================
// MODE SWITCHING
// ========================================

function setMode(mode) {
    currentMode = mode;
    const btnI = document.getElementById('btnIntegral');
    const btnR = document.getElementById('btnReduzida');
    const antGroup = document.getElementById('antecipada-group');
    const antLabel = document.getElementById('antecipada-label');

    if (mode === 'integral') {
        btnI.classList.add('active');
        btnR.classList.remove('active');
        antGroup.style.display = '';
        antLabel.style.display = 'none';
    } else {
        btnI.classList.remove('active');
        btnR.classList.add('active');
        antGroup.style.display = '';
        antLabel.style.display = 'none';
    }
    atualizarSeletorReducao();
    calcular();
}

function atualizarSeletorReducao() {
    const container = document.getElementById('pctReducaoContainer');
    if (currentMode === 'reduzida') {
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

// ========================================
// RICH TEXT EDITOR
// ========================================

function formatText(command, value) {
    if (command === 'hilite') {
        document.execCommand('hiliteColor', false, '#FFD54F');
    } else {
        document.execCommand(command, false, value || null);
    }
    // Keep focus on editor
    document.getElementById('observacoes').focus();
}

// ========================================
// STATE PERSISTENCE (localStorage)
// ========================================

function salvarEstado() {
    const estado = {
        mode: currentMode,
        admin: document.getElementById('administradora').value,
        tipoBem: document.getElementById('tipoBem').value,
        taxaAdm: document.getElementById('taxaAdm').value,
        fundoReserva: document.getElementById('fundoReserva').value,
        seguro: document.getElementById('seguroPrestamista').value,
        credito: document.getElementById('valorCredito').value,
        prazo: document.getElementById('prazoGrupo').value,
        reducao: document.querySelector('input[name="reducao"]:checked').value,
        lanceEmbutido: document.getElementById('lanceEmbutido').value,
        lancePagar: document.getElementById('lancePagar').value,
        primeirasN: document.getElementById('primeirasN').value,
        antecipada: document.getElementById('antecipada').value,
        pctReducao: document.getElementById('pctReducao').value,
        modoLance: modoLancePagar,
        observacoes: document.getElementById('observacoes').innerHTML
    };
    localStorage.setItem('cr_simulacao', JSON.stringify(estado));
}

function restaurarEstado() {
    const raw = localStorage.getItem('cr_simulacao');
    if (!raw) return;
    try {
        const s = JSON.parse(raw);

        // Mode
        if (s.mode) {
            currentMode = s.mode;
            setMode(s.mode);
        }

        // Selects
        if (s.admin) document.getElementById('administradora').value = s.admin;
        if (s.tipoBem) document.getElementById('tipoBem').value = s.tipoBem;
        if (s.primeirasN) document.getElementById('primeirasN').value = s.primeirasN;

        // Numeric inputs
        if (s.taxaAdm) document.getElementById('taxaAdm').value = s.taxaAdm;
        if (s.fundoReserva) document.getElementById('fundoReserva').value = s.fundoReserva;
        if (s.seguro) document.getElementById('seguroPrestamista').value = s.seguro;
        if (s.credito) document.getElementById('valorCredito').value = s.credito;
        if (s.prazo) document.getElementById('prazoGrupo').value = s.prazo;
        if (s.lanceEmbutido) document.getElementById('lanceEmbutido').value = s.lanceEmbutido;
        if (s.lancePagar) document.getElementById('lancePagar').value = s.lancePagar;
        if (s.valorPagar) document.getElementById('valorPagar').value = s.valorPagar;
        if (s.modoLance) {
            modoLancePagar = s.modoLance;
            atualizarVisualModoLance();
        }
        if (s.antecipada) document.getElementById('antecipada').value = s.antecipada;
        if (s.pctReducao) document.getElementById('pctReducao').value = s.pctReducao;

        // Radio
        if (s.reducao) {
            const radio = document.querySelector(`input[name="reducao"][value="${s.reducao}"]`);
            if (radio) radio.checked = true;
        }

        // Textarea
        if (s.observacoes) document.getElementById('observacoes').innerHTML = s.observacoes;

    } catch (e) {
        console.warn('Erro ao restaurar estado:', e);
    }
}

// ========================================
// FORMATTING UTILITIES
// ========================================

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatCurrencyInput(input) {
    let raw = input.value.replace(/[^\d]/g, '');
    if (raw.length === 0) { input.value = ''; return; }
    let num = parseInt(raw) / 100;
    input.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// ========================================
// UI TOGGLES & REVERSE CALCULATION (TOGGLE & LOGIC)
// ========================================

function toggleTaxas() {
    const row = document.getElementById('taxasRow');
    const btn = document.getElementById('btnToggleTaxas');
    if (row.style.display === 'none') {
        row.style.display = 'flex';
        btn.classList.add('active');
    } else {
        row.style.display = 'none';
        btn.classList.remove('active');
    }
}

function toggleFluxoLance() {
    modoLancePagar = modoLancePagar === 'pct' ? 'valor' : 'pct';
    atualizarVisualModoLance();
    calcular();
}

function atualizarVisualModoLance() {
    const inputPct = document.getElementById('lancePagar');
    const inputVal = document.getElementById('valorPagar');
    const boxPct = document.getElementById('boxLancePagarPct');
    const boxVal = document.getElementById('boxLancePagarVal');

    if (modoLancePagar === 'pct') {
        // Porcentagem ativa
        inputPct.readOnly = false;
        inputVal.readOnly = true;

        // Estilos visuais
        if (boxPct) {
            boxPct.querySelector('.field-input').classList.remove('readonly');
        }
        if (boxVal) {
            boxVal.querySelector('.field-input').classList.add('readonly');
        }
    } else {
        // Valor ativo
        inputPct.readOnly = true;
        inputVal.readOnly = false;

        // Estilos
        if (boxVal) {
            boxVal.querySelector('.field-input').classList.remove('readonly');
        }
        if (boxPct) {
            boxPct.querySelector('.field-input').classList.add('readonly');
        }
    }
}

// ========================================
// MAIN CALCULATION
// ========================================

function calcular() {
    // Read inputs
    const taxaAdm = parseFloat(document.getElementById('taxaAdm').value) / 100 || 0;
    const fundoReserva = parseFloat(document.getElementById('fundoReserva').value) / 100 || 0;
    const seguro = parseFloat(document.getElementById('seguroPrestamista').value) || 0;
    const credito = parseCurrency(document.getElementById('valorCredito').value);
    const prazo = parseInt(document.getElementById('prazoGrupo').value) || 1;
    const reducao = document.querySelector('input[name="reducao"]:checked').value;
    const lanceEmbutidoPct = parseFloat(document.getElementById('lanceEmbutido').value) / 100 || 0;
    const lancePagarPct = parseFloat(document.getElementById('lancePagar').value) / 100 || 0;
    const lanceTotalPct = lanceEmbutidoPct + lancePagarPct;
    const primeirasN = parseInt(document.getElementById('primeirasN').value) || 1;
    const antecipadaPct = (parseFloat(document.getElementById('antecipada').value) || 0) / 100;

    const adminKey = document.getElementById('administradora').value;
    const isEmbracon = adminKey === 'embracon';

    // ========================================
    // PARCELA MENSAL (INTEGRAL)
    // ========================================
    const totalTaxas = taxaAdm + fundoReserva + seguro;
    const fatorTotal = 1 + totalTaxas;
    const parcelaMensal = (credito * fatorTotal) / prazo;

    // ========================================
    // PARCELA BASE (depends on mode)
    // ========================================
    let parcelaBase;
    if (currentMode === 'integral') {
        parcelaBase = parcelaMensal;
    } else {
        // Read reduction from input (e.g. 25 -> 0.25)
        const valRed = parseFloat(document.getElementById('pctReducao').value);
        const pctReducao = (isNaN(valRed) ? 25 : valRed) / 100;
        const fatorReducao = 1 - pctReducao;

        if (isEmbracon) {
            // Embracon: Crédito REDUZIDO, Fundo Reserva REDUZIDO, Taxa Adm INTEGRAL, Seguro INTEGRAL
            const partCredito = (credito * fatorReducao) / prazo;
            const partAdm = (credito * taxaAdm) / prazo;
            const partFundo = (credito * fundoReserva * fatorReducao) / prazo;
            const partSeguro = (credito * seguro) / prazo;

            parcelaBase = partCredito + partAdm + partFundo + partSeguro;
        } else {
            // Outros: Redução sobre a parcela cheia
            parcelaBase = parcelaMensal * fatorReducao;
        }
    }

    // ========================================
    // ANTECIPADA
    // ========================================
    const antecipadaTotal = credito * antecipadaPct;
    const antecipadaMensal = antecipadaTotal / primeirasN;

    // ========================================
    // PRIMEIRAS N PARCELAS
    // ========================================
    const primeiras = parcelaBase + antecipadaMensal;

    // ========================================
    // LANCE
    // ========================================
    let valorTotalLance, valorEmbutido;
    let baseCalculo;

    if (isEmbracon) {
        // Embracon: lance calculado sobre o crédito puro (sem taxas)
        baseCalculo = credito;
    } else {
        // Outros: lance total sobre plano total (varia com taxas)
        const planoTotal = credito * (1 + taxaAdm + fundoReserva + seguro);
        baseCalculo = planoTotal;
    }

    let valorAPagar = 0;

    if (modoLancePagar === 'pct') {
        // Modo Padrão: Usuário digitou %
        if (lanceTotalPct === 0) {
            valorTotalLance = 0;
            valorEmbutido = 0;
            valorAPagar = 0;
        } else {
            // O lance ofertado total (%) é SEMPRE calculado sobre o valor do plano (baseCalculo)
            valorTotalLance = lanceTotalPct * baseCalculo;

            // O embutido pode absorver até 30% do VALOR DO CRÉDITO
            const limiteEmbutido = 0.30 * credito;

            // Se o lance total for menor ou igual ao limite de embutido, não paga nada do bolso.
            // Se ultrapassar os 30%, o embutido trava em 30% e a diferença vai pro bolso.
            valorEmbutido = Math.min(valorTotalLance, limiteEmbutido);
            valorAPagar = valorTotalLance - valorEmbutido;
        }
    } else {
        // Modo Reverso: Usuário digitou $ no campo a Pagar
        const valorPagarDigitado = parseCurrency(document.getElementById('valorPagar').value);
        valorAPagar = valorPagarDigitado;

        // Embutido base: até 30% do crédito correspondente à % inputada
        const limiteEmbutido = 0.30 * credito;
        let embutidoDesejado = lanceEmbutidoPct * credito;
        if (embutidoDesejado > limiteEmbutido) embutidoDesejado = limiteEmbutido;

        valorEmbutido = embutidoDesejado;
        valorTotalLance = valorAPagar + valorEmbutido;

        // Atualiza campos inativos (%)
        let pctCalculada = valorTotalLance / baseCalculo;
        if (pctCalculada < 0) pctCalculada = 0;

        let pagarPctCalc = pctCalculada - (valorEmbutido / credito);
        if (pagarPctCalc < 0) pagarPctCalc = 0;
        document.getElementById('lancePagar').value = (pagarPctCalc * 100).toFixed(2);
    }

    // ========================================
    // CRÉDITO LÍQUIDO
    // ========================================
    const creditoLiquido = credito - valorEmbutido;

    // ========================================
    // PÓS-CONTEMPLAÇÃO (modelo padrão para todas as admins)
    // ========================================
    // Para pós-contemplação, usar fórmula padrão (mesmo modelo Porto Seguro)
    const parcelaBasePos = currentMode === 'integral' ? parcelaMensal : parcelaMensal * 0.75;
    let prazoRestante, parcelaPosContemp;

    if (reducao === 'parcela') {
        // Mantém prazo, reduz parcela
        prazoRestante = prazo - 1;
        const totalPlanoRegular = parcelaMensal * prazo;

        let custoRestante;
        if (currentMode === 'integral') {
            custoRestante = totalPlanoRegular - valorTotalLance - primeiras;
        } else {
            custoRestante = totalPlanoRegular - valorTotalLance - parcelaBasePos - antecipadaTotal;
        }
        parcelaPosContemp = custoRestante / prazoRestante;
    } else {
        // Mantém parcela, reduz prazo
        const totalPlano = parcelaMensal * prazo;
        let custoRestantePrazo;
        if (currentMode === 'integral') {
            custoRestantePrazo = totalPlano - valorTotalLance - primeiras;
        } else {
            custoRestantePrazo = totalPlano - valorTotalLance - parcelaBasePos - antecipadaTotal;
        }
        prazoRestante = Math.round(custoRestantePrazo / parcelaBasePos);
        parcelaPosContemp = parcelaBasePos;
    }

    // ========================================
    // UPDATE DISPLAY: Lance section
    // ========================================
    // Atualizar as % na interface para refletir a matemática real aplicada
    const efetivoEmbutidoPct = valorEmbutido / credito;
    let efetivoPagarPct = 0;
    if (baseCalculo > 0) {
        efetivoPagarPct = valorAPagar / baseCalculo;
    }

    // Atualizamos os campos de input, mas só se eles precisarem ser sobreescritos pela trava
    // Na verdade, para não "apagar" o que o usuário digita no modo % enquanto ele digita, 
    // atualizamos apenas o display readonly 'lanceTotal' e os 'valores em R$' 
    // O usuário entende que o Embutido dele foi convertido em Valor na caixa abaixo.

    // We already have `lanceTotalPct` from the user inputs.
    document.getElementById('lanceTotal').value = (lanceTotalPct * 100).toFixed(2).replace('.', ',');
    document.getElementById('valorEmbutido').value = formatCurrency(valorEmbutido);
    document.getElementById('valorPagar').value = formatCurrency(valorAPagar);
    document.getElementById('valorTotal').value = formatCurrency(valorTotalLance);

    // ========================================
    // UPDATE DISPLAY: Results (now using .value since they are input fields)
    // ========================================
    document.getElementById('resultPrimeiras').value = formatCurrency(primeiras);
    document.getElementById('resultDemais').value = formatCurrency(parcelaBase);
    document.getElementById('resultCredLiquido').value = formatCurrency(creditoLiquido);
    document.getElementById('resultPosContemp').value = formatCurrency(parcelaPosContemp);
    document.getElementById('resultPrazoRestante').value = prazoRestante;

    // Save state to localStorage
    salvarEstado();

    // Atualiza Comparativo silenciosamente para manter os dados sincronizados
    if (typeof calcComparativo === 'function') {
        calcComparativo();
    }
}

// ========================================
// PDF GENERATION
// ========================================

function gerarPDF() {
    if (typeof html2pdf === 'undefined') {
        alert('Carregando biblioteca PDF... Aguarde um instante e tente novamente.');
        // Retry logic could go here, but alert is enough for now.
        return;
    }
    try {
        const admin = document.getElementById('administradora');
        const adminKey = admin.value;
        const adminName = admin.options[admin.selectedIndex].text;
        const observacoes = document.getElementById('observacoes').innerHTML.trim();
        const hasObs = observacoes && observacoes !== '<br>' && observacoes !== '<br/>';
        const d = adminData[adminKey];
        // Use Base64 logos if available to avoid Tainted Canvas
        const adminLogoSrc = (d && d.logo && logoBase64[d.logo]) ? logoBase64[d.logo] : (d ? d.logo : '');
        const headerLogoSrc = logoBase64['logo-nova.png'] || 'logo-nova.png';

        const adminColor = d ? d.color : '#333';

        const tipo = document.getElementById('tipoBem');
        const tipoText = tipo.options[tipo.selectedIndex].text;

        let modeLabel = currentMode === 'integral' ? 'Parcela Integral' : 'Parcela Reduzida';
        if (currentMode === 'reduzida') {
            const valRed = parseFloat(document.getElementById('pctReducao').value) || 25;
            // User requested to show the reduction percentage itself as "X% until contemplation"
            // Example: "25% até a Contemplação" (meaning paying 75%? Or paying 25%? User wording is key.)
            // The prompt says: "se a redução é de 25% ent quero que escreva 25% ate a contemplação"
            // So we use 'valRed' directly.
            modeLabel += ` (${valRed}% até Contemplação)`;
        }
        const primeirasN = document.getElementById('primeirasN').value;
        const primeirasLabel = primeirasN === '1' ? 'À Vista' : primeirasN;

        const taxaAdm = document.getElementById('taxaAdm').value;
        const fundoReserva = document.getElementById('fundoReserva').value;
        const seguro = document.getElementById('seguroPrestamista');
        const seguroVal = parseFloat(seguro.value) || 0;
        const seguroText = seguroVal === 0 ? 'Sem Seguro' : seguroVal + '%';
        const credito = document.getElementById('valorCredito').value;
        const prazo = document.getElementById('prazoGrupo').value;

        const lanceEmb = document.getElementById('lanceEmbutido').value;
        const valorEmb = document.getElementById('valorEmbutido').value;
        const lancePag = document.getElementById('lancePagar').value;
        const valorPag = document.getElementById('valorPagar').value;
        const lanceTotal = document.getElementById('lanceTotal').value;
        const valorTotal = document.getElementById('valorTotal').value;

        const resultPrim = document.getElementById('resultPrimeiras').value;
        const resultDemais = document.getElementById('resultDemais').value;
        const resultCL = document.getElementById('resultCredLiquido').value;
        const resultPos = document.getElementById('resultPosContemp').value;
        const resultPrazo = document.getElementById('resultPrazoRestante').value;

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Build the content for PDF
        const element = document.createElement('div');
        element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            *{margin:0;padding:0;box-sizing:border-box}
            #pdf-content{font-family:'Inter',sans-serif;background:#fff;color:#111;padding:10mm 12mm 12mm;width:210mm;height:295mm;position:relative;box-sizing:border-box}
            .pdf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #c9a84c}
            .pdf-header img{height:90px;object-fit:contain}
            .pdf-info{text-align:right}
            .pdf-info h1{font-size:22px;font-weight:800;color:#111;letter-spacing:-0.5px;margin-bottom:2px}
            .pdf-info p{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px}

            /* MAIN GRID */
            .main-grid{display:grid;grid-template-columns:1.2fr 1.8fr;gap:28px}

            /* CARDS */
            .card{margin-bottom:14px}
            .card h3{font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:8px}
            .card h3::after{content:'';flex:1;height:1px;background:#eee}

            /* SUMMARY BOX (CREDIT + TERM) */
            .summary-box{display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f9f9f9;padding:16px;border-radius:8px;margin-bottom:22px;border:1px solid #eee}
            .s-item .lbl{display:block;font-size:10px;color:#888;margin-bottom:3px;text-transform:uppercase}
            .s-item .val{display:block;font-size:22px;font-weight:700;color:#111}

            /* LANCE (LIGHT) */
            .lance-card{background:#fff;color:#111;padding:20px;border-radius:10px;border:1px solid #ddd}
            .lance-card h3{color:#c9a84c;border:none;margin-bottom:12px}
            .lance-card h3::after{background:#eee}
            .l-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;border-bottom:1px solid #f0f0f0;padding-bottom:8px}
            .l-row:last-child{border:none;margin:0;padding:0}
            .l-row .lbl{color:#666}
            .l-row .val{font-weight:600;color:#111}

            /* RESULTS */
            .result-card{background:#fff}
            .r-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0f0f0}
            .r-row:last-child{border:none}
            .r-label{font-size:13px;color:#666;max-width:60%}
            .r-val{font-size:18px;font-weight:700;color:#111;text-align:right}
            .r-sub{font-size:10px;color:#999;display:block;margin-top:1px}

            /* HIGHLIGHT LIQUID */
            .highlight-liquid{background:linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%);border:1px solid #c9a84c;padding:18px;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
            .hl-label{font-size:14px;font-weight:700;color:#8a7333;text-transform:uppercase}
            .hl-val{font-size:26px;font-weight:800;color:#111}

            .admin-tag{display:inline-block;margin-top:4px}

            .footer{position:absolute;bottom:3mm;left:12mm;right:12mm;padding-top:6px;border-top:1px solid #eee;font-size:9px;color:#bbb;display:flex;justify-content:space-between}
        </style>
        
        <div id="pdf-content">
            <div class="pdf-header">
                <img src="${headerLogoSrc}" alt="CR Invest">
                <div class="pdf-info">
                    <h1>Simulação de Consórcio</h1>
                    <p>${modeLabel} • ${tipoText}</p>
                    <div class="admin-tag">
                        ${adminLogoSrc ? `<img src="${adminLogoSrc}" style="height:40px;object-fit:contain">` : `<span style="font-weight:700;color:${adminColor}">${adminName}</span>`}
                    </div>
                </div>
            </div>

            <!-- TOP SUMMARY: CREDIT & TERM -->
            <div class="summary-box">
                <div class="s-item">
                    <span class="lbl">Valor do Crédito</span>
                    <span class="val">R$ ${credito}</span>
                </div>
                <div class="s-item">
                    <span class="lbl">Prazo do Plano</span>
                    <span class="val">${prazo} Meses</span>
                </div>
            </div>

            <div class="main-grid">
                <!-- LEFT COLUMN: LANCE -->
                <div>
                    <div class="lance-card">
                        <h3>Composição do Lance</h3>
                        <div class="l-row"><span class="lbl">Embutido (${lanceEmb}%)</span><span class="val">R$ ${valorEmb}</span></div>
                        <div class="l-row"><span class="lbl">Recurso Próprio (${lancePag}%)</span><span class="val">R$ ${valorPag}</span></div>
                        <div class="l-row" style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.2)">
                            <span class="lbl" style="color:#c9a84c">Lance Total (${lanceTotal}%)</span>
                            <span class="val" style="color:#c9a84c;font-size:16px">R$ ${valorTotal}</span>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: RESULTS -->
                <div>
                    <div class="card">
                        <h3>Fluxo de Pagamento</h3>
                        
                        <div class="r-row">
                            <div class="r-label">1ª Parcela (${primeirasLabel})
                                <span class="r-sub">Entrada (Antecipada + Parcela)</span>
                            </div>
                            <div class="r-val">R$ ${resultPrim}</div>
                        </div>

                        <div class="r-row">
                            <div class="r-label">Parcelas Antes da Contemplação
                                <span class="r-sub">Valor mensal até sair o lance</span>
                            </div>
                            <div class="r-val">R$ ${resultDemais}</div>
                        </div>

                        <div class="highlight-liquid" style="margin:14px 0">
                            <span class="hl-label">Crédito Líquido</span>
                            <span class="hl-val">R$ ${resultCL}</span>
                        </div>

                        <div class="r-row">
                            <div class="r-label">Parcelas Pós-Contemplação
                                <span class="r-sub">Novo valor após abater o lance</span>
                            </div>
                            <div class="r-val">R$ ${resultPos}</div>
                        </div>
                        
                        <div class="r-row" style="border:none">
                            <div class="r-label">Prazo Restante ao Contemplar</div>
                            <div class="r-val">${resultPrazo} Meses</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${hasObs ? `
            <div class="pdf-notes" style="margin-top:24px; padding-top:16px; border-top:1px solid #ddd;">
                <h3 style="font-size:13px; font-weight:700; margin-bottom:8px; color:#111; text-transform:uppercase;">Observações</h3>
                <div style="font-size:12px; line-height:1.5; color:#444;">${observacoes}</div>
            </div>
            ` : ''}

            <div class="footer">
                <span>CR Invest - Consultoria Especializada</span>
                <span>Gerado em ${dateStr}</span>
            </div>
        </div>
    `;

        // Configuration for html2pdf
        const opt = {
            margin: 0,
            filename: 'Simulacao-CR-Invest.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Use html2pdf
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save()
                .then(() => {
                    console.log('PDF gerado com sucesso!');
                })
                .catch(err => {
                    console.error('Erro na geração do PDF (Promise):', err);
                    alert('Erro ao gerar PDF: ' + (err.message || err));
                });
        } else {
            alert('Erro: Biblioteca de PDF não carregada. Tente novamente em alguns segundos.');
        }
    } catch (e) {
        console.error('Erro ao gerar PDF (Sync):', e);
        alert('Erro ao gerar PDF (Sync): ' + e.message);
    }
}

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    restaurarEstado();
    atualizarVisualModoLance();
    trocarAdministradora();
    calcular(); // Já engatilha o calcComparativo interno
});

// ========================================
// TABS & COMPARATIVO
// ========================================
function syncInputs(sourceId, targetId) {
    const sourceVal = document.getElementById(sourceId).value;
    document.getElementById(targetId).value = sourceVal;

    if (targetId === 'administradora') {
        trocarAdministradora();
    }
    calcular(); // Roda a simulação principal e invoca calcComparativo no final
}

function syncRadios(sourceName, targetName) {
    const selected = document.querySelector(`input[name="${sourceName}"]:checked`);
    if (selected) {
        const targetRadio = document.querySelector(`input[name="${targetName}"][value="${selected.value}"]`);
        if (targetRadio) targetRadio.checked = true;
    }
    calcular();
}

// ========================================
// NAVIGATION (HOME → TOOL)
// ========================================

function navigateTo(tabId) {
    // Hide home screen
    document.getElementById('homeScreen').style.display = 'none';
    // Show back button in header
    document.getElementById('btnVoltarHome').style.display = '';
    // Activate the correct tab
    switchTabDirect(tabId);
}

function voltarHome() {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    // Hide back button
    document.getElementById('btnVoltarHome').style.display = 'none';
    // Hide toolbar
    const toolBar = document.getElementById('toolbarSecundaria');
    if (toolBar) toolBar.style.display = 'none';
    // Show home
    document.getElementById('homeScreen').style.display = '';
}

function switchTabDirect(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (tabId === 'simulador') {
        document.getElementById('tabSimulador').classList.add('active');
        const toolBar = document.getElementById('toolbarSecundaria');
        if (toolBar) toolBar.style.display = '';
    } else {
        document.getElementById('tabComparativo').classList.add('active');
        const toolBar = document.getElementById('toolbarSecundaria');
        if (toolBar) toolBar.style.display = 'none';
        // Always start on Fase 1 (inputs), step 1 of wizard
        document.getElementById('compFaseInputs').style.display = '';
        document.getElementById('compFaseResultados').style.display = 'none';
        wizardNext(1);

        // Desfazer qualquer seleção anterior ao trocar de aba:
        document.querySelectorAll('.cx-card-option').forEach(c => c.classList.remove('selected'));
        document.getElementById('cxInlineInputs').style.display = 'none';
    }
}

function switchTab(tabId) {
    switchTabDirect(tabId);
}

// ========================================
// WIZARD NAVIGATION (Caixa-style)
// ========================================

function wizardNext(step) {
    // Skip wizStep2 — now only 2 steps: step1 (objetivos) and step3 (resultado)
    const panels = ['wizStep1', 'wizStep3'];
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    // Map: step 2 -> jump to 3 automatically
    const target = document.getElementById('wizStep' + (step === 2 ? 3 : step));
    if (target) target.style.display = '';

    // Update progress indicators
    const progressStep = (step === 2 ? 3 : step) + 1;

    for (let i = 1; i <= 4; i++) {
        const ind = document.getElementById('wizStep' + i + 'Indicator');
        if (!ind) continue;
        ind.classList.remove('active', 'done');
        if (i < progressStep) ind.classList.add('done');
        if (i === progressStep) ind.classList.add('active');
    }

    const s1 = document.getElementById('wizStep1Indicator');
    if (s1) s1.classList.add('done');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wizSelectMode(mode) {
    window._wizMode = mode;

    // Highlight selected card
    document.querySelectorAll('.cx-card-option').forEach(c => c.classList.remove('selected'));
    const cardMap = { prestacao: 'cardPrestacao', renda: 'cardRenda', imovel: 'cardImovel' };
    const card = document.getElementById(cardMap[mode]);
    if (card) card.classList.add('selected');

    // Show inline inputs
    document.getElementById('cxInlineInputs').style.display = 'flex';

    // Toggle fields per mode
    document.getElementById('fieldPrestacao').style.display = mode === 'prestacao' ? '' : 'none';
    document.getElementById('fieldRenda').style.display = (mode === 'renda' || mode === 'imovel') ? '' : 'none';
    document.getElementById('fieldValorImovel').style.display = mode === 'imovel' ? '' : 'none';
}

// ========================================
// SIMULAÇÃO CAIXA — Auto-direcionamento
// ========================================

function parseCurrency(str) {
    if (typeof str === 'number') return str;
    return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function fmtBRL(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getTaxaCaixa(rendaBruta, servidorPublico) {
    // MCMV faixas (taxas efetivas anuais atualizadas - referência Caixa 2025/2026)
    if (rendaBruta <= 2850) return { taxa: 0.0485, tag: 'MCMV Faixa 1 — 4,85% a.a.', mcmv: true };
    if (rendaBruta <= 4700) return { taxa: 0.0550, tag: 'MCMV Faixa 2 — 5,50% a.a.', mcmv: true };
    if (rendaBruta <= 8600) return { taxa: 0.0766, tag: 'MCMV Faixa 3 — 7,66% a.a.', mcmv: true };
    if (rendaBruta <= 12000) return { taxa: 0.0816, tag: 'MCMV Faixa 4 — 8,16% a.a.', mcmv: false };
    // SBPE
    if (servidorPublico) return { taxa: 0.1049, tag: 'SBPE Servidor — TR + 10,49% a.a.', mcmv: false };
    return { taxa: 0.1099, tag: 'SBPE — TR + 10,99% a.a.', mcmv: false };
}

function calcIdadeMeses(dataNascStr) {
    const nasc = new Date(dataNascStr);
    const hoje = new Date();
    let anos = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) anos--;
    return anos;
}

function executarSimulacaoCaixa() {
    // Coleta dados
    const mode = window._wizMode || 'imovel';
    const nascimento = document.getElementById('compNascimento').value;
    const servidorPublico = false;  // padrão: não servidor
    const fgts = true;  // padrão: possui FGTS
    const tipoBem = 'imovel';  // padrão: imóvel residencial

    // Se não preencheu nascimento, assume 35 anos para não quebrar o cálculo
    const idade = nascimento ? calcIdadeMeses(nascimento) : 35;
    const prazoMaxIdade = Math.max(60, (80 - Math.max(0, idade)) * 12);
    const prazoFin = Math.min(420, prazoMaxIdade);

    let valorImovel = 0;
    let rendaBruta = 0;
    let prestacaoDesejada = 0;

    if (mode === 'imovel') {
        valorImovel = parseCurrency(document.getElementById('compValorCredito').value);
        rendaBruta = parseCurrency(document.getElementById('compRendaBruta').value);
    } else if (mode === 'renda') {
        rendaBruta = parseCurrency(document.getElementById('compRendaBruta').value);
    } else if (mode === 'prestacao') {
        prestacaoDesejada = parseCurrency(document.getElementById('compPrestacaoDesejada').value);
        rendaBruta = prestacaoDesejada / 0.30; // Estima renda pra aprovar essa prestacao
    }

    // Auto-determina taxa
    const { taxa, tag, mcmv } = getTaxaCaixa(rendaBruta, servidorPublico);
    const maxComprometimentoRenda = 0.30; // Caixa permite no maximo 30% da renda bruta na prestação

    // Para MCMV, Caixa utiliza preferencialmente PRICE; para SBPE, SAC
    let sistema = mcmv ? 'PRICE' : 'SAC';

    // Taxa mensal (juro composto)
    const taxaMensal = Math.pow(1 + taxa, 1 / 12) - 1;

    // Taxa de administração da CAIXA / Seguros mensais básicos (estimados)
    const taxasExtrasFixas = 0; // Seguros já embutidos na taxa efetiva do MCMV

    // Fatores de cálculo pra determinar a primeira prestação base
    const fatorSAC = (1 / prazoFin) + taxaMensal;
    const fatorPRICE = (taxaMensal * Math.pow(1 + taxaMensal, prazoFin)) / (Math.pow(1 + taxaMensal, prazoFin) - 1);

    // Calcula teto de Parcela da Renda
    let parcelaTeto = (rendaBruta * maxComprometimentoRenda) - taxasExtrasFixas;
    if (parcelaTeto < 0) parcelaTeto = 0;

    // Valor máximo de crédito que aprovaria pra essa renda e prazo
    let maxAprovadoSAC = parcelaTeto > 0 ? parcelaTeto / fatorSAC : 0;
    let maxAprovadoPRICE = parcelaTeto > 0 ? parcelaTeto / fatorPRICE : 0;

    const maxCotaAtendida = 0.8;
    let valorFinanciadoDesejado = 0;

    if (mode === 'imovel') {
        valorFinanciadoDesejado = valorImovel * maxCotaAtendida;
    } else if (mode === 'renda') {
        // Pela renda: MCMV usa PRICE, SBPE usa SAC
        if (mcmv) {
            valorFinanciadoDesejado = maxAprovadoPRICE;
        } else {
            valorFinanciadoDesejado = maxAprovadoSAC;
        }
        valorImovel = valorFinanciadoDesejado / maxCotaAtendida;
    } else if (mode === 'prestacao') {
        // Pela prestação desejada
        let parcelaRealDesejada = prestacaoDesejada - taxasExtrasFixas;
        if (parcelaRealDesejada < 0) parcelaRealDesejada = 0;
        if (mcmv) {
            valorFinanciadoDesejado = parcelaRealDesejada / fatorPRICE;
        } else {
            valorFinanciadoDesejado = parcelaRealDesejada / fatorSAC;
        }
        valorImovel = valorFinanciadoDesejado / maxCotaAtendida;
    }

    let valorFinanciado = valorFinanciadoDesejado;
    let novoValorImovel = valorImovel;

    if (valorFinanciadoDesejado <= maxAprovadoSAC) {
        sistema = 'SAC';
        valorFinanciado = valorFinanciadoDesejado;
    } else if (valorFinanciadoDesejado <= maxAprovadoPRICE) {
        sistema = 'PRICE';
        valorFinanciado = valorFinanciadoDesejado;
    } else {
        // Nada passa na renda real. Corta na carne o valor financiado usando a Tabela PRICE
        if (maxAprovadoPRICE > 0) {
            sistema = 'PRICE';
            valorFinanciado = maxAprovadoPRICE;
            novoValorImovel = valorFinanciado / maxCotaAtendida;
        } else {
            valorFinanciado = 0;
            novoValorImovel = 0;
        }
    }

    // Calcula os valores reais das parcelas
    let entrada = novoValorImovel - valorFinanciado;
    let entradaPct = entrada / novoValorImovel;

    let totalPago = entrada;
    let totalJuros = 0;
    let saldo = valorFinanciado;

    let parcela1 = 0;
    let parcelaFinal = 0;

    if (sistema === 'SAC') {
        const amortizacao = valorFinanciado / prazoFin;
        parcela1 = amortizacao + (valorFinanciado * taxaMensal) + taxasExtrasFixas;
        parcelaFinal = amortizacao + (amortizacao * taxaMensal) + taxasExtrasFixas;

        for (let m = 0; m < prazoFin; m++) {
            const juros = saldo * taxaMensal;
            totalJuros += juros;
            totalPago += amortizacao + juros + taxasExtrasFixas;
            saldo -= amortizacao;
        }
    } else {
        // PRICE
        parcela1 = (valorFinanciado * fatorPRICE) + taxasExtrasFixas;
        parcelaFinal = parcela1; // Em PRICE a parcela é idêntica (fixa) do começo ao fim.
        const pmntFixo = valorFinanciado * fatorPRICE;

        for (let m = 0; m < prazoFin; m++) {
            const juros = saldo * taxaMensal;
            let amort = pmntFixo - juros;
            totalJuros += juros;
            totalPago += pmntFixo + taxasExtrasFixas;
            saldo -= amort;
        }
    }

    // Preenche card DOM
    document.getElementById('cxResultTag').textContent = tag;
    document.getElementById('cxValorFinanciado').textContent = fmtBRL(valorFinanciado);
    document.getElementById('cxEntrada').textContent = fmtBRL(entrada) + ' (' + Math.round(entradaPct * 100) + '%)';
    document.getElementById('cxPrazo').textContent = prazoFin + ' meses (' + Math.round(prazoFin / 12) + ' anos)';
    document.getElementById('cxSistema').textContent = sistema;
    document.getElementById('cxParcela1').textContent = fmtBRL(parcela1);
    document.getElementById('cxParcelaFinal').textContent = fmtBRL(parcelaFinal);
    document.getElementById('cxTotalJuros').textContent = fmtBRL(totalJuros);
    document.getElementById('cxTotalPago').textContent = fmtBRL(totalPago);

    // Renda estimada (só para modo prestação)
    const rendaRow = document.getElementById('cxRendaEstimadaRow');
    if (mode === 'prestacao') {
        const rendaEstimada = parcela1 / 0.30;
        document.getElementById('cxRendaEstimada').textContent = fmtBRL(rendaEstimada);
        rendaRow.style.display = '';
    } else {
        rendaRow.style.display = 'none';
    }

    window._caixaFinData = {
        valorImovel: novoValorImovel,
        valorFinanciado,
        entrada,
        entradaPct,
        taxa, taxaMensal, prazoFin, sistema,
        parcela1, parcelaFinal, totalJuros, totalPago, tag
    };

    // Vai pro step 3
    wizardNext(3);
}

// ========================================
// COMPARATIVO: Fase 2 (resultados)
// ========================================

function executarSimulacaoComp() {
    calcComparativo();
    document.getElementById('compFaseInputs').style.display = 'none';
    document.getElementById('compFaseResultados').style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function voltarFaseInputs() {
    document.getElementById('compFaseResultados').style.display = 'none';
    document.getElementById('compFaseInputs').style.display = '';
    // Volta pro step 3 do wizard
    wizardNext(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function calcComparativo() {
    try {
        // ==================
        // FINANCIAMENTO (dados do wizard Caixa)
        // ==================
        const fin = window._caixaFinData || {};
        const valorCredito = fin.valorFinanciado || 0; // Crédito do consórcio é o financiamento

        const entradaFin = fin.entrada || 0;
        const valorFinanciado = fin.valorFinanciado || 0;
        const parcelaInicialFin = fin.parcela1 || 0;
        const parcelaFinalFin = fin.parcelaFinal || 0;
        const totalJurosFin = fin.totalJuros || 0;
        const custoFinalFin = fin.totalPago || 0;
        const prazoFin = fin.prazoFin || 360;
        const sistemaFin = fin.sistema || 'SAC';
        const labelParcelaFinal = `Parcela final (${sistemaFin})`;

        // ==================
        // CONSÓRCIO (cálculo independente para a tela Comparativo)
        // ==================
        const prazoCon = parseInt(document.getElementById('compPrazoGrupo').value) || 200;
        const adesaoPct = parseFloat(document.getElementById('compAdesao').value) || 0;

        let taxaAdm = parseFloat(document.getElementById('compTaxaAdm').value) || 0;
        let fundoReserva = parseFloat(document.getElementById('compFundoReserva').value) || 0;
        let seguro = parseFloat(document.getElementById('compSeguroPrestamista').value) || 0;
        const lanceEmbutidoPct = parseFloat(document.getElementById('compLanceEmbutido').value) / 100 || 0;

        const admVal = document.getElementById('compAdministradora').value;
        const reducao = document.querySelector('input[name="compReducao"]:checked')?.value || 'parcela';

        let parcelaInteiraSeguro = 0;
        let seguroValid = 0;
        if (admVal === 'porto_seguro') {
            seguroValid = 0.038;
        } else if (admVal === 'embracon') {
            seguroValid = 0.055;
        } else if (admVal === 'rodobens') {
            seguroValid = 0.055;
        }

        // Calcula Carta base necessária 
        // Cap Lance Embutido at 30%
        const embutidoEfetivoPct = Math.min(lanceEmbutidoPct, 0.30);
        const cartaBase = valorCredito / (1 - embutidoEfetivoPct);
        const valorEmbutido = cartaBase * embutidoEfetivoPct;
        const adesaoCon = cartaBase * (adesaoPct / 100);
        const valorPagarCon = parseCurrency(document.getElementById('compLancePagar').value) || 0;

        // Calcula parcela original
        const taxaTotalCon = taxaAdm + fundoReserva;
        let parcelaCon = 0;

        if (admVal === 'porto_seguro' || admVal === 'rodobens' || admVal === 'embracon') {
            const fatorTaxaAdm = taxaAdm / prazoCon;
            const fatorFundoReserva = fundoReserva / prazoCon;
            const fatorAmortizacao = 100 / prazoCon;
            const pmc = fatorAmortizacao + fatorTaxaAdm + fatorFundoReserva + seguroValid;
            parcelaCon = cartaBase * (pmc / 100);
        } else if (admVal === 'canopus' || admVal === 'magalu') {
            const fatorTaxaAdm = taxaAdm / prazoCon;
            const fatorFundoReserva = fundoReserva / prazoCon;
            const fatorAmortizacao = 100 / prazoCon;
            const pmc = fatorAmortizacao + fatorTaxaAdm + fatorFundoReserva;
            parcelaCon = cartaBase * (pmc / 100);
        }

        // Simula a Redução
        const saldoDevedorPreLance = (parcelaCon * prazoCon) - parcelaCon; // Aprox apos pagar a 1a
        const valorAbatidoMeses = saldoDevedorPreLance - (valorPagarCon + valorEmbutido);
        let novaParcelaCon = parcelaCon;
        let novoPrazoCon = prazoCon;

        if (reducao === 'parcela') {
            if (valorAbatidoMeses > 0) {
                novaParcelaCon = valorAbatidoMeses / (prazoCon - 1);
            }
        } else {
            if (valorAbatidoMeses > 0 && novaParcelaCon > 0) {
                novoPrazoCon = Math.ceil(valorAbatidoMeses / novaParcelaCon);
            }
        }

        const custoFinalCon = (novaParcelaCon * novoPrazoCon) + parcelaCon + valorPagarCon + adesaoCon;

        // ==================
        // ALUGUEL
        // ==================
        const mesesAluguel = parseInt(document.getElementById('compMesesAluguel').value) || 0;
        const valorAluguel = parseCurrency(document.getElementById('compValorAluguel').value) || 0;
        const custoFinalAluguel = mesesAluguel * valorAluguel;
        const custoFinalConComAluguel = custoFinalCon + custoFinalAluguel;

        // ==================
        // ECONOMIA
        // ==================
        const ecoPuro = custoFinalFin - custoFinalCon;
        const ecoPuroMeses = novaParcelaCon > 0 ? Math.floor(ecoPuro / novaParcelaCon) : 0;

        const ecoAlu = custoFinalFin - custoFinalConComAluguel;
        const ecoAluMeses = novaParcelaCon > 0 ? Math.floor(ecoAlu / novaParcelaCon) : 0;

        // Card Financiamento
        document.getElementById('compCreditoFin').textContent = formatCurrency(valorFinanciado);
        document.getElementById('compPrazoDisplayFin').textContent = prazoFin + " meses"; // FIX: add ' meses' back if needed based on UI, checking UI context.. Let's leave just value if layout says '0 meses' statically or just output number. The layout has 0 meses -> I will put just num if UI has 'meses'. Wait, UI has <span id="...">0</span> meses. So just format num.
        document.getElementById('compPrazoDisplayFin').textContent = prazoFin;
        document.getElementById('compParcelaFin').textContent = formatCurrency(parcelaInicialFin);

        const elFinalFin = document.getElementById('compParcelaFinalFin');
        if (elFinalFin) {
            elFinalFin.textContent = formatCurrency(parcelaFinalFin);
            const labelEl = elFinalFin.closest('.c-row');
            if (labelEl) {
                const lbl = labelEl.querySelector('.c-label');
                if (lbl) lbl.textContent = labelParcelaFinal;
            }
        }

        const elJurosFin = document.getElementById('compJurosFin');
        if (elJurosFin) elJurosFin.textContent = formatCurrency(totalJurosFin);

        document.getElementById('compCustoFinalFin').textContent = formatCurrency(custoFinalFin);

        // Card Consórcio
        document.getElementById('compCreditoCon').textContent = formatCurrency(valorCredito);
        document.getElementById('compCustoEntradaCon').textContent = formatCurrency(valorPagarCon);
        document.getElementById('compPrazoDisplayCon').textContent = Math.round(novoPrazoCon);
        document.getElementById('compParcelaCon').textContent = formatCurrency(novaParcelaCon);

        const rowAdesaoCon = document.getElementById('rowAdesaoCon');
        const compAdesaoConDisplay = document.getElementById('compAdesaoConDisplay');
        if (adesaoCon > 0) {
            compAdesaoConDisplay.textContent = formatCurrency(adesaoCon);
            if (rowAdesaoCon) rowAdesaoCon.style.display = 'flex';
        } else {
            if (rowAdesaoCon) rowAdesaoCon.style.display = 'none';
        }

        // Custo total Consórcio simplificado para display (Lance + Parcelas)
        let jurosFake = custoFinalCon - valorCredito;
        if (jurosFake < 0) jurosFake = 0;
        const compJurosConEl = document.getElementById('compJurosCon');
        if (compJurosConEl) compJurosConEl.textContent = formatCurrency(jurosFake);

        const compCustoFinalConEl = document.getElementById('compCustoFinalCon');
        if (compCustoFinalConEl) compCustoFinalConEl.textContent = formatCurrency(custoFinalCon);

        // Aluguel display
        const rowAluguel = document.getElementById('rowAluguelCon');
        const txtAluguel = document.getElementById('compCustoAluguelCon');

        if (mesesAluguel > 0 && valorAluguel > 0) {
            if (rowAluguel) rowAluguel.style.display = 'flex';
            if (txtAluguel) txtAluguel.textContent = formatCurrency(custoFinalAluguel);
            if (compCustoFinalConEl) compCustoFinalConEl.textContent = formatCurrency(custoFinalConComAluguel);
        } else {
            if (rowAluguel) rowAluguel.style.display = 'none';
        }

        // Resumo Economia
        const resEcoVal = document.getElementById('compEcoPuroVal');
        const diffMeses = prazoFin > prazoCon ? (prazoFin - Math.round(novoPrazoCon)) : 0;
        const isAluguelAtivo = mesesAluguel > 0 && valorAluguel > 0;
        const finalEcoR = isAluguelAtivo ? ecoAlu : ecoPuro;
        const finalCustoCon = isAluguelAtivo ? custoFinalConComAluguel : custoFinalCon;

        if (resEcoVal) {
            resEcoVal.textContent = formatCurrency(finalEcoR);
        }

        const compDiffMeses = document.getElementById('compDiffMeses');
        if (compDiffMeses) compDiffMeses.textContent = diffMeses + " meses mais rápido";

        // Progress Bars limitadas e atualizadas
        let percentFin = 100;
        let percentCon = 100;
        if (custoFinalFin > 0 || finalCustoCon > 0) {
            if (custoFinalFin >= finalCustoCon) {
                percentFin = 100;
                percentCon = Math.max(0, (finalCustoCon / custoFinalFin) * 100);
            } else {
                percentCon = 100;
                percentFin = Math.max(0, (custoFinalFin / finalCustoCon) * 100);
            }
        }

        const barFin = document.getElementById('barFin');
        if (barFin) barFin.style.width = percentFin + '%';
        const txtBarFin = document.getElementById('barValFin');
        if (txtBarFin) txtBarFin.textContent = formatCurrency(custoFinalFin);

        const barCon = document.getElementById('barCon');
        if (barCon) barCon.style.width = percentCon + '%';
        const txtBarCon = document.getElementById('barValCon');
        if (txtBarCon) txtBarCon.textContent = formatCurrency(finalCustoCon);

    } catch (e) {
        console.error('Erro ao calcular comparativo:', e);
    }
}

// ========================================
// PDF DISPATCHER
// ========================================
window.gerarPDF = function() {
    const simuladorTab = document.getElementById('tabSimulador');
    const isSimuladorActive = simuladorTab && simuladorTab.classList.contains('active');
    
    if (isSimuladorActive) {
        if (typeof gerarPDFSimulador === 'function') {
            gerarPDFSimulador();
        } else {
            console.error('gerarPDFSimulador não está definido. Verifique pdf_simulador.js');
        }
    } else {
        if (typeof gerarPDFComparativo === 'function') {
            gerarPDFComparativo();
        } else {
            console.error('gerarPDFComparativo não está definido. Verifique pdf_comp.js');
        }
    }
};
