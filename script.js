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
            if (adminKey === 'porto_seguro') {
                const limiteEmbutido = 0.30 * credito;
                const valorLanceOfertado = lanceTotalPct * baseCalculo;
                
                // Embutido usa estritamente % em relação ao crédito (até 30%)
                valorEmbutido = Math.min(lanceEmbutidoPct, 0.30) * credito;
                
                // O resto sai do bolso do cliente apenas se ultrapassar o limite real da cota
                valorAPagar = Math.max(valorLanceOfertado - limiteEmbutido, 0);
                valorTotalLance = valorLanceOfertado;
            } else {
                const limiteEmbutido = 0.30 * credito;
                valorEmbutido = Math.min(lanceEmbutidoPct * baseCalculo, limiteEmbutido);
                valorAPagar = lancePagarPct * baseCalculo;
                valorTotalLance = valorEmbutido + valorAPagar;
            }
        }
    } else {
        // Modo Reverso: Usuário digitou $ no campo a Pagar
        const valorPagarDigitado = parseCurrency(document.getElementById('valorPagar').value);
        valorAPagar = valorPagarDigitado;

        if (adminKey === 'porto_seguro') {
            // Embutido base: usa estritamente o percentual digitado limitando a 30% do crédito
            const limiteEmbutido = 0.30 * credito;
            const valorEmbutidoDesejado = lanceEmbutidoPct * credito;
            valorEmbutido = Math.min(valorEmbutidoDesejado, limiteEmbutido);
        } else {
            // Embutido base: usa estritamente o percentual digitado (limitado a 30% do crédito)
            const limiteEmbutido = 0.30 * credito;
            let embutidoDesejado = lanceEmbutidoPct * baseCalculo;
            if (embutidoDesejado > limiteEmbutido) embutidoDesejado = limiteEmbutido;
            valorEmbutido = embutidoDesejado;
        }

        valorTotalLance = valorAPagar + valorEmbutido;

        // Atualiza campos inativos (%)
        let pctCalculada = valorTotalLance / baseCalculo;
        if (pctCalculada < 0) pctCalculada = 0;

        let pagarPctCalc = pctCalculada - (valorEmbutido / baseCalculo);
        if (pagarPctCalc < 0) pagarPctCalc = 0;
        document.getElementById('lancePagar').value = (pagarPctCalc * 100).toFixed(2);
    }

    // ========================================
    // CRÉDITO LÍQUIDO
    // ========================================
    let descontoCreditoLiquido = valorEmbutido;
    if (adminKey === 'porto_seguro') {
        const limiteEmbutido = 0.30 * credito;
        if (modoLancePagar === 'pct') {
            const valorLanceOfertado = lanceTotalPct * baseCalculo;
            descontoCreditoLiquido = Math.min(valorLanceOfertado, limiteEmbutido);
        } else {
            descontoCreditoLiquido = Math.max(valorEmbutido, Math.min(valorTotalLance, limiteEmbutido));
        }
    }
    const creditoLiquido = credito - descontoCreditoLiquido;

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

    // We compute the effective total percentage (as the embutido could be capped)
    let efetivoTotalPct = baseCalculo > 0 ? (valorTotalLance / baseCalculo) : 0;
    document.getElementById('lanceTotal').value = (efetivoTotalPct * 100).toFixed(2).replace('.', ',');
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

function gerarPDFSimuladorFrontend() {
    if (typeof html2pdf === 'undefined') {
        alert('Carregando biblioteca PDF... Aguarde um instante e tente novamente.');
        // Retry logic could go here, but alert is enough for now.
        return;
    }
    try {
        const admin = document.getElementById('administradora');
        const adminKey = admin.value;
        const adminName = admin.options[admin.selectedIndex].text;
        const obsEl = document.getElementById('observacoes');
        const observacoes = obsEl ? obsEl.innerHTML.trim() : '';
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

        // Calcule as porcentagens efetivas para o PDF baseadas no baseCalculo real
        const adminKeyForPdf = document.getElementById('administradora').value;
        const isEmbraconPdf = adminKeyForPdf === 'embracon';
        const creditoFloat = parseCurrency(credito);
        const baseCalcPdf = isEmbraconPdf ? creditoFloat : (creditoFloat * (1 + (parseFloat(taxaAdm) || 0)/100 + (parseFloat(fundoReserva) || 0)/100 + (parseFloat(seguroVal) || 0)/100));
        
        const valEmbNum = parseCurrency(valorEmb);
        const valPagNum = parseCurrency(valorPag);
        
        const efetivoEmbPctStr = baseCalcPdf > 0 ? (valEmbNum / baseCalcPdf * 100).toFixed(2).replace('.', ',') : "0,00";
        const efetivoPagPctStr = baseCalcPdf > 0 ? (valPagNum / baseCalcPdf * 100).toFixed(2).replace('.', ',') : "0,00";

        const resultPrim = document.getElementById('resultPrimeiras').value;
        const resultDemais = document.getElementById('resultDemais').value;
        const resultCL = document.getElementById('resultCredLiquido').value;
        const resultPos = document.getElementById('resultPosContemp').value;
        const resultPrazo = document.getElementById('resultPrazoRestante').value;

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const formatterBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        const planoText = formatterBRL.format(baseCalcPdf);

        // Build the content for PDF
        const element = document.createElement('div');
        element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            *{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif}
            #pdf-content{width:210mm;height:295mm;padding:12mm 15mm;background:#fff;position:relative}
            
            /* Header */
            .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}
            .header-left img{height:80px;object-fit:contain}
            .header-center{text-align:left;border-left:2px solid #c9a84c;padding-left:20px;flex:1;margin-left:30px}
            .header-center h2{font-size:16px;font-weight:400;letter-spacing:4px;color:#111;margin-bottom:2px}
            .header-center h1{font-size:30px;font-weight:800;color:#111;line-height:1}
            .header-center .sub{font-size:12px;color:#888;letter-spacing:4px;text-transform:uppercase;margin-top:6px;display:inline-block;border-bottom:2px solid #c9a84c;padding-bottom:6px;width:80%}
            .header-right{text-align:right}
            .header-right span{font-size:9px;color:#aaa;text-transform:uppercase;margin-bottom:5px;display:block}
            .header-right img{height:55px;max-width:140px;object-fit:contain}

            /* Top Banner */
            .top-banner{display:flex;height:100px;margin-bottom:25px}
            .top-left{background:#c9a84c;width:45%;padding:20px 25px;display:flex;flex-direction:column;justify-content:center}
            .top-left .lbl{font-size:11px;font-weight:700;color:#1f1f23;text-transform:uppercase;line-height:1.2;margin-bottom:8px}
            .top-left .val{font-size:28px;font-weight:800;color:#1f1f23}
            .top-right{background:#fdfcf8;width:55%;display:flex;align-items:center;justify-content:space-around;padding:0 15px}
            .tr-item{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
            .tr-item svg{width:26px;height:26px;color:#c9a84c;stroke-width:1.5}
            .tr-item .lbl{font-size:9px;color:#999;text-transform:uppercase;font-weight:500}
            .tr-item .val{font-size:12px;font-weight:800;color:#111}

            /* Columns */
            .cols{display:flex;gap:20px;margin-bottom:25px}
            .col{flex:1;background:#f5f5f5;padding:20px;min-height:300px}
            .col-title{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:800;color:#111;text-transform:uppercase;margin-bottom:20px}
            .col-title svg{width:20px;height:20px;color:#c9a84c}

            .stat-box{background:#fff;padding:12px 15px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;border:1px solid #efefef}
            .sb-left{display:flex;align-items:center;gap:15px}
            .sb-icon{width:40px;height:40px;border-radius:50%;border:1px solid #e0cd9a;display:flex;align-items:center;justify-content:center;background:#fffaf0}
            .sb-icon svg{width:20px;height:20px;color:#c9a84c;stroke-width:1.5}
            .sb-info{display:flex;flex-direction:column}
            .sb-lbl{font-size:9px;font-weight:600;color:#888;text-transform:uppercase;margin-bottom:3px}
            .sb-sub{font-size:8px;color:#aaa;text-transform:uppercase}
            .sb-val{font-size:14px;font-weight:800;color:#111}

            .total-box{margin-top:15px;background:linear-gradient(110deg, #1f1f23 58%, #c9a84c 58%);display:flex;align-items:center;justify-content:space-between;padding:20px 25px}
            .total-lbl{color:#c9a84c;font-size:11px;font-weight:800;text-transform:uppercase}
            .total-val{color:#fff;font-size:24px;font-weight:800}

            /* Rec Banner */
            .rec-banner{background:#fdfcf8;border:1px solid #eee;display:flex;align-items:center;padding:20px;position:relative}
            .rec-border{position:absolute;left:0;top:0;bottom:0;width:12px;background:#c9a84c}
            .rec-icon{margin-left:25px;margin-right:25px}
            .rec-icon svg{width:36px;height:36px;color:#c9a84c;stroke-width:1.5}
            .rec-content h3{font-size:11px;font-weight:800;color:#111;margin-bottom:6px;text-transform:uppercase}
            .rec-content p{font-size:12px;color:#444;line-height:1.5;font-weight:500}

            /* Footer */
            .footer{position:absolute;bottom:12mm;left:15mm;right:15mm;padding-top:10px;border-top:2px solid #c9a84c;font-size:9px;color:#888;display:flex;justify-content:space-between;text-transform:uppercase;letter-spacing:1px}
        </style>

        <div id="pdf-content">
            <div class="header">
                <div class="header-left">
                    <img src="${headerLogoSrc}">
                </div>
                <div class="header-center">
                    <h2>SIMULAÇÃO</h2>
                    <h1>ESTRATÉGICA</h1>
                    <span class="sub">DE CONSÓRCIO</span>
                </div>
                <div class="header-right">
                    <span>ADMINISTRADORA</span>
                    ${adminLogoSrc ? `<img src="${adminLogoSrc}">` : `<span style="font-weight:800;color:#111;font-size:16px">${adminName}</span>`}
                </div>
            </div>

            <div class="top-banner">
                <div class="top-left">
                    <span class="lbl">CRÉDITO DISPONÍVEL<br>PARA AQUISIÇÃO</span>
                    <span class="val">R$ ${credito}</span>
                </div>
                <div class="top-right">
                    <div class="tr-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span class="lbl">PLANO</span>
                        <span class="val">${planoText}</span>
                    </div>
                    <div class="tr-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span class="lbl">PRAZO</span>
                        <span class="val">${prazo} MESES</span>
                    </div>
                    <div class="tr-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                        <span class="lbl">ESTRATÉGIA</span>
                        <span class="val">${lanceTotal}% DE LANCE</span>
                    </div>
                </div>
            </div>

            <div class="cols">
                <!-- ESTRATÉGIA DE LANCE -->
                <div class="col">
                    <div class="col-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><circle cx="10" cy="13" r="2"></circle><path d="M12 13h4"></path></svg>
                        ESTRATÉGIA DE LANCE
                    </div>

                    <div class="stat-box">
                        <div class="sb-left">
                            <div class="sb-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </div>
                            <div class="sb-info">
                                <span class="sb-lbl">LANCE EMBUTIDO</span>
                            </div>
                        </div>
                        <span class="sb-val">R$ ${valorEmb}</span>
                    </div>

                    <div class="stat-box">
                        <div class="sb-left">
                            <div class="sb-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                            <div class="sb-info">
                                <span class="sb-lbl">RECURSO PRÓPRIO</span>
                            </div>
                        </div>
                        <span class="sb-val">R$ ${valorPag}</span>
                    </div>

                    <div class="total-box">
                        <span class="total-lbl">LANCE TOTAL</span>
                        <span class="total-val">${lanceTotal}%</span>
                    </div>
                </div>

                <!-- FLUXO FINANCEIRO -->
                <div class="col">
                    <div class="col-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        FLUXO FINANCEIRO
                    </div>
                    
                    <div class="stat-box">
                        <div class="sb-left">
                            <div class="sb-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                            </div>
                            <div class="sb-info">
                                <span class="sb-lbl">1ª PARCELA <span class="sb-sub" style="display:inline">(ENTRADA)</span></span>
                                
                            </div>
                        </div>
                        <span class="sb-val">R$ ${resultPrim}</span>
                    </div>

                    <div class="stat-box">
                        <div class="sb-left">
                            <div class="sb-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <div class="sb-info">
                                <span class="sb-lbl">PARCELAS ANTES<br>DA CONTEMPLAÇÃO</span>
                            </div>
                        </div>
                        <span class="sb-val">R$ ${resultDemais}</span>
                    </div>

                    <div class="stat-box">
                        <div class="sb-left">
                            <div class="sb-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                            </div>
                            <div class="sb-info">
                                <span class="sb-lbl">PARCELAS APÓS<br>CONTEMPLAÇÃO</span>
                            </div>
                        </div>
                        <span class="sb-val">R$ ${resultPos}</span>
                    </div>

                    <div class="stat-box" style="margin-bottom:0">
                        <div class="sb-left">
                            <div class="sb-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                            <div class="sb-info">
                                <span class="sb-lbl">PRAZO RESTANTE</span>
                            </div>
                        </div>
                        <span class="sb-val">${resultPrazo} MESES</span>
                    </div>
                </div>
            </div>

            <div class="rec-banner">
                <div class="rec-border"></div>
                <div class="rec-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21h6"></path><path d="M12 21v-4"></path><path d="M12 4V2"></path><path d="M4 12H2"></path><path d="M22 12h-2"></path><path d="M18.36 5.64l-1.41 1.41"></path><path d="M7.05 18.36l-1.41 1.41"></path><path d="M7.05 5.64L5.64 7.05"></path><path d="M18.36 18.36l1.41 1.41"></path><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path></svg>
                </div>
                <div class="rec-content">
                    <h3>ESTRATÉGIA RECOMENDADA PELA CR INVEST</h3>
                    <p>Com esta estrutura de lance, você acessa um crédito líquido de R$ ${resultCL} mantendo parcelas estruturadas antes e após a contemplação, sem juros bancários.</p>
                </div>
            </div>

            <div class="footer">
                <span>Data da simulação: ${dateStr.split(' ')[0]}</span>
                <span>SEGURANÇA . PLANEJAMENTO . INTELIGÊNCIA . PATRIMONIAL</span>
                <span>CR INVEST CONSULTORIA</span>
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
        if (typeof gerarPDFSimuladorFrontend === 'function') {
            gerarPDFSimuladorFrontend();
        } else {
            console.error('gerarPDFSimuladorFrontend não está definido na seção frontend de script.js');
        }
    } else {
        if (typeof gerarPDFComparativo === 'function') {
            gerarPDFComparativo();
        } else {
            console.error('gerarPDFComparativo não está definido. Verifique pdf_comp.js');
        }
    }
};
